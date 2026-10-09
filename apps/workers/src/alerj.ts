import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { alerj } from '@alupa/connectors';
import type { Database } from '@alupa/db';
import { schema } from '@alupa/db';
import { semAcentos, slugify } from '@alupa/domain';
import { and, eq, sql } from 'drizzle-orm';
import type { Logger } from 'pino';
import { z } from 'zod';

const { candidatura, contatoPublico, enteFederativo, identificadorExterno, mandato, pessoa } =
  schema;

const PAUSA_MS = 400;
const pausa = () => new Promise((r) => setTimeout(r, PAUSA_MS));

/** Comparação de nomes sem acentos, pontuação ou espaços duplicados. */
export const normalizar = (nome: string) =>
  semAcentos(nome)
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Importa os deputados estaduais do RJ em exercício, com mandato e contatos oficiais.
 *
 * A ALERJ não publica CPF. A pessoa é ligada às candidaturas do TSE pelo nome, mas só
 * dentro dos candidatos a deputado estadual do RJ em 2022, e só quando o nome é único.
 * Casos ambíguos ou sem correspondência são criados à parte e listados para revisão.
 */
export async function importarAlerj(db: Database, log: Logger) {
  const lista = await alerj.deputadosEmExercicio();
  const verificadoEm = new Date();

  const [rj] = await db
    .select({ id: enteFederativo.id })
    .from(enteFederativo)
    .where(eq(enteFederativo.codigoIbge, '33'));
  if (!rj) throw new Error('UF RJ não carregada. Rode pnpm db:seed.');
  if (!lista.inicio || !lista.fim)
    throw new Error('Período da legislatura não encontrado na página.');

  // Candidatos a deputado estadual do RJ em 2022, por nome de urna e nome completo.
  const candidatos = await db
    .select({
      pessoaId: candidatura.pessoaId,
      nomeUrna: candidatura.nomeUrna,
      nomeCompleto: pessoa.nomeCompleto,
    })
    .from(candidatura)
    .innerJoin(pessoa, eq(pessoa.id, candidatura.pessoaId))
    .where(
      and(eq(candidatura.ano, 2022), eq(candidatura.codigoCargo, 7), eq(candidatura.siglaUf, 'RJ')),
    );

  const indice = new Map<string, Set<string>>();
  for (const c of candidatos) {
    for (const nome of [c.nomeUrna, c.nomeCompleto]) {
      if (!nome) continue;
      const k = normalizar(nome);
      indice.set(k, (indice.get(k) ?? new Set()).add(c.pessoaId));
    }
  }

  const jaImportados = new Map(
    (
      await db
        .select({ valor: identificadorExterno.valor, id: identificadorExterno.entidadeId })
        .from(identificadorExterno)
        .where(
          and(
            eq(identificadorExterno.sistema, 'alerj'),
            eq(identificadorExterno.entidadeTipo, 'pessoa'),
          ),
        )
    ).map((r) => [r.valor, r.id]),
  );
  const slugs = new Set((await db.select({ slug: pessoa.slug }).from(pessoa)).map((p) => p.slug));

  const vinculosManuais = await carregarVinculosManuais(db, 'alerj', log);
  const paraRevisar: { id: string; nome: string; motivo: string }[] = [];
  let ligadosAoTse = 0;

  for (const d of lista.deputados) {
    const perfil = await alerj.perfil(d.id, d.legislatura);
    await pausa();
    const urlPerfil = alerj.urlPerfil(d.id, d.legislatura);

    // Vínculo revisado por uma pessoa da equipe tem prioridade sobre qualquer regra automática.
    const manual = vinculosManuais.get(d.id);
    if (manual) {
      const anterior = jaImportados.get(d.id);
      if (anterior && anterior !== manual) await mesclarPessoa(db, anterior, manual);
      if (anterior !== manual) {
        await db
          .insert(identificadorExterno)
          .values({ sistema: 'alerj', valor: d.id, entidadeTipo: 'pessoa', entidadeId: manual })
          .onConflictDoUpdate({
            target: [
              identificadorExterno.sistema,
              identificadorExterno.valor,
              identificadorExterno.entidadeTipo,
            ],
            set: { entidadeId: manual },
          });
        jaImportados.set(d.id, manual);
      }
    }

    let pessoaId = jaImportados.get(d.id);
    if (!pessoaId) {
      const encontrados = indice.get(normalizar(d.nome));
      if (encontrados?.size === 1) {
        pessoaId = [...encontrados][0]!;
        ligadosAoTse++;
      } else {
        paraRevisar.push({
          id: d.id,
          nome: d.nome,
          motivo: encontrados
            ? `${encontrados.size} candidaturas com o mesmo nome`
            : 'nome não encontrado no TSE 2022',
        });
        let slug = `${slugify(d.nome)}-rj`;
        if (slugs.has(slug)) slug = `${slug}-alerj-${d.id}`;
        slugs.add(slug);
        const [nova] = await db
          .insert(pessoa)
          .values({
            nome: tituloProprio(d.nome),
            slug,
            fotoUrl: perfil.fotoOficialUrl ?? d.fotoUrl,
          })
          .returning({ id: pessoa.id });
        pessoaId = nova!.id;
      }
      await db
        .insert(identificadorExterno)
        .values({ sistema: 'alerj', valor: d.id, entidadeTipo: 'pessoa', entidadeId: pessoaId })
        .onConflictDoNothing();
    }

    // A foto oficial da Casa só preenche quem ainda não tem foto.
    await db
      .update(pessoa)
      .set({ fotoUrl: sql`coalesce(${pessoa.fotoUrl}, ${perfil.fotoOficialUrl ?? d.fotoUrl})` })
      .where(eq(pessoa.id, pessoaId));

    await db
      .insert(mandato)
      .values({
        pessoaId,
        cargo: 'deputado_estadual',
        enteId: rj.id,
        ufId: rj.id,
        partido: d.partido,
        inicio: lista.inicio,
        fim: lista.fim,
        situacao: 'Em exercício',
        idNaFonte: `alerj:${d.legislatura}:${d.id}`,
        fonteUrl: urlPerfil,
        verificadoEm,
      })
      .onConflictDoUpdate({
        target: mandato.idNaFonte,
        set: {
          pessoaId: sql`excluded.pessoa_id`,
          partido: sql`excluded.partido`,
          situacao: sql`excluded.situacao`,
          inicio: sql`excluded.inicio`,
          fim: sql`excluded.fim`,
          verificadoEm,
          atualizadoEm: sql`now()`,
        },
      });

    const contatos = [
      ...(perfil.email
        ? [
            {
              tipo: 'gabinete' as const,
              canal: 'email' as const,
              valor: perfil.email,
              rotulo: 'E-mail do gabinete',
            },
          ]
        : []),
      ...(perfil.telefone
        ? [
            {
              tipo: 'gabinete' as const,
              canal: 'telefone' as const,
              valor: perfil.telefone,
              rotulo: 'Telefone',
            },
          ]
        : []),
      {
        tipo: 'institucional' as const,
        canal: 'site' as const,
        valor: urlPerfil,
        rotulo: 'Página oficial',
      },
    ];
    for (const c of contatos) {
      await db
        .insert(contatoPublico)
        .values({
          entidadeTipo: 'pessoa',
          entidadeId: pessoaId,
          ...c,
          fonteUrl: urlPerfil,
          verificadoEm,
        })
        .onConflictDoUpdate({
          target: [
            contatoPublico.entidadeTipo,
            contatoPublico.entidadeId,
            contatoPublico.canal,
            contatoPublico.valor,
          ],
          set: { verificadoEm, situacao: 'publicado', atualizadoEm: sql`now()` },
        });
    }
  }

  if (paraRevisar.length > 0) {
    log.warn({ paraRevisar }, 'deputados estaduais sem ligação automática com o TSE: revisar');
  }
  return { deputados: lista.deputados.length, ligadosAoTse, paraRevisar: paraRevisar.length };
}

