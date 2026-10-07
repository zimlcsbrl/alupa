# A Lupa — proposta de sitemap

Proposta de arquitetura da informação, 06/10/2026. Complementa o documento de concepção. Apenas `/` e `/manifesto` estão implementadas nesta entrega; as demais rotas abaixo são planejadas.

## Navegação

Cabeçalho futuro: **marca → início · Explorar · Blog · Manifesto · Participar · Entrar**.
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
├── blog
│   ├── categoria/[slug]
│   └── [slug]
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

Perfis de políticos e entidades conectam registros e contatos institucionais verificados. Um caso conecta evidências e perguntas; não deve converter vínculos ou alertas em acusações. Blog explica os dados e aponta para os registros citados.

## Ordem de implementação

1. Home editorial, pesquisa, contratações, contratos, entidades, blog, participação, metodologia e cobertura.
2. Localidades, políticos, emendas, despesas parlamentares, pagamentos e casos, conforme as fontes disponíveis.
3. Minha Lupa e alertas, depois de cadastro, preferências e rotinas de atualização.

## Sitemap técnico

`apps/web/src/app/sitemap.ts` gera `/sitemap.xml` somente com `/` e `/manifesto`. Incluir novas páginas apenas quando retornarem conteúdo público real. O domínio central está em `src/lib/site.ts`.

- Exportar URLs canônicas, estáveis e públicas. Redirecionar slugs alterados.
- Busca e combinações de filtros ficam fora do sitemap; definir `noindex` nas páginas de resultados quando forem implementadas. Coleções editoriais úteis podem ter páginas indexáveis próprias.
- Login, área pessoal, administração, rascunhos e confirmações de envio ficam fora do sitemap. Áreas privadas exigem controle de acesso; regras de robôs não substituem autenticação.
- Usar `lastModified` apenas com data real de atualização do conteúdo, não com a data de cada execução.
- Quando o catálogo crescer, dividir por tipo de registro e paginar os sitemaps.
- Em homologação, configurar `noindex` antes de expor o ambiente. A indexação em produção depende da publicação e configuração do domínio.

Referência técnica: [convenção de sitemap do Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap).
