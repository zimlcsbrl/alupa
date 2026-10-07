# A Lupa — Validação e plano de desenvolvimento

- **Base:** `alupa-ideia-estrutura-design.md` v0.1 (06/10/2026).
- **Data:** 06/10/2026.
- **Premissa nova:** banco de desenvolvimento no **Neon Postgres**.
- **Estado do repositório:** apenas `README.md`; nenhum código existente.

---

## Parte 1 — Validação do documento

### 1.1 O que está sólido e deve ser mantido

| Ponto | Por que está certo |
| --- | --- |
| Três camadas de dados (original → normalizada → publicada) | Permite reprocessar sem recoletar e auditar qualquer número publicado. |
| Interface lê só o banco próprio | Site continua no ar quando PNCP/Portal da Transparência caem. |
| Etapas financeiras distintas (estimado, contratado, empenhado, liquidado, pago) | Evita o erro mais comum de portais de transparência: somar etapas como gastos diferentes. |
| Papéis separados (autoria, apoio, solicitação, execução, fiscalização) | Evita imputação indevida a parlamentares. |
| Responsabilidade com datas (mandatos/cargos com vigência) | Evita associar ocupante atual a decisões antigas. |
| Busca no PostgreSQL primeiro | Suficiente para o volume do MVP; adia Elasticsearch/Meilisearch. |
| Relações em tabelas, sem banco de grafos | Correto para o início. |
| Cobertura explícita por fonte/ente/período | Essencial para não confundir "sem registro" com "sem despesa". |

**Contraste das cores (WCAG), calculado:**

| Combinação | Razão aprox. | Resultado |
| --- | --- | --- |
| Carvão `#202321` sobre papel `#F7F5EF` | ~14:1 | AAA |
| Verde `#245744` sobre papel `#F7F5EF` | ~7,6:1 | AAA para texto normal |
| Branco sobre verde `#245744` (botões) | ~8,3:1 | AAA |
| Amarelo `#E9C45A` sobre papel | ~1,5:1 | Reprovado para texto — confirma a regra do documento (só realce) |

A paleta é viável. Texto sobre fundo amarelo deve usar o carvão (~9:1).

### 1.2 Ajustes recomendados

**A. Neon em dev x "Coolify + infraestrutura dedicada" em produção**
O documento prevê produção auto-hospedada; dev agora será Neon. Isso é viável desde que o código seja portável:

- Usar driver TCP padrão (`postgres`/postgres.js ou `pg`), **não** o `@neondatabase/serverless` como dependência central. Assim o mesmo código roda em Neon, em Postgres local e em Postgres auto-hospedado.
- Fixar a **mesma versão major** do Postgres em todos os ambientes (sugestão: 17).
- Usar só extensões disponíveis em ambos: `pg_trgm`, `unaccent`, `btree_gin`, `pgcrypto`. Evitar extensões exclusivas do Neon.
- Neon expõe duas URLs: **pooled** (host `-pooler`, PgBouncer em modo transação) para a aplicação, e **direta** para migrations, `COPY` em massa e sessões longas dos workers. Prever as duas variáveis desde o início.
- Decisão em aberto: produção também no Neon (menos operação) ou auto-hospedada (custo previsível em volume alto). O plano mantém as duas portas abertas.

**B. Volume de dados x limites do Neon**
"PNCP nas três esferas" representa milhões de registros de contratações, itens e contratos. O plano gratuito do Neon (armazenamento pequeno) não comporta isso. Em dev:

- Ingerir uma **janela reduzida** ultIMO ANO geral + RJ e municipios últimos três anos e manter a carga completa para staging/produção.
- Originais (JSON/PDF) vão para o R2/MinIO, **nunca** para o Postgres.
- Avaliar plano pago do Neon antes da carga completa.

**C. Busca textual: detalhe técnico do `unaccent`**
`unaccent()` não é `IMMUTABLE` e não pode ser usado diretamente em índices. Criar uma função wrapper imutável e uma configuração de texto `portuguese_unaccent`. Para CNPJ e nomes com erro de digitação, usar `pg_trgm`. Normalizar CNPJ (só dígitos) em coluna própria.

**D. Escopo da "Primeira entrega" ainda está grande**
Itens que podem sair do MVP sem prejuízo:

| Item | Recomendação |
| --- | --- |
| Python/OCR para documentos | Adiar. O PNCP entrega JSON estruturado; OCR só entra com fontes locais em PDF. |
| DuckDB + Parquet | Adiar para a fase de consolidação. |
| Login de cidadãos (Minha Lupa, alertas) | Fora do MVP, como o próprio documento indica. No MVP, login só para a equipe. |
| CMS próprio do zero | Substituir por um CMS embutido no Next.js (ver item E). |

E um item que vale **adiantar**: a importação básica de **deputados e senadores** (APIs da Câmara e do Senado). É simples, traz e-mails de gabinete com fonte oficial e evita perfis de políticos vazios no MVP — o documento coloca políticos no MVP, mas as fontes deles na expansão.

