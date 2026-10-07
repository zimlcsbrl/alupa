import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import Image from 'next/image';
import Link from 'next/link';
import { footerNav, isIndexable, siteDescription, siteUrl, socialImage } from '@/lib/site';
import { SiteNav } from '@/components/site-nav';
import './globals.css';

const nunitoSans = localFont({
  src: '../fonts/nunito-sans.ttf',
  weight: '200 1000',
  style: 'normal',
  display: 'swap',
  variable: '--font-nunito-sans',
});

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
    <html lang="pt-BR" className={nunitoSans.variable}>
      <body>
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        <header className="site-header">
          <Link href="/" aria-label="A Lupa — início">
            <Image src="/brand/logo.svg" alt="A Lupa" width={195} height={50} priority />
          </Link>
          <SiteNav />
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
