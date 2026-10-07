import { camara, senado } from '@alupa/connectors';
import type { Database } from '@alupa/db';
import { schema } from '@alupa/db';
import { slugify } from '@alupa/domain';
import { and, eq, inArray, sql } from 'drizzle-orm';

const { contatoPublico, enteFederativo, identificadorExterno, mandato, pessoa } = schema;

type Cargo = (typeof schema.cargo.enumValues)[number];

interface Parlamentar {
  sistema: 'camara' | 'senado';
  codigo: string;
  nome: string;
  nomeCompleto: string | null;
  fotoUrl: string | null;
  uf: string;
  partido: string | null;
  cargo: Cargo;
  mandato: { idNaFonte: string; inicio: string; fim: string; situacao: string | null };
  fonteUrl: string;
  email: string | null;
  paginaOficial: string;
}

async function parlamentaresEmExercicio(): Promise<Parlamentar[]> {
  const [deputados, senadores] = await Promise.all([
    camara.deputadosEmExercicio(),
    senado.senadoresEmExercicio(),
  ]);

  const legislaturas = new Map<number, { inicio: string; fim: string }>();
  for (const id of new Set(deputados.map((d) => d.idLegislatura))) {
    legislaturas.set(id, await camara.legislatura(id));
  }

  return [
    ...deputados.map((d) => ({
      sistema: 'camara' as const,
      codigo: String(d.id),
      nome: d.nome,
      nomeCompleto: null,
      fotoUrl: d.urlFoto ?? null,
      uf: d.siglaUf,
      partido: d.siglaPartido ?? null,
      cargo: 'deputado_federal' as const,
      mandato: {
        idNaFonte: `camara:${d.idLegislatura}:${d.id}`,
        ...legislaturas.get(d.idLegislatura)!,
        situacao: 'Em exercício',
      },
      fonteUrl: camara.urlApiDeputado(d.id),
      email: d.email ?? null,
      paginaOficial: camara.urlPerfil(d.id),
    })),
    ...senadores.map((s) => ({
      sistema: 'senado' as const,
      codigo: s.codigo,
      nome: s.nome,
      nomeCompleto: s.nomeCompleto,
      fotoUrl: s.fotoUrl,
      uf: s.uf,
      partido: s.partido,
      cargo: 'senador' as const,
      mandato: {
        idNaFonte: `senado:${s.mandato.codigo}`,
        inicio: s.mandato.inicio,
        fim: s.mandato.fim,
        situacao: s.mandato.participacao
          ? `Em exercício (${s.mandato.participacao})`
          : 'Em exercício',
      },
      fonteUrl: senado.URL_LISTA_ATUAL,
      email: s.email,
      paginaOficial:
        s.paginaUrl ?? `https://www25.senado.leg.br/web/senadores/senador/-/perfil/${s.codigo}`,
    })),
  ];
}

/**
 * Importa deputados federais e senadores em exercício, com mandato e contatos públicos.
 * Idempotente: a pessoa é identificada pelo código oficial de cada Casa.
 */
export async function importarParlamentares(db: Database) {
  const parlamentares = await parlamentaresEmExercicio();
  const verificadoEm = new Date();

  const entes = await db
    .select({
      id: enteFederativo.id,
      esfera: enteFederativo.esfera,
      siglaUf: enteFederativo.siglaUf,
      codigoIbge: enteFederativo.codigoIbge,
    })
    .from(enteFederativo)
    .where(sql`${enteFederativo.codigoIbge} IS NULL OR length(${enteFederativo.codigoIbge}) = 2`);
  const uniaoId = entes.find((e) => e.esfera === 'federal')?.id;
  const ufPorSigla = new Map(entes.filter((e) => e.codigoIbge).map((e) => [e.siglaUf!, e.id]));
  if (!uniaoId) throw new Error('Localidades não carregadas. Rode pnpm db:seed.');

  return db.transaction(async (tx) => {
    const existentes = await tx
      .select({
        sistema: identificadorExterno.sistema,
        valor: identificadorExterno.valor,
        id: identificadorExterno.entidadeId,
      })
      .from(identificadorExterno)
      .where(
        and(
          eq(identificadorExterno.entidadeTipo, 'pessoa'),
          inArray(identificadorExterno.sistema, ['camara', 'senado']),
        ),
      );
    const idPorCodigo = new Map(existentes.map((e) => [`${e.sistema}:${e.valor}`, e.id]));
    const slugsUsados = new Set(
      (await tx.select({ slug: pessoa.slug }).from(pessoa)).map((p) => p.slug),
    );

    let novos = 0;
    for (const p of parlamentares) {
      const chave = `${p.sistema}:${p.codigo}`;
      let pessoaId = idPorCodigo.get(chave);

      if (pessoaId) {
        await tx
          .update(pessoa)
          .set({
            nome: p.nome,
            nomeCompleto: p.nomeCompleto ?? sql`${pessoa.nomeCompleto}`,
            fotoUrl: p.fotoUrl,
            atualizadoEm: sql`now()`,
          })
          .where(eq(pessoa.id, pessoaId));
      } else {
        // Slug legível; homônimos recebem o código oficial como desempate.
        let slug = `${slugify(p.nome)}-${p.uf.toLowerCase()}`;
        if (slugsUsados.has(slug)) slug = `${slug}-${p.codigo}`;
        slugsUsados.add(slug);

        const [nova] = await tx
          .insert(pessoa)
          .values({ nome: p.nome, nomeCompleto: p.nomeCompleto, slug, fotoUrl: p.fotoUrl })
          .returning({ id: pessoa.id });
        pessoaId = nova!.id;
        await tx
          .insert(identificadorExterno)
          .values({
            sistema: p.sistema,
            valor: p.codigo,
            entidadeTipo: 'pessoa',
            entidadeId: pessoaId,
          });
        novos++;
      }

      await tx
        .insert(mandato)
        .values({
          pessoaId,
          cargo: p.cargo,
          enteId: uniaoId,
          ufId: ufPorSigla.get(p.uf),
          partido: p.partido,
          inicio: p.mandato.inicio,
          fim: p.mandato.fim,
          situacao: p.mandato.situacao,
          idNaFonte: p.mandato.idNaFonte,
          fonteUrl: p.fonteUrl,
          verificadoEm,
        })
        .onConflictDoUpdate({
          target: mandato.idNaFonte,
          set: {
            partido: sql`excluded.partido`,
            situacao: sql`excluded.situacao`,
            fim: sql`excluded.fim`,
            verificadoEm,
            atualizadoEm: sql`now()`,
          },
        });

      const contatos = [
        ...(p.email
          ? [
              {
                tipo: 'gabinete' as const,
                canal: 'email' as const,
                valor: p.email.trim().toLowerCase(),
                rotulo: 'E-mail do gabinete',
              },
            ]
          : []),
        {
          tipo: 'institucional' as const,
          canal: 'site' as const,
          valor: p.paginaOficial,
          rotulo: 'Página oficial',
        },
      ];
      for (const c of contatos) {
        await tx
          .insert(contatoPublico)
          .values({
            entidadeTipo: 'pessoa',
            entidadeId: pessoaId,
            ...c,
            fonteUrl: p.fonteUrl,
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

    return {
      deputados: parlamentares.filter((p) => p.cargo === 'deputado_federal').length,
      senadores: parlamentares.filter((p) => p.cargo === 'senador').length,
      novos,
    };
  });
}