**E. Painel administrativo / CMS**
Construir rascunho, revisão, agendamento, SEO e preview do zero é caro. Recomenda-se um *spike* com **Payload CMS 3** (roda dentro do app Next.js, usa Postgres, tem controle de acesso e versionamento). Ele pode cobrir: blog, manifesto/metodologia, cadastro de políticos e contatos públicos, e a fila de contribuições. As tabelas do CMS ficam em um schema separado (`cms`), e o domínio de dados públicos fica sob controle de migrations próprias.

**F. Separação Web x API**
Não é necessário um *serviço* de API separado no MVP, mas é necessária uma **API versionada desde o início** (ver item J): os apps de loja no futuro não conseguem usar Server Components. Recomenda-se um **monorepo** com a lógica de domínio em um pacote compartilhado, usado pelo Next.js (páginas e Route Handlers em `/api/v1`) e pelos workers. A API pública aberta a terceiros, com limites de uso, reaproveita esses mesmos endpoints mais tarde.

**G. Rotas com identificador estável**
O documento pede slug + identificador estável, mas as rotas mostram só `[slug]`. Proposta: `/politicos/[id]-[slug]` (ex.: `/politicos/p8f3k2-maria-silva`), com redirecionamento 301 se o slug mudar. Mesmo padrão para entidades, localidades e casos.

**H. LGPD antes da publicação**
O PNCP traz fornecedores pessoa física (CPF). Antes de publicar qualquer dado:

- Política de mascaramento de CPF definida e aplicada na camada publicada.
- Termos de uso, política de privacidade e canal de correção publicados.
- Registro de base legal para cada categoria de dado pessoal tratado.

Isso transforma parte das "Decisões pendentes" (política editorial, tratamento de contatos) em **bloqueadores de lançamento**, não de desenvolvimento.

**I. Domínio `.app`**
Exige HTTPS em todo o domínio (HSTS pré-carregado). Sem impacto real, apenas configurar TLS desde o primeiro deploy de staging. HTTPS também é pré-requisito do PWA.

**J. Requisito primordial: desktop e mobile (PWA agora, lojas depois)**
O documento trata o mobile como layout responsivo. Com o objetivo de publicar na Google Play e na App Store, isso vira requisito de arquitetura:

| Tema | Decisão |
| --- | --- |
| Abordagem | **Mobile-first** no design e no código; desktop é a expansão do layout, não o contrário. |
| PWA | Web App Manifest (`app/manifest.ts`), ícones (incl. *maskable*), *splash*, `display: standalone`, service worker com **Serwist**. |
| Offline | Shell do app e páginas visitadas recentemente em cache; itens acompanhados disponíveis offline. Busca exige conexão e informa isso claramente. |
| Dados para clientes | Todo dado consumido pela interface interativa passa por `/api/v1` (JSON, versionado, documentado com OpenAPI). Server Components podem chamar o mesmo pacote de domínio diretamente, mas o contrato da API é o mesmo. |
| Autenticação | Sessão por cookie seguro na web; desenhar desde já suporte a **token** (para apps nativos) no mesmo provedor de auth. |
| Links | URLs estáveis (item G) servem como *deep links*; publicar `assetlinks.json` (Android) e `apple-app-site-association` (iOS) quando os apps existirem. |
| Notificações | Web Push no PWA (no iOS só funciona com o app instalado na tela inicial, iOS 16.4+); nativo via FCM/APNs no futuro. Alertas já entram na expansão imediata. |
| Google Play | Publicar o próprio PWA via **Trusted Web Activity** (Bubblewrap/PWABuilder). Custo baixo, depende de PWA com boa pontuação. |
| App Store | A Apple costuma rejeitar apps que são só um site embrulhado (diretriz 4.2). Caminho recomendado: **Capacitor** sobre o mesmo front-end, com recursos nativos reais (push, compartilhar, itens offline, widgets/atalhos). Alternativa, se a experiência pedir: app Expo/React Native consumindo `/api/v1`. Decidir quando chegar a hora; a API versionada mantém as duas opções abertas. |
| Desempenho mobile | Orçamento: LCP < 2,5 s e INP < 200 ms em 4G em celular intermediário; JS inicial enxuto; imagens otimizadas; fontes com `display: swap` e subconjunto latino. |
| Ergonomia | Alvos de toque ≥ 44 px, áreas seguras (`env(safe-area-inset-*)`), navegação inferior no app instalado, tabelas com versão em lista/cartões, teclado numérico para CNPJ. |
| Compartilhamento | Web Share API nas páginas de detalhe e cards (importante para o uso cidadão via WhatsApp); Open Graph bem formado. |

