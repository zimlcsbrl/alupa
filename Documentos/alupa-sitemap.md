# A Lupa — proposta de sitemap

Proposta de arquitetura da informação, 06/10/2026. Complementa o documento de concepção. Apenas `/` e `/manifesto` estão implementadas nesta entrega; as demais rotas abaixo são planejadas.

## Navegação

Cabeçalho futuro: **marca → início · Explorar · Editorial · Manifesto · Participar · Entrar**.
Explorar abre os assuntos, sem obrigar o visitante a conhecer a estrutura administrativa. A home concentra busca, atalhos, cards e novidades; não será apenas uma apresentação institucional. A página inicial desta entrega é provisória, enquanto os dados são implementados.

```text
/
├── pesquisa?termo=&esfera=&uf=&municipio=&categoria=
├── localidades
│   └── [slug]                     UF ou município, com código IBGE estável
├── politicos
│   └── [slug]                     Identificador próprio associado ao slug
├── entidades
│   └── [slug]                     Órgãos, fornecedores e beneficiários
├── emendas
│   └── [id]
├── despesas-parlamentares
│   └── [id]
├── contratacoes
│   └── [id]                       Inclui licitações e contratações diretas
├── contratos
│   └── [id]
├── pagamentos
│   └── [id]                       Com etapa financeira e fonte explícitas
├── casos
│   └── [slug]
├── editorial                      Capa da revista: destaques e últimas matérias
│   ├── secao/[slug]               Seções editoriais (ex.: Sob a lupa, Na sua cidade)
│   ├── autores/[slug]             Página de cada autor, com suas matérias
│   └── [slug]                     Matéria: reportagem, análise, guia ou nota
├── manifesto
├── participar
│   ├── enviar-informacao
│   └── corrigir
├── metodologia
│   ├── fontes
│   └── cobertura
├── sobre
├── contato
├── privacidade
├── termos
├── entrar
└── minha-lupa                     Área autenticada
    ├── acompanhamentos
    ├── alertas
    └── preferencias
```

Rodapé: Metodologia · Fontes e cobertura · Sobre · Correções · Contato · Privacidade · Termos.
Administração em `/admin`, com autenticação e autorização próprias, fora da navegação pública.

## Jornada principal

**Home → cidade ou assunto → registro → documento de origem → acompanhar ou contribuir.**

Perfis de políticos e entidades conectam registros e contatos institucionais verificados. Um caso conecta evidências e perguntas; não deve converter vínculos ou alertas em acusações. O Editorial explica os dados e aponta para os registros citados.

## Ordem de implementação

1. Home editorial, pesquisa, contratações, contratos, entidades, editorial, participação, metodologia e cobertura.
2. Localidades, políticos, emendas, despesas parlamentares, pagamentos e casos, conforme as fontes disponíveis.
3. Minha Lupa e alertas, depois de cadastro, preferências e rotinas de atualização.

## Sitemap técnico

Atualizado em 09/10/2026: `/sitemap.xml` é um índice, gerado por `apps/web/src/app/sitemap.xml/route.ts`. Ele aponta para `/sitemaps/paginas/0.xml` (páginas fixas e anos eleitorais com dados) e para arquivos de políticos, órgãos e contratações, em lotes de até 10 mil URLs consultadas no banco. O domínio central está em `src/lib/site.ts`.

As páginas públicas estão liberadas para indexação em produção (`ALUPA_INDEXAR=true` no build). Buscas, filtros e paginação continuam com `noindex`; homologação continua bloqueada pelo layout e pelo robots.txt. Não é necessário alterar o endereço cadastrado no Search Console. As respostas XML têm cache público de uma hora; erros de banco não são convertidos em sitemaps vazios. O build não exige conexão com o banco para gerar esses arquivos.

- Exportar URLs canônicas, estáveis e públicas. Redirecionar slugs alterados.
- Busca e combinações de filtros ficam fora do sitemap; definir `noindex` nas páginas de resultados quando forem implementadas. Coleções editoriais úteis podem ter páginas indexáveis próprias.
- Login, área pessoal, administração, rascunhos e confirmações de envio ficam fora do sitemap. Áreas privadas exigem controle de acesso; regras de robôs não substituem autenticação.
- Usar `lastModified` apenas com data real de atualização do conteúdo, não com a data de cada execução.
- Quando o catálogo crescer, dividir por tipo de registro e paginar os sitemaps.
- Em homologação, configurar `noindex` antes de expor o ambiente. A indexação em produção depende da publicação e configuração do domínio.

Referência técnica: [convenção de sitemap do Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap).
