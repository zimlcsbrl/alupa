# A Lupa

## Documento inicial de produto, estrutura, design e arquitetura

- **Marca definida:** A Lupa.
- **Domínio definido pelo projeto:** alupa.app. Titularidade e configuração não verificadas neste documento.
- **Versão:** 0.1.
- **Data:** 06/10/2026.
- **Status:** concepção e orientação para implementação. Não representa um sistema já desenvolvido.
- **Decisões confirmadas:** alcance nas três esferas, home como centro do produto, cards e links, pesquisa, editorial, manifesto e contatos públicos de políticos e entidades.
- **Propostas iniciais:** identidade visual, textos, stack e sequência de entregas abaixo, sujeitos a refinamento.

## 1. Ideia e propósito

A Lupa é uma plataforma independente para pesquisar, conectar e acompanhar informações públicas brasileiras. Começa com emendas, despesas parlamentares, contratações, contratos e pagamentos, com expansão gradual para outras áreas da administração pública.

O objetivo é permitir que qualquer cidadão entenda quem decidiu, para onde foi o dinheiro, quem recebeu, o que deveria ser entregue e quais esclarecimentos ainda faltam. A plataforma une consulta de dados, conteúdo editorial e participação cidadã.

**Posicionamento proposto:** informação pública que dá para entender, conferir e cobrar.

**Assinatura proposta:** O público é da nossa conta.

O alcance contempla União, estados, Distrito Federal e municípios desde o modelo inicial. A cobertura real cresce por fonte e deve ser informada ao visitante. A ausência de um registro não pode ser apresentada como ausência de uma despesa, contrato ou irregularidade.

## 2. Públicos e usos

| Público | Uso principal |
| --- | --- |
| Cidadão | Pesquisar sua cidade, acompanhar recursos e participar de cobranças. |
| Jornalista | Encontrar documentos, relações e pautas verificáveis. |
| Organização da sociedade civil | Monitorar temas, localidades e casos. |
| Pesquisador | Consultar séries, exportar dados e reproduzir análises. |
| Empresa | Encontrar oportunidades de contratação e seus resultados. |
| Órgão ou representante público | Apresentar esclarecimentos, documentos e correções. |

A consulta básica será aberta. Cadastro será necessário para acompanhar assuntos, receber alertas e enviar contribuições. A identidade de um colaborador não será publicada automaticamente.

## 3. Escopo de informação

### 3.1 Núcleo inicial

- Políticos, mandatos, órgãos, entidades e fornecedores.
- Emendas: autoria, apoios e solicitações identificados, beneficiários e execução disponível.
- Despesas parlamentares e respectivos documentos disponíveis.
- Licitações com propostas abertas e processos em outras situações.
- Contratações diretas, atas, resultados, contratos e aditivos.
- Empenhos, liquidações, pagamentos, estornos e cancelamentos, conforme a fonte.
- Documentos oficiais, evidências de entrega e publicações relacionadas.
- Casos, perguntas públicas, respostas e histórico de acompanhamento.

### 3.2 Expansão

Obras, convênios, políticas públicas, receitas, pessoal, atos administrativos, patrimônio e indicadores de serviços podem virar módulos futuros. O catálogo de dados deve aceitar novos assuntos sem exigir a reconstrução do produto.

"Tudo que é público" é uma direção de expansão, não promessa de cobertura completa. Cada nova categoria terá regras de coleta, publicação, atualização e tratamento de dados pessoais.

## 4. Estrutura do site

| Área | Rota proposta | Conteúdo |
| --- | --- | --- |
| Home | `/` | Pesquisa, cards, novidades, atalhos e convite à participação. |
| Pesquisa | `/pesquisa` | Busca geral com filtros e resultados por categoria. |
| Localidades | `/localidades/[slug]` | Visão de uma UF ou município e cobertura disponível. |
| Políticos | `/politicos/[slug]` | Mandatos, emendas, despesas, contatos e casos relacionados. |
| Entidades | `/entidades/[slug]` | Órgãos, fornecedores e beneficiários, com relações e documentos. |
| Emendas | `/emendas/[id]` | Destinação, execução, participantes e fontes. |
| Contratações | `/contratacoes/[id]` | Edital, itens, situação, resultados e contratos relacionados. |
| Contratos | `/contratos/[id]` | Partes, valores, vigência, aditivos e execução vinculada. |
| Casos | `/casos/[slug]` | Evidências, questionamentos, respostas e pendências. |
| Editorial | `/editorial` | Revista da A Lupa: reportagens, análises, guias e notas, organizadas em seções. |
| Manifesto | `/manifesto` | Propósito e convocação à participação cidadã. |
| Participar | `/participar` | Envio de informação, correção ou colaboração. |
| Metodologia | `/metodologia` | Fontes, critérios, cobertura, limitações e correções. |
| Minha Lupa | `/minha-lupa` | Assuntos acompanhados e preferências de alertas. |