**K. Novo módulo: Proposições, enquetes e votações**
Detalhado na Parte 5. Dois pontos de validação que afetam o desenho:
- **Voto em enquete é dado pessoal sensível.** A LGPD (art. 5º, II) classifica opinião política como dado sensível. O voto de cada usuário exige consentimento específico, armazenamento separado com acesso restrito e publicação apenas de agregados.
- **Legislação eleitoral.** A Lei 9.504/97 (art. 33, § 5º) e as resoluções do TSE proíbem enquetes relacionadas ao processo eleitoral durante o período eleitoral. As enquetes devem tratar de proposições, nunca de candidatos ou intenção de voto, e o sistema precisa permitir suspender enquetes por período. **Validar com assessoria jurídica antes de lançar.**

**L. Proteção contra raspagem e acesso pago a dados em massa**
Detalhado na Parte 6. Premissas:
- A consulta individual continua gratuita e sem login para qualquer cidadão. O que se vende é **volume, tratamento e conveniência**: dados normalizados, relações, histórico, exportações e API com SLA.
- Não há como impedir 100% a raspagem de páginas públicas. O objetivo é tornar a raspagem em massa **mais cara e mais lenta do que contratar o acesso**, e ter base contratual para agir quando ela ocorrer.
- Os dados brutos continuam públicos nas fontes oficiais (LAI). A proteção recai sobre a **base tratada da A Lupa**, que como compilação organizada tem proteção pela Lei 9.610/98 (art. 7º, XIII), reforçada pelos Termos de Uso e por uma licença explícita.
- Precisa de equilíbrio com SEO: buscadores verificados continuam indexando, e os limites recaem sobre o volume, não sobre o acesso a uma página.
- Há um risco de imagem: um projeto de transparência que cobra por dados pode receber críticas. Mitigação: comunicar com clareza no manifesto e na metodologia o que é gratuito, e avaliar uma faixa gratuita ou com desconto para pesquisa acadêmica e organizações da sociedade civil (decisão na Parte 8).

### 1.3 Riscos principais

| Risco | Mitigação |
| --- | --- |
| Mudanças de formato/limites da API do PNCP | Validar schemas na entrada (Zod), alertar quando campos mudarem, guardar original. |
| Duplicidade entre portais (PNCP x Compras.gov.br) | Chave de deduplicação por identificador oficial desde o modelo inicial. |
| Vinculação errada de homônimos | Correspondência só por nome nunca é automática: vai para revisão. |
| Crescimento de custo de banco | Janela de dados em dev, originais fora do banco, monitorar tamanho por tabela. |
| Escopo editorial atrasar o lançamento | Separar trilha técnica e trilha editorial/jurídica desde a Fase 0. |
| Manipulação de enquetes (robôs, campanhas coordenadas) | Uma participação por conta verificada, Turnstile, limites, detecção de picos anômalos e resultado sempre com aviso de que não é pesquisa amostral. |
| Enquete interpretada como pesquisa eleitoral | Temas restritos a proposições; suspensão automática por calendário eleitoral; revisão jurídica. |
| Vazamento de opinião política de usuários | Votos em schema isolado, chave de usuário pseudonimizada, só agregados expostos, acesso auditado. |
| Raspagem em massa da base tratada | Camadas da Parte 6: borda (Cloudflare), limites na aplicação, paginação restrita, API paga com chaves e monitoramento. |
| Bloqueio de usuários legítimos (CGNAT de operadoras móveis) | Limites por sessão/token além de IP; desafio (Turnstile) antes de bloquear; nunca bloquear uma consulta isolada. |

---

## Parte 2 — Stack de implementação

| Camada | Escolha | Observação |
| --- | --- | --- |
| Runtime | Node.js LTS atual (24) + TypeScript estrito | |
| Monorepo | pnpm workspaces + Turborepo | Remover o `package-lock.json` vazio. |
| Web | Next.js (App Router) | SSR/ISR para páginas públicas, bom SEO. |
| UI | Tailwind CSS + componentes próprios (Radix primitives para acessibilidade) | Tokens de cor/tipografia do documento. |
| Fontes | Source Serif 4 + Source Sans 3 via `next/font` | |
| PWA | Web App Manifest + Serwist (service worker) | Base para TWA (Android) e Capacitor (iOS) no futuro. |
| API | Route Handlers `/api/v1` + OpenAPI gerado a partir dos schemas Zod | Contrato único para web, PWA e apps nativos. |
| ORM / migrations | Drizzle ORM + drizzle-kit | Leve, SQL explícito, bom suporte a Postgres e Neon. |
| Driver | `postgres` (postgres.js) | Portável entre Neon e Postgres próprio. |
| Validação | Zod | Respostas de APIs externas e formulários. |
| Filas | BullMQ + Redis | Redis local (Docker) em dev. |
| Borda / anti-bot | Cloudflare (proxy, WAF, regras de rate limit, Bot Management/Bot Fight Mode, Turnstile) | Já alinhado com o uso do R2. |
| Rate limit na aplicação | Janela deslizante em Redis por IP, sessão, token e chave de API | |
| Cobrança | Gateway com Pix, boleto e cartão (ex.: Stripe, Pagar.me ou Asaas) | Exige pessoa jurídica e emissão de nota fiscal de serviço. |
| Objetos | Cloudflare R2 (API S3) | MinIO local ou bucket R2 de dev. |
| CMS/Admin | Payload CMS 3 (sujeito ao spike) | Login da equipe incluso. |
| Testes | Vitest (unidade/integração) + Playwright (e2e) + axe (acessibilidade) | |
| Qualidade | ESLint, Prettier, `tsc --noEmit`, commits convencionais | |
| CI | GitHub Actions | Branch do Neon por Pull Request. |
| Observabilidade | Logs estruturados (pino), Sentry, métricas de coleta no próprio banco | |

