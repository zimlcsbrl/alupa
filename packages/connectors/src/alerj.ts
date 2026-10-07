import { buscar, ErroFonte } from './http';

/**
 * Assembleia Legislativa do RJ. Sem API de dados abertos (conferido em 06/10/2026):
 * a lista e os perfis são lidos das páginas públicas oficiais.
 */
export const BASE = 'https://www.alerj.rj.gov.br';
export const URL_LISTA = `${BASE}/Deputados/QuemSao`;
export const urlPerfil = (id: string, legislatura: string) =>
  `${BASE}/Deputados/PerfilDeputado/${id}?Legislatura=${legislatura}`;

export interface DeputadoEstadual {
  id: string;
  legislatura: string;
  nome: string;
  partido: string | null;
  fotoUrl: string | null;
}

export interface PerfilDeputadoEstadual {
  email: string | null;
  telefone: string | null;
  fotoOficialUrl: string | null;
}

const decodificar = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();

const absoluta = (src: string | undefined) =>
  src ? (src.startsWith('http') ? src : `${BASE}${src.startsWith('/') ? '' : '/'}${src}`) : null;

/** Interpreta o HTML da lista "Quem São". Exportado para teste. */
export function lerLista(html: string): {
  legislatura: string;
  deputados: DeputadoEstadual[];
  inicio: string;
  fim: string;
} {
  // O período vem do título da lista exibida. A página também tem um seletor com legislaturas
  // anteriores, então a primeira ocorrência de "Legislatura (AAAA – AAAA)" não serve.
  const titulo = html.match(
    /<h2[^>]*>\s*(\d+)\s*(?:&#186;|º|ª)\s*Legislatura\s*\((\d{4})\s*[–-]\s*(\d{4})\)/,
  );
  if (!titulo) {
    throw new ErroFonte(
      'Título da legislatura não encontrado na lista da ALERJ: o formato da página mudou?',
      URL_LISTA,
      200,
      true,
    );
  }
  // Líderes partidários usam a classe "controle_deputado lider".
  const blocos = html.split(/<div class="controle_deputado(?:\s[^"]*)?">/).slice(1);
  const deputados = blocos.flatMap((b) => {
    const link = b.match(/PerfilDeputado\/(\d+)\?Legislatura=(\d+)/);
    const nome = b.match(/<div class="nome">\s*<a[^>]*>([^<]+)<\/a>/);
    if (!link || !nome) return [];
    return [
      {
        id: link[1]!,
        legislatura: link[2]!,
        nome: decodificar(nome[1]!),
        partido: decodificar(b.match(/<div class="partido">([^<]*)<\/div>/)?.[1] ?? '') || null,
        fotoUrl: absoluta(b.match(/<img src="([^"]+)"/)?.[1]),
      },
    ];
  });
  if (deputados.length === 0) {
    throw new ErroFonte(
      'Lista da ALERJ sem deputados: o formato da página mudou?',
      URL_LISTA,
      200,
      true,
    );
  }
  // Legislaturas estaduais começam em 1º de fevereiro e terminam em 31 de janeiro.
  return {
    legislatura: deputados[0]!.legislatura,
    deputados,
    inicio: `${titulo[2]}-02-01`,
    fim: `${titulo[3]}-01-31`,
  };
}

/** Interpreta o HTML de um perfil. Exportado para teste. */
export function lerPerfil(html: string): PerfilDeputadoEstadual {
  return {
    email: html.match(/[\w.+-]+@alerj\.rj\.gov\.br/i)?.[0]?.toLowerCase() ?? null,
    telefone: html.match(/\(\d{2}\)\s?\d{4,5}-\d{4}/)?.[0] ?? null,
    fotoOficialUrl: absoluta(html.match(/href="(\/Uploads\/PerfilDeputado\/Imagem\/[^"]+)"/)?.[1]),
  };
}

export async function deputadosEmExercicio() {
  return lerLista((await buscar(URL_LISTA, { timeoutMs: 60_000 })).texto);
}

export async function perfil(id: string, legislatura: string) {
  return lerPerfil((await buscar(urlPerfil(id, legislatura), { timeoutMs: 60_000 })).texto);
}
