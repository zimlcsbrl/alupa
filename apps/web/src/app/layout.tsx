import type { Metadata, Viewport } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { footerNav, isIndexable, mainNav, siteDescription, siteUrl, socialImage } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'A Lupa — O público é da nossa conta.', template: '%s | A Lupa' },
  description: siteDescription,
  applicationName: 'A Lupa',
  robots: isIndexable ? undefined : { index: false, follow: false },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'A Lupa',
    title: 'A Lupa — O público é da nossa conta.',
    description: siteDescription,
    images: [socialImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'A Lupa — O público é da nossa conta.',
    description: siteDescription,
    images: [socialImage],
  },
};
export const viewport: Viewport = { themeColor: '#245744' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        <header className="site-header">
          <Link href="/" aria-label="A Lupa — início">
            <Image src="/brand/logo.svg" alt="A Lupa" width={195} height={50} priority />
          </Link>
          <nav aria-label="Navegação principal">
            {mainNav.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        {children}
        <footer className="site-footer">
          <div>
            <span>A Lupa · O público é da nossa conta.</span>
            <span>Projeto em construção.</span>
          </div>
          <nav aria-label="Rodapé">
            {footerNav.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </footer>
      </body>
    </html>
  );
}