A administração editorial e de dados terá acesso restrito. Slugs legíveis serão acompanhados de identificadores estáveis para evitar ambiguidades entre homônimos.

## 5. Home: principal experiência do produto

A home deve parecer um portal editorial contemporâneo, próximo e útil. O visitante deve conseguir pesquisar ou abrir um assunto relevante imediatamente. Conteúdo real terá prioridade sobre grandes blocos promocionais.

### Ordem proposta

1. **Cabeçalho compacto:** marca A Lupa; Explorar; Editorial; Manifesto; Participar; Entrar.
2. **Pesquisa em destaque:** título curto, campo amplo e exemplos clicáveis.
3. **Atalhos:** Minha cidade, Emendas, Políticos, Licitações abertas, Contratos e Pagamentos.
4. **Sob a lupa:** cards editoriais de casos e temas em acompanhamento.
5. **Perto de você:** seleção manual de cidade/UF e conteúdos relacionados. Geolocalização apenas opcional.
6. **Novidades nos dados:** novas publicações, alterações relevantes e fontes integradas.
7. **Oportunidades e resultados:** contratações com propostas abertas e processos encerrados com resultados disponíveis.
8. **Do editorial:** reportagens, análises e guias em destaque, como a chamada de capa de uma revista.
9. **Convite à participação:** trecho do manifesto e link para colaborar.
10. **Rodapé:** metodologia, fontes e cobertura, sobre, correções, contato, privacidade e termos.

**Texto inicial proposto:**

> O público é da nossa conta.
>
> Pesquise políticos, órgãos, empresas e o caminho do dinheiro público.

**Placeholder da busca:** “Busque por nome, CNPJ, cidade, contrato ou emenda”.

Exemplos de atalhos de pesquisa: “Emendas na minha cidade”, “Licitações com propostas abertas” e “Quem recebeu pagamentos?”.

### Cards

| Tipo | Conteúdo mínimo |
| --- | --- |
| Caso | Título factual, localidade, situação, data e pergunta principal. |
| Contratação | Órgão, objeto, modalidade, situação e prazo quando aplicável. |
| Emenda | Parlamentar ou autoria coletiva, beneficiário, finalidade e valor com etapa identificada. |
| Atualização | O que mudou, fonte e data da mudança observada. |
| Matéria | Título, linha fina, seção, gênero (reportagem, análise, guia, nota), autoria e data. |

Valores devem indicar o que representam: estimado, contratado, empenhado, liquidado ou pago. Imagens são opcionais; cards úteis não podem depender de fotografias genéricas. A home deve evitar rolagem infinita obrigatória e excesso de carrosséis.

## 6. Direção visual

### Personalidade

Editorial, humana, clara e firme. A Lupa deve transmitir curiosidade, rigor e participação. Evitar estética futurista de IA e aparência de portal governamental.

### Proposta de identidade

| Elemento | Diretriz inicial |
| --- | --- |
| Fundo | Papel claro: `#F7F5EF`. |
| Texto | Carvão: `#202321`. |
| Marca e ações | Verde profundo: `#245744`. |
| Destaque pontual | Amarelo quente: `#E9C45A`. |
| Superfícies | Branco quente: `#FFFEFA`. |
| Linhas | Cinza quente: `#DDDAD1`. |
| Títulos | Serifada editorial, como Source Serif 4. |
| Interface | Sans-serif legível, como Source Sans 3. |
| Logo | Nome legível e símbolo simples de lupa, sem excesso de detalhes. |
| Cards | Bordas discretas, raio moderado de 8–12 px e sombra mínima. |

As cores são uma proposta; combinações de texto e fundo deverão ser verificadas quanto ao contraste. O amarelo funciona como realce, não como texto principal sobre fundo claro.

### Evitar