### Estrutura do monorepo

```
alupa/
├─ apps/
│  ├─ web/            # Next.js: site público + PWA + /api/v1 + admin (Payload)
│  ├─ workers/        # Coletores e jobs BullMQ
│  └─ mobile/         # (futuro) Capacitor ou Expo, consumindo /api/v1
├─ packages/
│  ├─ db/             # Schema Drizzle, migrations, seeds, cliente
│  ├─ domain/         # Regras: normalização, valores, relações, consultas
│  ├─ connectors/     # Clientes das fontes (PNCP, Câmara, Senado, IBGE...)
│  ├─ access/         # Rate limit, tokens de cliente, chaves de API, planos e medição de uso
│  ├─ storage/        # Abstração R2/MinIO, hash e snapshots
│  ├─ ui/             # Design system (tokens, cards, tabelas)
│  └─ config/         # tsconfig, eslint, prettier compartilhados
├─ docker-compose.yml # Redis + MinIO (Postgres fica no Neon)
├─ Documentos/
└─ .env.example
```

---

## Parte 3 — Configuração do Neon para desenvolvimento

1. Criar projeto `alupa` no Neon, região mais próxima do Brasil disponível (ex.: `aws-sa-east-1`, se oferecida; caso contrário, `us-east`), Postgres 17.
2. Branches:
   - `main` → banco de dev compartilhado com dados de amostra.
   - `dev/<nome>` → branch por desenvolvedor, criada a partir de `main` (cópia instantânea).
   - `preview/pr-<n>` → criada e removida automaticamente pelo GitHub Actions (`neondatabase/create-branch-action` / `delete-branch-action`), migrations aplicadas e testes de integração rodando contra ela.
3. Banco `alupa`, com roles separadas:
   - `alupa_migrator` (DDL, usado só por migrations).
   - `alupa_app` (leitura/escrita na camada publicada e normalizada).
   - `alupa_worker` (escrita em coleta/original/normalizada).
4. Extensões na primeira migration: `pg_trgm`, `unaccent`, `pgcrypto`, `btree_gin`.
5. Schemas Postgres: `raw` (metadados dos originais), `core` (normalizado), `pub` (views/tabelas publicadas e índices de busca), `ops` (fontes, coletas, checkpoints, cobertura), `cms` (Payload), `civic` (votos em enquetes — acesso restrito, ver Parte 5) e `billing` (clientes, planos, chaves de API, uso medido).
6. Variáveis (`.env.example`):

```env
# Neon — app (pooled, PgBouncer em modo transação)
DATABASE_URL=postgresql://alupa_app:***@ep-xxx-pooler.<região>.aws.neon.tech/alupa?sslmode=require
# Neon — migrations, COPY e workers de longa duração (conexão direta)
DATABASE_URL_UNPOOLED=postgresql://alupa_migrator:***@ep-xxx.<região>.aws.neon.tech/alupa?sslmode=require

REDIS_URL=redis://localhost:6379
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=alupa-dev
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
PAYLOAD_SECRET=
```

7. Cuidados:
   - Com PgBouncer em modo transação, não usar *prepared statements* nomeados nem `LISTEN/NOTIFY` na conexão pooled (no postgres.js: `prepare: false`).
   - O *scale-to-zero* do Neon gera latência na primeira consulta após inatividade: aceitável em dev, não usar como métrica de desempenho.
   - Jobs de ingestão em massa usam `COPY` para tabela temporária + `INSERT ... ON CONFLICT` pela conexão direta.

---

## Parte 4 — Plano por fases

Cada fase termina com critérios verificáveis. As durações dependem do tamanho da equipe e não foram estimadas aqui; a ordem e as dependências são o que importa.

Há duas trilhas paralelas desde o início:
- **Trilha técnica** (fases abaixo).
- **Trilha editorial e jurídica:** manifesto final, metodologia, termos, privacidade, política de LGPD/CPF, política editorial e de correções, identidade visual final. **Bloqueia o lançamento público, não o desenvolvimento.**

### Fase 0 — Fundação

