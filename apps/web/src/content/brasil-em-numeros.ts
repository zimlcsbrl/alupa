// Recorte editorial inicial, não uma integração em tempo real.
// Preserve conceito, unidade, ano e fonte ao atualizar qualquer indicador.
export const brazilSources = {
  census: {
    name: 'IBGE · Censo Demográfico 2022',
    url: 'https://educa.ibge.gov.br/criancas/voce-sabia/22584-populacao-urbana-e-rural.html',
    reference: '2022',
  },
  income: {
    name: 'IBGE · PNAD Contínua 2024',
    url: 'https://agenciadenoticias.ibge.gov.br/agencia-sala-de-imprensa/2013-agencia-de-noticias/releases/42761-ibge-divulga-rendimento-domiciliar-per-capita-2024-para-brasil-e-unidades-da-federacao',
    reference: '2024',
  },
};

export const brazilIndicators = [
  {
    label: 'Pessoas no Brasil',
    value: '203,1',
    unit: 'milhões',
    description: 'População residente recenseada em 2022. Valor arredondado.',
    source: brazilSources.census,
  },
  {
    label: 'População em áreas urbanas',
    value: '87,4',
    unit: '%',
    description: 'Parcela da população que vivia em áreas urbanas em 2022.',
    source: brazilSources.census,
  },
  {
    label: 'Renda mensal por pessoa',
    value: 'R$ 2.069',
    unit: '',
    description: 'Rendimento nominal médio domiciliar per capita em 2024.',
    source: brazilSources.income,
  },
];

export const urbanRural = [
  { label: 'Áreas urbanas', share: 87.4, people: '177,5 milhões', color: 'green' },
  { label: 'Áreas rurais', share: 12.6, people: '25,6 milhões', color: 'yellow' },
];

// Seleção de UFs para ilustrar contrastes, não ranking completo.
export const incomeExamples = [
  { label: 'Distrito Federal', value: 3444 },
  { label: 'São Paulo', value: 2662 },
  { label: 'Maranhão', value: 1077 },
];

export const upcomingTopics = [
  {
    title: 'Idade e composição da população',
    description: 'Faixas etárias, envelhecimento e distribuição por sexo e cor ou raça.',
  },
  {
    title: 'Regiões, estados e municípios',
    description: 'Onde as pessoas vivem, densidade demográfica e diferenças entre territórios.',
  },
  {
    title: 'Trabalho, educação e moradia',
    description:
      'Ocupação, escolaridade, saneamento e condições de vida para contextualizar a renda.',
  },
];