- Neon, hologramas, glassmorphism e gradientes luminosos dominantes.
- Telas escuras como padrão e grandes painéis com aparência de cockpit.
- Ícones de cérebro, robô ou circuitos como identidade do produto.
- Hero enorme, slogans vagos e blocos genéricos de landing page.
- Brasões, excesso de azul burocrático e navegação de repartição pública.
- Uso exclusivo de cor para comunicar situação ou gravidade.

### Layout e acessibilidade

- Desktop: largura de conteúdo aproximada de 1.200 px, com três colunas de cards onde fizer sentido.
- Tablet: duas colunas; celular: uma coluna.
- Busca, título e primeiros cards visíveis cedo no celular.
- Corpo de texto a partir de 16 px, espaçamento confortável e controles de toque adequados.
- Navegação por teclado, foco visível, labels de formulários e títulos semânticos.
- Respeitar preferência de movimento reduzido; animações pequenas e funcionais.
- Valores e tabelas legíveis no celular, com alternativas compactas.
- Linguagem cotidiana: explicar termos como empenho e liquidação no contexto.

## 7. Pesquisa e páginas de detalhes

A busca será unificada, com resultados separados por tipo e filtros compartilháveis na URL: esfera, UF, município, órgão, período, categoria, situação e faixa de valor.

Pesquisar por nome, CNPJ, identificador oficial e texto do objeto. Suportar acentos e variações de grafia. Uma ausência de resultado deve informar os filtros aplicados e eventuais limites de cobertura.

Cada página de detalhe apresenta resumo compreensível, dados objetivos, linha do tempo, documentos, relações confirmadas, fonte e data de atualização. Relações sugeridas serão identificadas e não tratadas como fatos estabelecidos.

Perfis políticos terão histórico de mandatos e cargos. Relações de responsabilidade devem considerar datas: ocupantes atuais não serão automaticamente associados a decisões anteriores.

## 8. E-mails e contatos públicos

Ao cadastrar um político ou entidade, incluir seu e-mail de contato quando estiver publicamente disponível. Priorizar endereço institucional ou divulgado explicitamente para atendimento público.

### Dados do contato

- E-mail e tipo: gabinete, assessoria, atendimento institucional ou outro contato público.
- Titular ou unidade atendida.
- URL da fonte e data da verificação.
- Situação: publicado, desatualizado, inválido ou não encontrado.
- Relação com mandato, cargo ou unidade, quando aplicável.

Permitir vários contatos por perfil. Exibir “Contato público não localizado” quando necessário, sem inventar endereços. Dados enviados por colaboradores passam por verificação antes da publicação.

**Ações iniciais:** copiar endereço, abrir o aplicativo de e-mail e acessar a página oficial de contato. O simples cadastro não dispara mensagens.

Cobranças por e-mail poderão ser uma evolução, com envio explícito pelo usuário ou equipe, revisão do texto e controle de abuso. Evitar campanhas automáticas de disparo em massa. Protocolos, respostas e publicações terão revisão para retirar dados pessoais irrelevantes.

## 9. Editorial e manifesto

### Editorial

O Editorial funciona como a revista da A Lupa, com linguagem e estrutura de jornalismo: capa com destaques, seções fixas, matérias com autoria e expediente.

Seções propostas: Sob a lupa; Entenda o dinheiro público; Na sua cidade; Como participar; Novidades da A Lupa.

Gêneros identificados em cada matéria: reportagem, análise, guia (explicador) e nota. Opinião, quando houver, deve ser rotulada como tal e separada do noticiário.

As matérias poderão vincular políticos, entidades, emendas, contratos e casos. Cada matéria terá título, linha fina, autoria, data de publicação e de atualização, referências e histórico de correções relevantes. Conteúdo editorial e dado importado devem ser distinguíveis.

O CMS inicial usará o mesmo painel administrativo, com rascunho, revisão, publicação agendada, SEO, imagem de capa e preview. Conteúdos fictícios só poderão aparecer em ambiente de demonstração, identificados.

### Manifesto: rascunho inicial

