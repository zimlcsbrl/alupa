# Imprensa — matérias sobre políticos

Arquivos desta pasta alimentam a seção **Imprensa** do perfil de cada político.
Cada inclusão passa por revisão no repositório (pull request), como qualquer código.

## Regras editoriais

1. **Só veículos listados em `veiculos.json`.** A lista é decidida pela equipe editorial e vale igual
   para todos os políticos e partidos. Matéria de domínio fora da lista é recusada pelo importador.
2. **Só referência, nunca o texto.** Guardamos título, veículo, data, link e um resumo curto escrito
   pela A Lupa, com nossas palavras. Não copie trechos da matéria (direitos autorais).
3. **Mesmo tratamento para todos.** Em disputas (ex.: 2º turno), aplique o mesmo critério de busca e
   seleção a todos os candidatos e registre esse critério na metodologia.
4. **Fato, não insinuação.** O resumo descreve o que a matéria relata e quem afirma o quê. Acusações
   são atribuídas à fonte e acompanhadas do outro lado, quando a matéria o traz.
5. **Rascunho primeiro.** Use `"situacao": "rascunho"` até a revisão; só `"publicado"` aparece no site.

## Formato

Um ou mais arquivos `*.json` (exceto `veiculos.json`), cada um com:

```json
{
  "materias": [
    {
      "url": "https://veiculo.exemplo/caminho-da-materia",
      "titulo": "Título exatamente como publicado",
      "veiculo": "Nome do veículo",
      "publicadaEm": "2026-09-30",
      "resumo": "Resumo de até 400 caracteres, escrito pela A Lupa.",
      "politicos": ["slug-do-politico"],
      "situacao": "rascunho"
    }
  ]
}
```

O slug é o final do endereço do perfil (`/politicos/<slug>`).

## Importar

```
pnpm --filter @alupa/workers imprensa
```

O importador valida tudo antes de gravar: se uma matéria tiver erro, nada do arquivo é gravado.