- Monorepo (pnpm + Turborepo), TypeScript estrito, lint, format, `.editorconfig`, `.gitignore`, `.env.example`.
- `docker-compose.yml` com Redis e MinIO.
- Projeto Neon, branches, roles e extensões (Parte 3).
- CI: lint, typecheck, testes, migrations em branch Neon de preview.
- Playwright configurado desde já com dois perfis: desktop (Chrome) e mobile (emulação Pixel e iPhone/WebKit). Todo teste e2e roda nos dois.
- Registros de decisão (ADRs) curtos em `Documentos/adr/`: Neon/driver, Drizzle, Payload, padrão de rotas, mascaramento de CPF.
- Spike de 1–2 dias: Payload CMS 3 dentro do Next.js com schema `cms` no Neon.

**Pronto quando:** `pnpm dev` sobe web + workers localmente apontando para o Neon; um PR cria branch Neon, aplica migrations e roda testes.

### Fase 1 — Modelo de dados núcleo

- `ops`: `fonte`, `coleta`, `checkpoint`, `cobertura` (fonte × ente × período × categoria), `erro_coleta`.
- `raw`: `documento_original` (URL, id na fonte, data, hash SHA-256, chave no R2, content-type).
- `core` (MVP): `ente_federativo` (código IBGE, esfera), `orgao` (poder, esfera, autônomo), `organizacao` (CNPJ normalizado), `pessoa` (CPF armazenado com proteção, nunca publicado em claro), `mandato`/`cargo` com vigência, `contato_publico` (tipo, fonte, data de verificação, situação), `contratacao`, `item`, `resultado`, `contrato`, `aditivo`, `evento_financeiro` (etapa explícita), `documento`, `relacao` (tipo, origem: confirmada/sugerida, evidência), `identificador_externo` (sistema, valor, entidade).
- Valores em `numeric(18,2)` com campo de etapa (`estimado|contratado|empenhado|liquidado|pago`); valor original sempre preservado.
- Ids próprios estáveis (ex.: ULID/UUIDv7) + slug.
- Seeds: UFs e municípios via API de localidades do IBGE.
- Testes de integração do schema na branch Neon.

**Pronto quando:** migrations aplicam do zero; seed do IBGE carrega 27 UFs e todos os municípios; testes de restrições (unicidade de identificadores externos, etapas financeiras) passam.

### Fase 2 — Conector PNCP

- Validar a documentação atual da API de consulta do PNCP (endpoints, paginação, limites, formatos) antes de codificar.
- Cliente em `packages/connectors/pncp` com Zod, *rate limit* e *retry* com *backoff*.
- Jobs BullMQ: `pncp:descobrir` (por data de publicação/atualização) → `pncp:baixar` (original para R2 + `documento_original`) → `pncp:normalizar` (upsert idempotente em `core`).
- Checkpoint por janela de datas; revisita periódica para retificações; registro de exclusões observadas sem apagar histórico.
- Atualização da tabela de cobertura ao fim de cada coleta.
- Painel mínimo de coletas (status, contagens, erros) no admin.
- Em dev: janela reduzida configurável (`PNCP_JANELA_DIAS`).

**Pronto quando:** rodar o mesmo job duas vezes não duplica nada; derrubar o worker no meio e reiniciar retoma do checkpoint; cada registro publicado aponta para seu original no R2.

### Fase 3 — Busca e páginas de detalhe

- Configuração `portuguese_unaccent`, colunas `tsvector` geradas e índices GIN; `pg_trgm` para nomes e CNPJ.
- Consulta unificada com resultados agrupados por tipo e filtros na URL (esfera, UF, município, órgão, período, categoria, situação, faixa de valor).
- Mensagem de "nenhum resultado" mostrando filtros aplicados e limites de cobertura.
- Páginas: `/contratacoes/[id]`, `/contratos/[id]`, `/entidades/[id]-[slug]`, `/localidades/[id]-[slug]` — resumo, dados, linha do tempo, documentos, relações (confirmadas x sugeridas), fonte e data de atualização.
- Glossário contextual (empenho, liquidação etc.).
- Endpoints `/api/v1/busca` e `/api/v1/{tipo}/{id}` com o mesmo contrato usado pela interface, documentados em OpenAPI; paginação por cursor.
- **Proteção básica (Parte 6, camadas 2–4):** rate limit por IP/sessão, profundidade máxima de paginação para anônimos, tamanho de página fixo, cursores assinados e de curta duração, token de cliente exigido em `/api/v1`.

**Pronto quando:** busca por nome, CNPJ (com ou sem máscara), número de contratação e texto do objeto retorna resultados corretos com e sem acentos; p95 de busca aceitável no volume de dev; páginas passam no axe sem erros críticos, no perfil desktop e no mobile.

### Fase 4 — Design system, home e conteúdo

