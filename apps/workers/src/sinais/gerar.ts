import type { Database } from '@alupa/db';
import { schema } from '@alupa/db';
import { REGRAS_SINAIS } from '@alupa/domain';
import { and, eq, inArray, isNotNull, notInArray, sql } from 'drizzle-orm';
import { avaliarSinais } from './avaliar';

const { bemDeclarado, candidatura, contrato, mandato, organizacao, participacaoSocietaria, sinal } =
  schema;

/** Recalcula os sinais. Achados que sumiram ficam inativos; a situação editorial é preservada. */
export async function gerarSinais(db: Database) {
  const [ultima] = await db
    .select({ r: sql<string>`max(${participacaoSocietaria.referencia})` })
    .from(participacaoSocietaria);
  if (!ultima?.r) return { achados: 0, porRegra: {} };

  const ligacoes = await db
    .select({
      pessoaId: participacaoSocietaria.pessoaId,
      organizacaoId: participacaoSocietaria.organizacaoId,
      qualificacao: participacaoSocietaria.qualificacao,
      entradaEm: participacaoSocietaria.entradaEm,
      naturezaCodigo: organizacao.naturezaJuridicaCodigo,
      capitalSocial: organizacao.capitalSocial,
      situacaoCadastral: organizacao.situacaoCadastral,
      inicioAtividade: organizacao.inicioAtividade,
      referencia: participacaoSocietaria.referencia,
      confianca: participacaoSocietaria.confianca,
    })
    .from(participacaoSocietaria)
    .innerJoin(organizacao, eq(organizacao.id, participacaoSocietaria.organizacaoId))
    .where(
      and(
        eq(participacaoSocietaria.referencia, ultima.r),
        isNotNull(participacaoSocietaria.organizacaoId),
      ),
    );

  const pessoas = [...new Set(ligacoes.map((l) => l.pessoaId))];
  const empresas = [...new Set(ligacoes.map((l) => l.organizacaoId!))];

  const [contratos, mandatos, candidaturas] = await Promise.all([
    empresas.length
      ? db
          .select({
            id: contrato.id,
            organizacaoId: contrato.fornecedorId,
            valorGlobal: contrato.valorGlobal,
            assinadoEm: contrato.assinadoEm,
            orgaoNome: contrato.orgaoNome,
            numeroControlePncp: contrato.numeroControlePncp,
          })
          .from(contrato)
          .where(inArray(contrato.fornecedorId, empresas))
      : [],
    pessoas.length
      ? db
          .select({
            pessoaId: mandato.pessoaId,
            cargo: mandato.cargo,
            inicio: mandato.inicio,
            fim: mandato.fim,
          })
          .from(mandato)
          .where(inArray(mandato.pessoaId, pessoas))
      : [],
    pessoas.length
      ? db
          .select({
            id: candidatura.id,
            pessoaId: candidatura.pessoaId,
            ano: candidatura.ano,
            cargo: candidatura.cargo,
            tiposDeBem: sql<
              string[]
            >`coalesce(array_agg(${bemDeclarado.tipo} || ' ' || coalesce(${bemDeclarado.descricao}, '')) FILTER (WHERE ${bemDeclarado.tipo} IS NOT NULL), '{}')`,
          })
          .from(candidatura)
          .leftJoin(bemDeclarado, eq(bemDeclarado.candidaturaId, candidatura.id))
          .where(inArray(candidatura.pessoaId, pessoas))
          .groupBy(candidatura.id)
      : [],
  ]);

  const achados = avaliarSinais({
    ligacoes: ligacoes.map((l) => ({ ...l, organizacaoId: l.organizacaoId! })),
    contratos: contratos.map((c) => ({ ...c, organizacaoId: c.organizacaoId! })),
    mandatos,
    candidaturas,
  });

  await db.transaction(async (tx) => {
    for (let i = 0; i < achados.length; i += 500) {
      await tx
        .insert(sinal)
        .values(achados.slice(i, i + 500).map((a) => ({ ...a, ativo: true })))
        .onConflictDoUpdate({
          target: [sinal.regra, sinal.chave],
          set: {
            evidencia: sql`excluded.evidencia`,
            valorReferencia: sql`excluded.valor_referencia`,
            ativo: true,
            atualizadoEm: sql`now()`,
          },
        });
    }
    // Achados que não apareceram nesta execução deixam de ser exibidos (sem apagar o histórico).
    const regras = REGRAS_SINAIS.map((r) => r.codigo);
    const atuais = achados.map((a) => `${a.regra}|${a.chave}`);
    await tx
      .update(sinal)
      .set({ ativo: false, atualizadoEm: sql`now()` })
      .where(
        and(
          inArray(sinal.regra, regras),
          atuais.length
            ? notInArray(sql`${sinal.regra} || '|' || ${sinal.chave}`, atuais)
            : undefined,
        ),
      );
  });

  const porRegra: Record<string, number> = {};
  for (const a of achados) porRegra[a.regra] = (porRegra[a.regra] ?? 0) + 1;
  return { achados: achados.length, porRegra, referencia: ultima.r };
}
