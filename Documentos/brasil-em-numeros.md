# Brasil em números

Rota: `/brasil-em-numeros`. Estrutura inicial implementada em 06/10/2026.

## Entrega atual

- Panorama com população recenseada, proporção urbana e renda média domiciliar per capita.
- Distribuição urbana/rural, com valores textuais equivalentes ao gráfico.
- Comparação de renda entre três UFs, explicitamente identificada como seleção.
- Explicação de renda por pessoa e das limitações da média.
- Calculadora de renda local no navegador, com limites da PNAD 2025, resultado por faixa e quantidade estimada de pessoas.
- Espaço para idade, sexo, cor ou raça, território, trabalho, educação e moradia.
- Fontes acessíveis e ano de referência junto aos indicadores.

Os números são um recorte histórico editorial: Censo 2022 e renda nominal de 2024. Não são dados em tempo real nem estimativas de 2026. Valores e fontes estão centralizados em `apps/web/src/content/brasil-em-numeros.ts`. Não inferir percentis a partir das médias apresentadas.

## Estrutura para novas bases

Cada indicador deverá guardar: identificador, conceito, valor, unidade, população de referência, território/código IBGE, período, fonte/URL, data de consulta, revisão e notas metodológicas. Separar renda nominal de renda real; especificar o período de preços quando houver correção monetária. Comparações e filtros só devem combinar bases compatíveis. Não interpolar ausências como zero.

Distribuições futuras: faixas etárias; sexo; cor ou raça conforme autodeclaração e categorias da fonte; grandes regiões, UFs e municípios; escolaridade, ocupação e saneamento. Cada visual precisa de alternativa textual ou tabular e indicação dos limites de cobertura.

## Calculadora de posição na distribuição de renda — critérios

### Quantidade de pessoas e apresentação

O formulário e o gráfico ficam lado a lado no desktop e empilhados no celular. As barras representam a quantidade de pessoas, em escala proporcional à maior faixa, e não o limite de renda. O resultado identifica a faixa selecionada e a quantidade estimada de pessoas nela, sem confundir esse grupo com o percentual acumulado de maior ou menor renda.

Contagens de 2025 conferidas na API do IBGE em 06/10/2026:

- Renda domiciliar: [tabela 7521](https://sidra.ibge.gov.br/tabela/7521), variável 606, classificação 1019. Total: 212.624 mil pessoas.
- Renda do trabalho: [tabela 7537](https://sidra.ibge.gov.br/tabela/7537), variável 10844, classificação 1043. Total: 101.627 mil pessoas ocupadas de 14 anos ou mais com rendimento do trabalho.

As séries da API são convertidas de mil pessoas para pessoas em `distribuicao-renda.ts`. Cada classe simples é vinculada pelo percentil inicial; não incluir classes acumuladas na soma. Os percentuais exibidos são contagem da faixa / total, arredondados para uma casa decimal. As estimativas publicadas podem diferir dos percentuais teóricos dos grupos devido a empates e arredondamentos. As somas arredondadas podem diferir ligeiramente do total publicado. A troca de modalidade usa a população correspondente; editar os campos remove o resultado anterior.

Pergunta: “Com renda de X por mês, qual é minha posição na distribuição?”

1. Definir a comparação antes do valor: **rendimento individual do trabalho** ou **rendimento domiciliar per capita**. Não misturar salário com renda total de todas as fontes.
2. Na modalidade domiciliar, pedir renda total mensal e número de moradores, e explicar quais rendimentos e moradores entram segundo a pesquisa escolhida. Calcular a renda por pessoa.
3. Identificar base, ano, território, conceito bruto/líquido e população de referência. Não prometer comparação municipal se a base não tiver representatividade nesse nível.
4. Usar distribuição ou microdados oficiais validados e seus pesos amostrais. Uma tabela de médias não permite calcular percentis. Na implementação, fixar a versão da base e documentar o tratamento de renda zero, ausente e valores extremos.
5. Definir explicitamente empates: proporção com renda menor, igual ou maior. O percentual “entre os de maior renda” deve usar uma convenção documentada, sem falsa precisão. Se houver apenas faixas, apresentar intervalo em vez de percentual exato.
6. Exibir uma estimativa acompanhada de ano, universo e limitações. Renda não equivale a patrimônio e não resume custo de vida. Não rotular alguém como rico ou pobre apenas pelo percentil.
7. Preferir cálculo local no navegador com tabela agregada, sem registrar o valor pessoal em analytics, URL ou logs. Revisar a política de privacidade caso o funcionamento futuro envolva transmissão ou armazenamento.

Validações antes de liberar: renda zero, limites de faixa, empates, valores negativos/ausentes, separadores monetários brasileiros, moradores inteiros positivos, extremos e monotonicidade dos percentis. Verificar resultados contra referências da própria base e revisar a metodologia antes da publicação.

## Layout público

`ContentPage` oferece abertura comum e índice por seção, preservando IDs explícitos como `contato`. A navegação principal destaca a página atual. Home, páginas institucionais e panorama compartilham Nunito Sans, largura máxima, paleta e componentes visuais. Em telas pequenas, colunas e navegação se reorganizam sem ocultar conteúdo.

## Fontes do recorte

- [IBGE Educa — população urbana e rural, Censo 2022](https://educa.ibge.gov.br/criancas/voce-sabia/22584-populacao-urbana-e-rural.html).
- [IBGE — rendimento domiciliar per capita de 2024](https://agenciadenoticias.ibge.gov.br/agencia-sala-de-imprensa/2013-agencia-de-noticias/releases/42761-ibge-divulga-rendimento-domiciliar-per-capita-2024-para-brasil-e-unidades-da-federacao).