- Tokens (cores, tipografia, espaçamentos, raio 8–12 px), componentes: cabeçalho, busca, atalhos, cards (Caso, Contratação, Emenda, Atualização, Blog), tabela responsiva, linha do tempo, selos de situação (texto + ícone, nunca só cor).
- Home na ordem proposta no documento, com seções alimentadas por dados reais (Novidades nos dados, Oportunidades e resultados) e editoriais (Sob a lupa, Do blog).
- "Perto de você" com seleção manual de UF/município (geolocalização opcional).
- Blog, manifesto e metodologia no CMS, com autoria, datas, referências e histórico de correções; vínculo de artigos com entidades/contratos.
- SEO: metadados, Open Graph, sitemap, dados estruturados.
- **PWA:** manifest, ícones (incl. maskable), service worker (Serwist) com cache do shell e das páginas recentes, página offline, convite de instalação discreto (não intrusivo), Web Share nos cards e detalhes, navegação inferior em `display-mode: standalone`.
- Componentes projetados *mobile-first*: tabelas com alternativa em cartões, filtros em *bottom sheet* no celular e em barra lateral no desktop.

**Pronto quando:** home utilizável no celular com busca e primeiros cards visíveis sem rolagem longa; navegação completa por teclado; `prefers-reduced-motion` respeitado; Lighthouse de acessibilidade ≥ 95 em desktop e mobile; app instalável no Android (Chrome) e no iOS (Safari, "Adicionar à Tela de Início"); orçamento de desempenho mobile (LCP < 2,5 s, INP < 200 ms) cumprido em 4G simulado.

### Fase 5 — Políticos, contatos e participação

- Conectores Câmara e Senado: parlamentares, mandatos e e-mails de gabinete (fonte + data de verificação). Desenhar o conector já prevendo proposições e votações nominais (Parte 5), mesmo que só entrem depois.
- Cadastro/edição manual de políticos, entidades e contatos públicos no admin, com situação (publicado, desatualizado, inválido, não encontrado).
- Página `/politicos/[id]-[slug]` com mandatos, contatos (copiar, abrir app de e-mail, página oficial) e "Contato público não localizado" quando aplicável.
- `/participar`: formulário de informação/correção/documento, upload para R2, anti-spam (Turnstile ou equivalente), fila no admin com os status do documento.
- Log de alterações editoriais (quem, quando, o quê).

**Pronto quando:** perfil de qualquer deputado federal mostra mandato atual e contato com fonte; contribuição enviada aparece na fila e muda de status; nada enviado é publicado sem revisão.

### Fase 6 — Endurecimento e lançamento

- Staging com carga completa do PNCP (Neon pago ou Postgres próprio — decisão da Parte 1, item A).
- Mascaramento de CPF verificado por teste automatizado na camada publicada.
- Backups externos e **teste de restauração** documentado.
- Monitoramento: falhas de coleta, atraso de atualização por fonte, erros da aplicação.
- Cache/ISR das páginas públicas; site responde mesmo com fontes externas fora do ar.
- Cloudflare na frente do domínio com WAF, regras de rate limit e bots verificados liberados (Parte 6, camada 1); Termos de Uso com cláusula de proibição de extração automatizada em massa e licença da base.
- Páginas legais e de metodologia publicadas (trilha editorial concluída).
- DNS e TLS do `alupa.app`.

**Pronto quando:** checklist de lançamento completo, incluindo restauração testada e revisão jurídica das páginas legais.

---

## Parte 5 — Módulo de Proposições, enquetes e votações

### 5.1 Escopo

| Componente | O que é |
| --- | --- |
| **Proposições** | Projetos de lei, PECs, medidas provisórias, PDLs e afins, importados das fontes oficiais: ementa, explicação em linguagem simples, autoria (com papéis separados: autor, coautor, relator), tema, situação e tramitação. |
| **Votações oficiais** | Votações nominais em plenário e comissões: data, resultado, voto de cada parlamentar, orientação de bancada/partido e presença. |
| **Enquetes cidadãs** | Pergunta objetiva vinculada a uma proposição (ex.: "Você é a favor da aprovação do PL X?"), com opções fixas, período de abertura e resultado agregado. |
| **Comparação** | "Como votou seu representante": o resultado da enquete na UF/município ao lado do voto dos parlamentares daquela UF, sempre com os avisos metodológicos. |

**Cobertura inicial:** Câmara dos Deputados e Senado Federal (APIs de dados abertos). Assembleias legislativas e câmaras municipais entram depois, conforme fontes disponíveis — a cobertura é registrada como nas demais fontes.

### 5.2 Modelo de dados

- `core.proposicao` (casa, tipo, número, ano, ementa oficial, resumo editorial separado, tema, situação, URL da fonte, identificadores externos).
- `core.proposicao_autoria` (pessoa/órgão, papel, data).
- `core.tramitacao_evento` (data, órgão, descrição, documento).
- `core.votacao` (proposição, casa, órgão/comissão, data, tipo, resultado, placar).
- `core.voto_parlamentar` (votação, mandato, voto: sim/não/abstenção/obstrução/ausente) — ligado ao **mandato**, não só à pessoa, para respeitar as datas.
- `core.orientacao_bancada` (votação, partido/bloco, orientação).
- `pub.enquete` (proposição, pergunta, opções, abertura, encerramento, situação, regras).
- `civic.participacao_enquete` (enquete, **id pseudonimizado** do usuário, opção, UF/município declarados, data). Schema com acesso só para a role da aplicação de votação; equipe editorial vê só agregados.
- `pub.resultado_enquete` (agregados por opção, UF, município, com contagem mínima para exibição — ex.: não mostrar recorte com menos de 30 participações, para evitar reidentificação).

