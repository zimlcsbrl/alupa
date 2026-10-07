import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Database } from '@alupa/db';
import { schema } from '@alupa/db';
import { eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';

const { materiaImprensa, materiaPessoa, pessoa } = schema;

export const PASTA_IMPRENSA = path.resolve(import.meta.dirname, '../../../dados/imprensa');

const veiculosSchema = z.object({
  veiculos: z.array(
    z.object({ nome: z.string().min(2), dominios: z.array(z.string().min(3)).min(1) }),
  ),
});

const materiaSchema = z.object({
  url: z.url({ protocol: /^https$/ }),
  titulo: z.string().min(5).max(300),
  veiculo: z.string().min(2),
  publicadaEm: z.iso.date(),
  resumo: z.string().max(400).nullish(),
  politicos: z.array(z.string().min(3)).min(1),
  situacao: z.enum(['rascunho', 'publicado', 'retirado']).default('rascunho'),
});

const arquivoSchema = z.object({ materias: z.array(materiaSchema) });

const dominioDe = (url: string) => new URL(url).hostname.replace(/^www\./, '').toLowerCase();

/**
 * Importa as matérias dos arquivos de dados/imprensa. Cada arquivo é validado por inteiro
 * antes de gravar: veículo na lista aprovada, domínio compatível e políticos existentes.
 */
export async function importarImprensa(db: Database) {
  const { veiculos } = veiculosSchema.parse(
    JSON.parse(await readFile(path.join(PASTA_IMPRENSA, 'veiculos.json'), 'utf8')),
  );
  const veiculoPorDominio = new Map(
    veiculos.flatMap((v) => v.dominios.map((d) => [d.replace(/^www\./, '').toLowerCase(), v.nome])),
  );

  const arquivos = (await readdir(PASTA_IMPRENSA)).filter(
    (n) => n.endsWith('.json') && n !== 'veiculos.json',
  );

  const resultado = { arquivos: arquivos.length, materias: 0, erros: [] as string[] };

  for (const nome of arquivos) {
    const erros: string[] = [];
    const leitura = arquivoSchema.safeParse(
      JSON.parse(await readFile(path.join(PASTA_IMPRENSA, nome), 'utf8')),
    );
    if (!leitura.success) {
      resultado.erros.push(`${nome}: formato inválido — ${leitura.error.message}`);
      continue;
    }
    const materias = leitura.data.materias;

    const slugs = [...new Set(materias.flatMap((m) => m.politicos))];
    const pessoas = slugs.length
      ? await db
          .select({ id: pessoa.id, slug: pessoa.slug })
          .from(pessoa)
          .where(inArray(pessoa.slug, slugs))
      : [];
    const idPorSlug = new Map(pessoas.map((p) => [p.slug, p.id]));

    for (const m of materias) {
      const dominio = dominioDe(m.url);
      const aprovado = [...veiculoPorDominio].find(
        ([d]) => dominio === d || dominio.endsWith(`.${d}`),
      );
      if (!aprovado)
        erros.push(`${m.url}: domínio "${dominio}" fora da lista de veículos aprovados`);
      else if (aprovado[1] !== m.veiculo) {
        erros.push(
          `${m.url}: veículo "${m.veiculo}" difere do cadastrado para o domínio ("${aprovado[1]}")`,
        );
      }
      for (const s of m.politicos)
        if (!idPorSlug.has(s)) erros.push(`${m.url}: político "${s}" não existe`);
    }
    if (erros.length > 0) {
      resultado.erros.push(...erros.map((e) => `${nome}: ${e}`));
      continue;
    }

    await db.transaction(async (tx) => {
      for (const m of materias) {
        const [gravada] = await tx
          .insert(materiaImprensa)
          .values({
            url: m.url,
            titulo: m.titulo,
            veiculo: m.veiculo,
            publicadaEm: m.publicadaEm,
            resumo: m.resumo ?? null,
            situacao: m.situacao,
            origem: `dados/imprensa/${nome}`,
          })
          .onConflictDoUpdate({
            target: materiaImprensa.url,
            set: {
              titulo: sql`excluded.titulo`,
              veiculo: sql`excluded.veiculo`,
              publicadaEm: sql`excluded.publicada_em`,
              resumo: sql`excluded.resumo`,
              situacao: sql`excluded.situacao`,
              origem: sql`excluded.origem`,
              atualizadoEm: sql`now()`,
            },
          })
          .returning({ id: materiaImprensa.id });

        // Os políticos da matéria são exatamente os do arquivo.
        await tx.delete(materiaPessoa).where(eq(materiaPessoa.materiaId, gravada!.id));
        await tx
          .insert(materiaPessoa)
          .values(
            m.politicos.map((s) => ({ materiaId: gravada!.id, pessoaId: idPorSlug.get(s)! })),
          );
      }
    });
    resultado.materias += materias.length;
  }
  return resultado;
}
