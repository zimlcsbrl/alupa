/**
 * Regras de sinais para verificação. Cada regra é objetiva, reproduzível e publicada,
 * com as explicações legítimas mais comuns para o achado. Um sinal não é conclusão.
 */
export interface RegraSinal {
  codigo: string;
  titulo: string;
  /** O que exatamente a regra compara. */
  verificamos: string;
  /** Por que o achado merece atenção. */
  porQueImporta: string;
  /** Explicações legítimas frequentes. */
  explicacoesComuns: string[];
  /** Limiar e recortes aplicados, para quem quiser reproduzir. */
  criterio: string;
}

export const REGRAS_SINAIS: RegraSinal[] = [
  {
    codigo: 'mandato-e-contrato-publico',
    titulo: 'Parlamentar no quadro de empresa com contrato público',
    verificamos:
      'Se uma pessoa com mandato de deputado ou senador vigente na data de assinatura do contrato aparece como sócia, administradora ou diretora da empresa contratada por um órgão público.',
    porQueImporta:
      'A Constituição impede deputados e senadores, desde a posse, de serem proprietários, controladores ou diretores de empresa que goze de favor decorrente de contrato com pessoa jurídica de direito público (art. 54, II, a). A regra vale para deputados estaduais (art. 27, § 1º).',
    explicacoesComuns: [
      'A vedação depende de interpretação: contratos com cláusulas uniformes e participações sem poder de controle costumam ser tratados de forma diferente.',
      'A pessoa pode ter deixado a sociedade antes da posse sem que o quadro da Receita tenha sido atualizado.',
      'Homônimo com os mesmos dígitos de CPF (raro, mas possível).',
    ],
    criterio:
      'Mandato vigente na data de assinatura; qualificação de sócio, administrador, diretor ou presidente; qualquer valor.',
  },
  {
    codigo: 'participacao-nao-declarada',
    titulo: 'Participação societária sem cotas declaradas ao TSE',
    verificamos:
      'Se a pessoa já era sócia de uma empresa na data-limite de registro da candidatura e, na declaração de bens daquela eleição, não aparece nenhum item de cotas, quinhões ou participação societária.',
    porQueImporta:
      'A declaração de bens ao TSE deve listar o patrimônio do candidato, incluindo participações em empresas (Lei nº 9.504/1997, art. 11, § 1º, IV). Uma ausência pode indicar declaração incompleta.',
    explicacoesComuns: [
      'A participação pode ter sido declarada sob outra descrição (por exemplo, dentro de "outros bens" ou pelo valor da empresa).',
      'Cotas de valor muito baixo às vezes são omitidas sem intenção.',
      'A data de entrada na Receita pode refletir uma reentrada ou alteração contratual posterior.',
      'Cerca de metade das candidaturas no TSE não declara bem nenhum; nesses casos a ausência não é específica da empresa.',
      'O vínculo entre candidato e sócio é uma possível correspondência (nome completo e seis dígitos do CPF), não uma confirmação.',
    ],
    criterio:
      'Entrada na sociedade antes de 15 de agosto do ano da eleição; qualificação de sócio; só empresas (natureza jurídica empresarial, excluídas associações, fundações e entidades religiosas); nenhum bem que mencione cotas, quinhões, ações, capital social ou empresa, no tipo ou na descrição, naquela candidatura.',
  },
  {
    codigo: 'contrato-desproporcional-capital',
    titulo: 'Contrato muito maior que o capital da empresa',
    verificamos:
      'Se o valor global de um contrato é 50 vezes ou mais o capital social registrado da empresa contratada.',
    porQueImporta:
      'O capital social indica o compromisso financeiro dos sócios. Contratos muito acima dele podem indicar baixa capacidade de execução ou de garantia, pontos que os editais costumam exigir.',
    explicacoesComuns: [
      'Muitos editais exigem patrimônio líquido, não capital social; a empresa pode ser sólida com capital baixo.',
      'Contratos de longa duração ou atas de registro de preço têm valor global alto, executado aos poucos.',
      'O capital pode ter sido aumentado sem atualização na base da Receita.',
    ],
    criterio: 'Valor global ≥ 50 × capital social; capital maior que zero; só empresas.',
  },
  {
    codigo: 'empresa-recente',
    titulo: 'Empresa aberta pouco antes do contrato',
    verificamos:
      'Se a empresa contratada iniciou atividades menos de 12 meses antes da assinatura do contrato.',
    porQueImporta:
      'Empresas muito recentes ganhando contratos públicos são um padrão observado em casos de empresas de fachada, e também merecem atenção quanto à comprovação de experiência.',
    explicacoesComuns: [
      'Empresas novas podem competir legalmente e são comuns em credenciamentos e contratos de menor valor.',
      'A empresa pode ser sucessora de outra mais antiga (reorganização societária).',
    ],
    criterio: 'Início de atividade até 365 dias antes da assinatura; só empresas.',
  },
  {
    codigo: 'empresa-situacao-irregular',
    titulo: 'Empresa com cadastro irregular e contrato',
    verificamos:
      'Se a empresa contratada aparece na Receita como inapta, suspensa, baixada ou nula no mês de referência.',
    porQueImporta:
      'A regularidade fiscal e cadastral costuma ser exigida para contratar e para receber pagamentos do poder público.',
    explicacoesComuns: [
      'A situação pode ter mudado depois da assinatura (o cadastro é do mês de referência, não da data do contrato).',
      'Inaptidão por pendência de declaração costuma ser regularizada rapidamente.',
    ],
    criterio: 'Situação cadastral diferente de "Ativa" no mês de referência da Receita.',
  },
];

export const regraSinal = (codigo: string) => REGRAS_SINAIS.find((r) => r.codigo === codigo);

/** Naturezas jurídicas empresariais (grupo 2 da tabela da Receita). */
export const naturezaEmpresarial = (codigo: number | null | undefined) =>
  codigo != null && codigo >= 2000 && codigo < 3000;

/**
 * Indica se um bem declarado ao TSE pode representar participação societária, pelo tipo ou
 * pela descrição. Candidatos costumam declarar cotas com o tipo errado (ex.: "Outros bens
 * imóveis" com descrição "99% das quotas da empresa X"); na dúvida, conta como declarado.
 */
export const ehBemDeParticipacao = (tipoOuDescricao: string) =>
  /quota|\bcotas?\b|quinh|a[cç][oõ]es|participa[cç]|capital social|\bltda\b|eireli|empresa|\bs\.?\s?a\b|sociedade/i.test(
    tipoOuDescricao,
  );
