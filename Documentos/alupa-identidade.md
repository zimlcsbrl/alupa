# A Lupa — identidade inicial

Proposta v0.1 · 06/10/2026. Desenvolvida a partir de `alupa-ideia-estrutura-design.md`.

## Conceito

Uma lupa de traço firme, com um ponto amarelo no centro: olhar para o que merece atenção. O nome em serifada editorial aproxima a marca de leitura, contexto e apuração. Assinatura: **O público é da nossa conta.**

| Uso | Arquivo |
| --- | --- |
| Logo principal transparente, texto em curvas | `apps/web/public/brand/logo.svg` |
| Versão para fundo verde ou escuro | `apps/web/public/brand/logo-inverse.svg` |
| Versão monocromática | `apps/web/public/brand/logo-mono.svg` |
| Símbolo isolado | `apps/web/public/brand/symbol.svg` |
| Favicon vetorial | `apps/web/src/app/icon.svg` |
| Favicon ICO, 16/32/48/64 px | `apps/web/src/app/favicon.ico` |
| Ícone Apple, 180 px | `apps/web/src/app/apple-icon.png` |
| Ícones de aplicativo, 192 e 512 px | `apps/web/public/icon-192.png`, `icon-512.png` |
| Imagem OG, PNG 1200 × 630 | `apps/web/public/og.png` |
| Manifesto editorial, fonte de conteúdo | `apps/web/src/content/manifesto.ts` |
| Página do manifesto | `/manifesto` |
| Manifesto técnico do aplicativo | `/manifest.webmanifest` |

## Paleta e uso

Papel `#F7F5EF`, carvão `#202321`, verde `#245744`, amarelo `#E9C45A`, branco quente `#FFFEFA`, linha `#DDDAD1`.

Usar verde para marca e ações; amarelo para pequenos realces. Não usar amarelo como texto sobre papel. A marca usa Georgia Bold em curvas; páginas usam Georgia e Arial locais, sem requisições de fontes externas. Source Serif 4 e Source Sans 3 continuam como opções futuras do documento original.

Preservar a proporção. Deixar ao redor da marca espaço equivalente ao ponto central. Largura sugerida mínima do logo: 140 px; abaixo disso, usar o símbolo. A versão inversa deve ficar sobre fundo escuro. Não acrescentar sombras ou efeitos ao logo.

## Implementação e edição

Logo, ícones e OG são desenhados por código em `scripts/generate-brand.py`. Os SVGs do logo não dependem da instalação de fontes no navegador. Para regenerar: Python com Pillow e fontTools, Georgia/Georgia Bold e Arial disponíveis em `C:/Windows/Fonts` ou no diretório definido por `ALUPA_FONT_DIR`. Os binários das fontes não são distribuídos.

O manifesto do aplicativo oferece nome, cores e ícones; não implementa funcionamento offline. O manifesto editorial é separado e está disponível em `/manifesto`. Home provisória e manifesto compartilham identidade e metadados de compartilhamento. As imagens OG usam URL absoluta resolvida pelo domínio central `https://alupa.app`; esta entrega não publica o site nem verifica titularidade do domínio.