### 5.3 Regras de integridade

- Participação exige **conta com e-mail verificado**; verificação por telefone como reforço opcional. Uma participação por conta por enquete, alterável até o encerramento.
- Turnstile no envio, rate limit por conta/IP, detecção de picos anômalos (muitas contas novas votando na mesma opção em pouco tempo) com marcação para revisão — sem apagar votos silenciosamente; a metodologia explica o tratamento.
- Resultado sempre acompanhado de: número de participações, período e o aviso "Enquete de participação aberta, sem amostragem estatística. Não representa a opinião da população."
- Neutralidade: texto da pergunta revisado editorialmente, opções equilibradas, mesmas regras para qualquer partido ou autoria. Histórico de alterações da pergunta é público.
- Calendário eleitoral configurável que **suspende automaticamente** enquetes no período vedado, se a assessoria jurídica assim orientar.
- Consentimento específico para tratamento de opinião política; usuário pode apagar sua participação e a conta.

### 5.4 Páginas e API

- `/proposicoes` (lista com filtros: casa, tema, situação, autor, período) e `/proposicoes/[id]-[slug]` (resumo, tramitação, votações, enquete).
- `/votacoes/[id]` (placar, mapa por partido e UF, voto de cada parlamentar).
- Perfil do político ganha aba "Proposições e votos".
- Home: card de **Proposição** (tipo/número, ementa simples, situação, enquete aberta) e atalho "Em votação".
- Endpoints `/api/v1/proposicoes`, `/api/v1/votacoes`, `/api/v1/enquetes/{id}/participar` (autenticado).
- Notificações: "a proposição que você acompanha foi votada" (Web Push/e-mail).

### 5.5 Entrega em etapas

1. **Proposições e votações oficiais** (só dados públicos, sem login) — pode começar logo após a Fase 5, reaproveitando os conectores da Câmara e do Senado.
2. **Enquetes** — depende do login de cidadãos (expansão imediata), da revisão jurídica (LGPD + eleitoral) e do schema `civic`.
3. **Comparação enquete × voto** e notificações.

**Pronto quando (etapa 2):** uma conta vota uma única vez por enquete; nenhum endpoint ou tela expõe votos individuais; recortes abaixo do mínimo não aparecem; suspensão por calendário testada.

---

## Parte 6 — Proteção contra raspagem e acesso pago a dados

### 6.1 Modelo de acesso

| Faixa | Quem | Acesso | Preço |
| --- | --- | --- | --- |
| **Cidadão** | Qualquer pessoa, sem login | Site, PWA e apps: busca, páginas, documentos, compartilhamento. Limites generosos para uso humano. | Gratuito |
| **Cidadão com conta** | Usuário cadastrado | O anterior + acompanhamento, alertas, enquetes e limites maiores. | Gratuito |
| **Pesquisa / OSC** (a decidir) | Universidades, ONGs, jornalismo independente, após verificação | Exportações e API com cota limitada; uso não comercial. | Gratuito ou com desconto |
| **Profissional** | Veículos, empresas, consultorias | API com chave, cotas maiores, exportações em CSV/Parquet, histórico completo. | Assinatura |
| **Empresarial** | Grandes volumes | Base completa (*bulk*), atualizações incrementais/webhooks, SLA, suporte. | Contrato |

### 6.2 Camadas técnicas

1. **Borda (Cloudflare):** proxy de todo o tráfego, WAF, regras de rate limit por rota, gerenciamento de bots com liberação de **bots verificados** (Google, Bing etc.) para manter o SEO, bloqueio de datacenters/ASNs suspeitos apenas nas rotas de dados, Turnstile como desafio antes de bloqueio.
2. **Aplicação:** rate limit em janela deslizante (Redis) por IP, sessão, conta e chave, com limites diferentes por faixa. Respostas `429` com `Retry-After`. Atenção a CGNAT de operadoras móveis: combinar IP com sessão/token antes de bloquear.
3. **Formato das consultas:**
   - Paginação com profundidade máxima para anônimos (ex.: até a página 10 de uma busca) e tamanho de página fixo, sem parâmetro `limit` aberto.
   - Cursores **assinados e com expiração**, em vez de `offset` ou ids sequenciais.
   - Identificadores públicos não enumeráveis (ids aleatórios no lugar de sequências).
   - Sem endpoint de listagem completa anônima; filtros amplos sem termo de busca retornam um conjunto limitado.
   - Exportação (CSV/Parquet) só em faixas com chave.