function tituloProprio(nome: string) {
  const minusculas = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);
  return nome
    .toLowerCase()
    .split(/\s+/)
    .map((p, i) => (i > 0 && minusculas.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(' ');
}

const ARQUIVO_VINCULOS = path.resolve(import.meta.dirname, '../../../dados/vinculos-manuais.json');

const vinculoSchema = z.object({
  fonte: z.string(),
  idNaFonte: z.string(),
  nomeNaFonte: z.string(),
  pessoa: z.string().describe('slug da pessoa de destino'),
  justificativa: z.string().min(10),
  confirmado: z.boolean(),
  revisadoPor: z.string().nullish(),
  revisadoEm: z.string().nullish(),
});

/** Vínculos manuais confirmados para uma fonte: id na fonte → id da pessoa. */
export async function carregarVinculosManuais(db: Database, fonte: string, log: Logger) {
  const mapa = new Map<string, string>();
  let bruto: unknown;
  try {
    bruto = JSON.parse(await readFile(ARQUIVO_VINCULOS, 'utf8'));
  } catch {
    return mapa;
  }
  const vinculos = z.object({ vinculos: z.array(vinculoSchema) }).parse(bruto).vinculos;
  for (const v of vinculos.filter((x) => x.fonte === fonte && x.confirmado)) {
    const [alvo] = await db.select({ id: pessoa.id }).from(pessoa).where(eq(pessoa.slug, v.pessoa));
    if (!alvo) {
      log.warn({ vinculo: v }, 'vínculo manual aponta para pessoa inexistente: ignorado');
      continue;
    }
    mapa.set(v.idNaFonte, alvo.id);
  }
  return mapa;
}

/**
 * Junta uma pessoa duplicada (criada sem ligação) à pessoa correta: move mandatos, contatos,
 * identificadores e matérias, e remove a duplicata se ela não tiver mais nada.
 */
async function mesclarPessoa(db: Database, origem: string, destino: string) {
  await db.transaction(async (tx) => {
    await tx.update(mandato).set({ pessoaId: destino }).where(eq(mandato.pessoaId, origem));
    await tx.update(candidatura).set({ pessoaId: destino }).where(eq(candidatura.pessoaId, origem));
    await tx
      .update(contatoPublico)
      .set({ entidadeId: destino })
      .where(
        and(
          eq(contatoPublico.entidadeTipo, 'pessoa'),
          eq(contatoPublico.entidadeId, origem),
          sql`NOT EXISTS (SELECT 1 FROM core.contato_publico d WHERE d.entidade_tipo = 'pessoa'
            AND d.entidade_id = ${destino} AND d.canal = ${contatoPublico.canal} AND d.valor = ${contatoPublico.valor})`,
        ),
      );
    await tx
      .delete(contatoPublico)
      .where(and(eq(contatoPublico.entidadeTipo, 'pessoa'), eq(contatoPublico.entidadeId, origem)));
    await tx
      .update(identificadorExterno)
      .set({ entidadeId: destino })
      .where(
        and(
          eq(identificadorExterno.entidadeTipo, 'pessoa'),
          eq(identificadorExterno.entidadeId, origem),
        ),
      );
    await tx.execute(
      sql`UPDATE core.materia_pessoa SET pessoa_id = ${destino} WHERE pessoa_id = ${origem}
          AND NOT EXISTS (SELECT 1 FROM core.materia_pessoa x WHERE x.materia_id = core.materia_pessoa.materia_id AND x.pessoa_id = ${destino})`,
    );
    await tx.execute(sql`DELETE FROM core.materia_pessoa WHERE pessoa_id = ${origem}`);
    await tx.delete(pessoa).where(eq(pessoa.id, origem));
  });
}