> O dinheiro público tem dono: todos nós.
>
> Ele aparece no imposto que pagamos e deveria aparecer também na escola que funciona, no atendimento de saúde, na rua cuidada e no serviço que chega a quem precisa.
>
> Mas acompanhar esse caminho ainda exige abrir dezenas de sites, entender siglas e procurar documentos espalhados. A informação existe em muitos lugares. Entender o que ela mostra é outra história.
>
> A Lupa nasce para aproximar essas pontas. Queremos tornar os dados públicos compreensíveis, conectar documentos e ajudar a fazer perguntas que merecem resposta.
>
> Você não precisa ser especialista para participar. Pode acompanhar sua cidade, conferir uma obra, compartilhar um documento, apontar um erro ou cobrar um esclarecimento.
>
> Nosso compromisso é conferir as fontes, publicar os critérios, ouvir os envolvidos e corrigir quando errarmos. As mesmas perguntas valem para qualquer partido, governo ou representante.
>
> Cada participação pode ajudar a esclarecer uma conta, verificar uma entrega ou fazer uma informação chegar a mais gente.
>
> Abra a lupa. Escolha um assunto. Participe.

**Chamadas:** “Acompanhar minha cidade”, “Enviar uma informação” e “Entender como verificamos”.

## 10. Participação e cobrança

Permitir seguir localidades, políticos, entidades e casos; enviar documentos; sugerir perguntas; solicitar correções; e contribuir com evidências locais.

Contribuições entram em uma fila de análise. Status propostos: recebida, em análise, precisa de informação, incorporada ou encerrada com justificativa. Fotos e relatos enviados por cidadãos serão separados de registros oficiais.

Cada caso terá evidências, pergunta objetiva, responsável pela resposta, contatos utilizados, protocolos, respostas e pendências. “Sem resposta registrada” deve informar canal e data do contato; não significa admissão de culpa.

Alertas automáticos serão classificados como situações para verificação. Irregularidades confirmadas precisam de referência à decisão ou documento que sustenta essa classificação. Retificações terão destaque proporcional ao conteúdo corrigido.

## 11. Arquitetura inicial

### Stack proposta

| Camada | Tecnologia | Responsabilidade |
| --- | --- | --- |
| Web | Next.js + TypeScript | Home, pesquisa, perfis, editorial e área do usuário. |
| Aplicação/API | Node.js + TypeScript | Regras do produto, consultas, publicação e participação. |
| Coletores | Workers separados; Python para tratamento documental | Integrações, arquivos e OCR quando necessário. |
| Filas | Redis + BullMQ | Agendamento, limites por fonte, tentativas e retomada. |
| Banco | PostgreSQL | Entidades, relações, execução financeira e histórico. |
| Objetos | Cloudflare R2 | Originais, documentos, imagens e snapshots em Parquet. |
| Pesquisa | Busca textual do PostgreSQL inicialmente | Pesquisa e filtros sobre registros normalizados. |
| Análise | DuckDB sobre Parquet | Consolidações e processamento em lote. |
| Operação | Containers, Coolify e infraestrutura dedicada | Implantação, métricas, backups e isolamento. |

Aplicação modular com coletores independentes. A interface consulta o banco próprio, sem depender de chamadas ao portal governamental a cada visita. OCR e coletas extensas rodam em segundo plano.

Busca dedicada e banco analítico adicional entram quando métricas de volume e desempenho justificarem. As relações podem começar em tabelas PostgreSQL, sem banco de grafos obrigatório.

### Camadas de dados

1. **Original:** preservar arquivos e respostas com URL, identificação na fonte, data e hash.
2. **Normalizada:** padronizar datas, valores, identificadores e situações, preservando o valor original.
3. **Publicada:** registros pesquisáveis, relações, agregações, casos e conteúdo editorial.

Coletas serão idempotentes, com checkpoint, novas tentativas, revisitas para retificações e validação de mudanças de formato. Exclusões observadas na fonte devem preservar histórico e motivo quando disponível.

### Modelo nacional

Separar esfera e poder; incluir DF e órgãos autônomos. Usar identificadores próprios e guardar todos os identificadores externos com sua origem.

Núcleo de entidades: ente federativo, órgão, pessoa, mandato, organização, contato público, emenda, transferência, contratação, item, resultado, contrato, aditivo, evento financeiro, entrega, documento, relação, fonte, coleta, artigo, caso, contribuição e usuário.

Chaves de relacionamento: CNPJ, código IBGE, identificadores oficiais e referências documentais. Correspondências apenas por nome exigem revisão. CPF e informações pessoais terão exposição minimizada.

