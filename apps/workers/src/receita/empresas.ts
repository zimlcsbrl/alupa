import { receita } from '@alupa/connectors';
import type { Database } from '@alupa/db';
import { schema } from '@alupa/db';
import { cnpjDaMatriz, slugify } from '@alupa/domain';
import { eq, inArray, sql } from 'drizzle-orm';
import type { Logger } from 'pino';
import { copiar, guardarArquivo, lerLinhasDoZip, tabelaAuxiliar } from './socios';
import type { Armazenamento } from '@alupa/storage';

const { fonte, organizacao, participacaoSocietaria } = schema;

const heapMb = () => Math.round(process.memoryUsage().heapUsed / 1e6);

const titulo = (s: string) =>
  s
    .toLowerCase()
    .replace(/(^|\s)(\S)/g, (_, a: string, b: string) => a + b.toUpperCase())
    .replace(/\b(Da|De|Do|Das|Dos|E)\b/g, (m) => m.toLowerCase());

/** Endereço em uma linha; vazio vira null. */
function montarEndereco(e: receita.LinhaEstabelecimento) {
  const partes = [
    [e.tipoLogradouro, e.logradouro].filter(Boolean).join(' '),
    e.numero && e.numero !== 'S/N' ? e.numero : e.numero ? 's/n' : '',
    e.complemento,
    e.bairro,
  ].filter(Boolean);
  return partes.length ? titulo(partes.join(', ')) : null;
}

/**
 * Completa o cadastro das empresas que aparecem nas participações societárias de um mês:
 * razão social, natureza jurídica, capital social, porte, situação, atividade e endereço da matriz.
 * Lê as tabelas Empresas e Estabelecimentos em fluxo e guarda só os CNPJs de interesse.
 */
export async function enriquecerEmpresas(
  db: Database,
  armazenamento: Armazenamento,
  mes: string,
  log: Logger,
) {
  const [fonteReceita] = await db
    .select({ id: fonte.id })
    .from(fonte)
    .where(eq(fonte.codigo, 'receita-cnpj'));
  if (!fonteReceita) throw new Error('Fonte "receita-cnpj" não cadastrada. Rode pnpm db:seed.');

  const alvos = new Set(
    (
      await db
        .selectDistinct({ cnpjBasico: participacaoSocietaria.cnpjBasico })
        .from(participacaoSocietaria)
        .where(eq(participacaoSocietaria.referencia, mes))
    ).map((r) => r.cnpjBasico),
  );
  log.info({ empresas: alvos.size, mes }, 'empresas a enriquecer');
  if (alvos.size === 0) return { mes, empresas: 0 };

  const [naturezas, cnaes, municipios] = await Promise.all([
    tabelaAuxiliar(mes, 'Naturezas.zip'),
    tabelaAuxiliar(mes, 'Cnaes.zip'),
    tabelaAuxiliar(mes, 'Municipios.zip'),
  ]);

  const empresas = new Map<string, receita.LinhaEmpresa>();
  for (const arquivo of receita.PARTES_EMPRESAS) {
    const { caminho } = await guardarArquivo(db, armazenamento, fonteReceita.id, mes, arquivo, log);
    await lerLinhasDoZip(caminho, (linha) => {
      if (!alvos.has(linha.slice(1, 9))) return; // filtro rápido antes de interpretar a linha
      const e = receita.lerLinhaEmpresa(linha);
      if (e && alvos.has(e.cnpjBasico)) empresas.set(e.cnpjBasico, copiar(e));
    });
    log.info(
      { arquivo, encontradas: empresas.size, heapMb: heapMb() },
      'parte de Empresas processada',
    );
  }

  const matrizes = new Map<string, receita.LinhaEstabelecimento>();
  for (const arquivo of receita.PARTES_ESTABELECIMENTOS) {
    const { caminho } = await guardarArquivo(db, armazenamento, fonteReceita.id, mes, arquivo, log);
    await lerLinhasDoZip(caminho, (linha) => {
      if (!alvos.has(linha.slice(1, 9))) return;
      const e = receita.lerLinhaEstabelecimento(linha);
      if (e?.matriz && alvos.has(e.cnpjBasico)) matrizes.set(e.cnpjBasico, copiar(e));
    });
    log.info(
      { arquivo, encontradas: matrizes.size, heapMb: heapMb() },
      'parte de Estabelecimentos processada',
    );
  }

  let gravadas = 0;
  for (const basico of alvos) {
    const emp = empresas.get(basico);
    if (!emp) continue;
    const est = matrizes.get(basico);
    const cnpj = est?.cnpj ?? cnpjDaMatriz(basico)!;
    const protegido = emp.naturezaJuridica === receita.NATUREZA_EMPRESARIO_INDIVIDUAL;
    const dados = {
      razaoSocial: emp.razaoSocial,
      nomeFantasia: est?.nomeFantasia ?? null,
      naturezaJuridicaCodigo: emp.naturezaJuridica,
      naturezaJuridica: naturezas.get(String(emp.naturezaJuridica).padStart(4, '0')) ?? null,
      capitalSocial: emp.capitalSocial,
      porte: receita.PORTES[emp.porte] ?? null,
      situacaoCadastral: est ? (receita.SITUACOES_CADASTRAIS[est.situacaoCadastral] ?? null) : null,
      situacaoCadastralEm: est?.dataSituacao ?? null,
      inicioAtividade: est?.inicioAtividade ?? null,
      cnaePrincipal: est?.cnaePrincipal ?? null,
      cnaePrincipalDescricao: est ? (cnaes.get(est.cnaePrincipal) ?? null) : null,
      // Empresário individual/MEI: o endereço tende a ser a casa do titular. Só município e UF.
      endereco: est && !protegido ? montarEndereco(est) : null,
      cep: est && !protegido ? est.cep || null : null,
      municipioNome: est ? titulo(municipios.get(est.municipioReceita) ?? '') || null : null,
      siglaUf: est?.uf || null,
      enderecoProtegido: protegido,
      referenciaReceita: mes,
    };

    const [org] = await db
      .insert(organizacao)
      .values({ cnpj, slug: `${slugify(emp.razaoSocial)}-${cnpj}`, ...dados })
      .onConflictDoUpdate({
        target: organizacao.cnpj,
        set: { ...dados, atualizadoEm: sql`now()` },
      })
      .returning({ id: organizacao.id });

    await db
      .update(participacaoSocietaria)
      .set({ organizacaoId: org!.id, razaoSocial: emp.razaoSocial, atualizadoEm: sql`now()` })
      .where(inArray(participacaoSocietaria.cnpjBasico, [basico]));
    gravadas++;
  }

  return {
    mes,
    empresas: alvos.size,
    enriquecidas: gravadas,
    semMatriz: alvos.size - matrizes.size,
  };
}
