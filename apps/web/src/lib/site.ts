import type { Metadata } from 'next';

export const siteUrl = 'https://alupa.app';
export const siteDescription =
  'A Lupa nasce para tornar informações públicas brasileiras compreensíveis, conectar documentos e ajudar a fazer perguntas que merecem resposta.';
export const socialImage = {
  url: '/og.png',
  width: 1200,
  height: 630,
  alt: 'A Lupa. O público é da nossa conta. Informação para entender, conferir e cobrar.',
};

/** Canal público de contato, usado em Sobre, Privacidade e Termos. Confirmar antes de publicar. */
export const contactEmail = 'contato@alupa.app';

/**
 * Indexação por buscadores. Só o build de produção deve definir ALUPA_INDEXAR=true;
 * homologação e previews ficam com noindex (ver Documentos/alupa-sitemap.md).
 */
export const isIndexable = process.env.ALUPA_INDEXAR === 'true';

export const mainNav = [
  { href: '/brasil-em-numeros', label: 'Brasil em números' },
  { href: '/politicos', label: 'Políticos' },
  { href: '/eleicoes', label: 'Eleições' },
  { href: '/orgaos', label: 'Órgãos' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/manifesto', label: 'Manifesto' },
];

export const footerNav = [
  { href: '/brasil-em-numeros', label: 'Brasil em números' },
  { href: '/politicos', label: 'Políticos' },
  { href: '/eleicoes', label: 'Eleições' },
  { href: '/orgaos', label: 'Órgãos' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/manifesto', label: 'Manifesto' },
  { href: '/sobre#contato', label: 'Contato' },
  { href: '/privacidade', label: 'Privacidade' },
  { href: '/termos', label: 'Termos de uso' },
];

/** Rotas publicadas com conteúdo real; alimenta o sitemap. */
export const publishedRoutes = [
  '/',
  '/brasil-em-numeros',
  '/sobre',
  '/manifesto',
  '/privacidade',
  '/termos',
];

/** Metadados padrão de uma página institucional, com título, canonical e compartilhamento. */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | A Lupa`,
      description,
      url: path,
      siteName: 'A Lupa',
      locale: 'pt_BR',
      type: 'website',
      images: [socialImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | A Lupa`,
      description,
      images: [socialImage],
    },
  };
}