Uma emenda pode financiar vários objetos; um contrato pode ter vários pagamentos e fontes de financiamento. O modelo deve aceitar relações múltiplas. Não somar etapas financeiras como se fossem despesas distintas, nem duplicar registros obtidos de diferentes portais.

Autoria, apoio, solicitação, execução e fiscalização serão papéis separados. Indicar recurso não equivale automaticamente a escolher fornecedor ou executar contrato.

### Fontes prioritárias

| Fonte | Finalidade |
| --- | --- |
| PNCP | Contratações, atas, resultados, contratos e documentos publicados. |
| Compras.gov.br/SIASG | Complementação e histórico dos sistemas abrangidos. |
| Portal da Transparência | Emendas e execução federal disponível. |
| Transferegov | Transferências e documentação de execução disponível. |
| Câmara e Senado | Mandatos e despesas parlamentares. |
| Siconfi/Tesouro | Contexto fiscal e contábil, sem substituir pagamentos individualizados. |
| Portais locais e tribunais de contas | Detalhamento estadual e municipal. |
| Diários oficiais | Publicações e complementação documental. |

Cada conector terá registro de cobertura por período, ente e categoria. Endpoints, autenticação, limites e formatos serão validados durante a implementação.

### IA e confiabilidade

IA pode auxiliar em extração, classificação, resumo e sugestão de vínculos. Totais e indicadores financeiros serão calculados por código. Resumos apontarão para documentos utilizados; hipóteses não serão convertidas automaticamente em fatos.

Implementar permissões editoriais, log de alterações, revisão de contribuições, monitoramento de fontes, backups externos e recuperação testada. A consulta pública deve continuar funcionando quando uma fonte estiver indisponível.

## 12. Entregas e expansão

### Primeira entrega utilizável

- Home editorial com busca, cards, links e cobertura explícita.
- PNCP nas três esferas, dentro da cobertura disponível.
- Perfis de órgãos e fornecedores relacionados aos registros importados.
- Cadastro de políticos e entidades com contatos públicos verificados quando disponíveis.
- Editorial, manifesto, metodologia e formulário de participação.
- Páginas de detalhes com fontes, documentos e atualização.
- Painel para cadastro, revisão e publicação.

### Expansão imediata

Emendas e gastos parlamentares; acompanhamento de perfis e assuntos; alertas; fontes locais de pagamentos; primeiros casos com perguntas e respostas documentadas. A coleta dessas fontes pode avançar em paralelo à primeira entrega.

### Consolidação

Contratações e execução financeira conectadas; novas categorias públicas; análises comparativas; exportações e API pública com limites de uso definidos.

## 13. Indicadores de sucesso

- Cobertura efetiva por fonte, ente, período e assunto.
- Atualidade dos registros e taxa de falhas de coleta.
- Pesquisas que levam a resultados úteis e documentos acessados.
- Localidades e assuntos acompanhados.
- Contribuições verificadas e incorporadas.
- Cobranças respondidas, esclarecimentos e correções documentadas.
- Entregas verificadas e melhorias demonstráveis no acompanhamento público.

## 14. Decisões pendentes

- Aprovação da identidade visual e desenho da marca.
- Infraestrutura e orçamento operacional.
- Fontes locais prioritárias e política de atualização por conector.
- Login, notificações e critérios de identidade de representantes.
- Política editorial, moderação e tratamento de contatos.
- Financiamento do projeto e eventuais recursos profissionais pagos.

## 15. Referências iniciais

Fontes levantadas durante a concepção. Consultar a documentação vigente antes de implementar conectores; presença de uma fonte nesta lista não significa integração concluída.

- PNCP: https://www.gov.br/pncp/pt-br
- API de consulta PNCP: https://pncp.gov.br/api/consulta/swagger-ui/index.html
- Dados abertos Compras.gov.br: https://www.gov.br/compras/pt-br/cidadao/portal-de-dados-abertos/portal-de-dados-abertos
- Emendas no Portal da Transparência: https://portaldatransparencia.gov.br/emendas
- API do Portal da Transparência: https://api.portaldatransparencia.gov.br/
- APIs Transferegov: https://api-publica.transferegov.gestao.gov.br/
- Dados abertos Câmara: https://dadosabertos.camara.leg.br/swagger/api.html
- Dados abertos Senado: https://www12.senado.leg.br/dados-abertos
- Tesouro Transparente: https://www.tesourotransparente.gov.br/