4. **Token de cliente na API:** `/api/v1` exige um token curto emitido para a sessão do site/PWA (cookie `HttpOnly` + token assinado). Nos apps de loja, reforçar com **Play Integrity** (Android) e **App Attest** (iOS). Não é infalível, mas eleva o custo de automação.
5. **API paga:** chaves por cliente (com hash armazenado, nunca em claro), escopos, cotas por plano, medição de uso por requisição/linha exportada, painel do cliente com consumo e faturas. Endpoints com SLA servem de réplica de leitura/cache separado para não afetar o site público.
6. **Detecção e resposta:** métricas de padrão de acesso (varredura sequencial de entidades, cobertura anormal de páginas por sessão, user-agents automatizados), URLs-armadilha invisíveis a humanos e excluídas no `robots.txt`, alertas para a equipe e escalonamento gradual: desacelerar → desafiar → bloquear. Exportações pagas levam **marca d'água por cliente** (ordenação/metadados identificáveis), sem nunca inserir registros falsos — a base publicada continua íntegra.
7. **Base contratual:** Termos de Uso proibindo extração automatizada em massa da base tratada sem licença, licença explícita para conteúdo editorial e dados (ex.: uso pessoal/não comercial com atribuição; comercial sob contrato), `robots.txt` coerente com os termos e página "Dados para empresas e veículos" explicando como contratar.

### 6.3 Entrega em etapas

| Etapa | Quando | Conteúdo |
| --- | --- | --- |
| Básica | Fase 3 (junto com `/api/v1`) | Camadas 2, 3 e 4 sem attestation. |
| Lançamento | Fase 6 | Camada 1 (Cloudflare), termos e licença (camada 7), monitoramento inicial (camada 6). |
| Produto de dados | Pós-MVP, consolidação | Camada 5 completa: planos, chaves, medição, cobrança, painel do cliente, exportações e *bulk*. |
| Apps de loja | Junto com a publicação | Play Integrity e App Attest. |

**Pronto quando (lançamento):** um script que percorra a busca anonimamente é desacelerado e desafiado antes de obter uma fração relevante da base; um usuário humano em rede móvel (CGNAT) nunca é bloqueado em uso normal; Googlebot verificado indexa as páginas normalmente.

---

## Parte 7 — Pós-MVP (resumo)

1. **Expansão imediata:** emendas (Portal da Transparência, Transferegov), despesas parlamentares (Câmara/Senado), login de cidadãos e Minha Lupa (com auth por token pronta para apps), alertas via Web Push, casos com perguntas/respostas, primeiras fontes locais (aqui entra Python/OCR, se necessário), **módulo de Proposições** (etapas 1–3 da Parte 5).
2. **Lojas de aplicativos:**
   - Google Play via Trusted Web Activity do PWA (`assetlinks.json`, conta de desenvolvedor, política de privacidade e formulário de segurança de dados).
   - App Store via Capacitor (ou Expo, se decidido) com recursos nativos que justifiquem o app: push via APNs, itens acompanhados offline, compartilhamento nativo, *universal links*.
   - Pipeline de build/assinatura e versionamento dos apps no CI.
3. **Consolidação:** ligação contratação ↔ execução financeira, DuckDB/Parquet para análises, **produto de dados pago** (Parte 6: planos, chaves de API, exportações, *bulk*, cobrança), busca dedicada se as métricas exigirem.

---

## Parte 8 — Decisões necessárias

| Decisão | Recomendação | Bloqueia |
| --- | --- | --- |
| ORM | Drizzle | Fase 1 |
| CMS/Admin | Payload 3 (após spike) | Fases 4–5 |
| Gerenciador de pacotes | pnpm | Fase 0 |
| Região do Neon | A mais próxima do Brasil disponível | Fase 0 |
| Janela de dados em dev | 3 meses ou UFs piloto | Fase 2 |
| Contrato de API | `/api/v1` versionado + OpenAPI desde a Fase 3 | Fase 3 e apps futuros |
| Estratégia de app nas lojas | PWA → TWA (Android); Capacitor (iOS). Reavaliar Expo antes de iniciar | Pós-MVP |
| Banco de produção | Decidir até a Fase 6 (Neon pago x Postgres próprio) | Fase 6 |
| Política de CPF / LGPD | Mascarar sempre na camada publicada | Lançamento |
| Enquetes: LGPD (opinião política) e legislação eleitoral | Parecer jurídico antes de abrir enquetes | Parte 5, etapa 2 |
| Verificação de conta para enquetes | E-mail verificado; telefone opcional | Parte 5, etapa 2 |
| Faixa gratuita para pesquisa/OSC | Recomendada, com verificação e uso não comercial | Produto de dados |
| Licença da base e Termos de Uso | Uso pessoal/não comercial com atribuição; comercial sob contrato | Lançamento |
| Pessoa jurídica e gateway de pagamento | Necessários para cobrar e emitir nota fiscal | Produto de dados |
| Planos e preços | Definir após medir demanda de veículos/empresas | Produto de dados |
