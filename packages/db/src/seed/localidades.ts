import { ibge } from '@alupa/connectors';
import { slugify } from '@alupa/domain';
import { sql } from 'drizzle-orm';
import type { Database } from '../client';
import { enteFederativo, identificadorExterno } from '../schema';

const CODIGO_UF_DF = '53';
const LOTE = 1000;

function lotes<T>(itens: T[], tamanho = LOTE): T[][] {
  const resultado: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) resultado.push(itens.slice(i, i + tamanho));
  return resultado;
}

/**
 * Carrega União, UFs e municípios a partir da API de Localidades do IBGE.
 * Idempotente: atualiza nomes pelo código IBGE e não duplica registros.
 * O DF tem esfera "distrital"; Brasília (5300108) também, pois o DF não se divide em municípios.
 */
export async function seedLocalidades(db: Database) {
  const [ufs, municipios] = await Promise.all([ibge.listarUfs(), ibge.listarMunicipios()]);

  await db
    .insert(enteFederativo)
    .values({ esfera: 'federal', nome: 'União', slug: 'brasil' })
    .onConflictDoNothing({ target: enteFederativo.slug });

  const ufsGravadas = await db
    .insert(enteFederativo)
    .values(
      ufs.map((uf) => ({
        esfera: uf.codigo === CODIGO_UF_DF ? ('distrital' as const) : ('estadual' as const),
        codigoIbge: uf.codigo,
        nome: uf.nome,
        siglaUf: uf.sigla,
        slug: uf.sigla.toLowerCase(),
      })),
    )
    .onConflictDoUpdate({
      target: enteFederativo.codigoIbge,
      set: { nome: sql`excluded.nome`, atualizadoEm: sql`now()` },
    })
    .returning({ id: enteFederativo.id, codigoIbge: enteFederativo.codigoIbge });

  const idPorUf = new Map(ufsGravadas.map((u) => [u.codigoIbge, u.id]));

  const municipiosGravados: { id: string; codigoIbge: string | null }[] = [];
  for (const lote of lotes(municipios)) {
    const gravados = await db
      .insert(enteFederativo)
      .values(
        lote.map((m) => {
          const ufId = idPorUf.get(m.codigoUf);
          if (!ufId)
            throw new Error(`UF ${m.codigoUf} não encontrada para o município ${m.codigo}.`);
          return {
            esfera: m.codigoUf === CODIGO_UF_DF ? ('distrital' as const) : ('municipal' as const),
            codigoIbge: m.codigo,
            nome: m.nome,
            siglaUf: m.siglaUf,
            ufId,
            slug: `${slugify(m.nome)}-${m.siglaUf.toLowerCase()}`,
          };
        }),
      )
      .onConflictDoUpdate({
        target: enteFederativo.codigoIbge,
        set: { nome: sql`excluded.nome`, ufId: sql`excluded.uf_id`, atualizadoEm: sql`now()` },
      })
      .returning({ id: enteFederativo.id, codigoIbge: enteFederativo.codigoIbge });
    municipiosGravados.push(...gravados);
  }

  // Guarda o código IBGE também como identificador externo, como fazemos para toda fonte.
  const identificadores = [...ufsGravadas, ...municipiosGravados].map((e) => ({
    sistema: 'ibge',
    valor: e.codigoIbge!,
    entidadeTipo: 'ente_federativo',
    entidadeId: e.id,
  }));
  for (const lote of lotes(identificadores)) {
    await db.insert(identificadorExterno).values(lote).onConflictDoNothing();
  }

  return { ufs: ufsGravadas.length, municipios: municipiosGravados.length };
}
