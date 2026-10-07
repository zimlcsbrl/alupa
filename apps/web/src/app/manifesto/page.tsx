import type { Metadata } from 'next';
import { manifesto, manifestoClosing } from '@/content/manifesto';
import { socialImage } from '@/lib/site';
import { ContentPage } from '@/components/content-page';

const description =
  'O dinheiro público tem dono: todos nós. Conheça os compromissos da A Lupa com clareza, rigor, independência e participação cidadã.';
export const metadata: Metadata = {
  title: 'Manifesto',
  description,
  alternates: { canonical: '/manifesto' },
  openGraph: {
    title: 'Manifesto | A Lupa',
    description,
    url: '/manifesto',
    siteName: 'A Lupa',
    locale: 'pt_BR',
    type: 'website',
    images: [socialImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Manifesto | A Lupa',
    description,
    images: [socialImage],
  },
};

export default function ManifestoPage() {
  return (
    <ContentPage
      eyebrow="NOSSO MANIFESTO"
      title={
        <>
          Olhar de perto.
          <br />
          <em>Participar de verdade.</em>
        </>
      }
      lead="Clareza para entender. Rigor para conferir. Espaço para participar."
    >
      {manifesto.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
      ))}
      <p className="closing">{manifestoClosing}</p>
    </ContentPage>
  );
}
