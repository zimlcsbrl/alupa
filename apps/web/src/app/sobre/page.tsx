import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentPage } from '@/components/content-page';
import { contactEmail, pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  title: 'Sobre',
  description:
    'O que é a A Lupa, em que etapa o projeto está, o que vem a seguir e como falar com a equipe.',
  path: '/sobre',
});

export default function SobrePage() {
  return (
    <ContentPage
      eyebrow="SOBRE A LUPA"
      title={
        <>
          Informação pública para <em>entender, conferir e cobrar.</em>
        </>
      }
      lead="A Lupa é uma plataforma independente para pesquisar, conectar e acompanhar informações públicas brasileiras — da União aos estados, ao Distrito Federal e aos municípios."
      updatedAt="6 de outubro de 2026"
    >
      <section>
        <h2>O que queremos fazer</h2>
        <p>
          Permitir que qualquer pessoa entenda quem decidiu, para onde foi o dinheiro, quem recebeu,
          o que deveria ser entregue e quais esclarecimentos ainda faltam. Para isso, vamos reunir
          dados oficiais, conteúdo editorial e participação cidadã no mesmo lugar.
        </p>
        <p>
          Começamos por contratações, contratos, emendas, despesas parlamentares e pagamentos. A
          cobertura cresce por etapas, fonte a fonte, e será sempre informada: a ausência de um
          registro aqui não significa que uma despesa, um contrato ou uma irregularidade não
          existam.
        </p>
      </section>

      <section>
        <h2>Em que etapa estamos</h2>
        <p>
          O projeto está em construção. Nesta primeira versão, publicamos apenas nossa apresentação,
          o <Link href="/manifesto">manifesto</Link> e as políticas de uso e privacidade. Ainda não
          há dados, pesquisa, cadastro ou envio de informações.
        </p>
        <p>As próximas etapas previstas são:</p>
        <ul>
          <li>
            Pesquisa de contratações e contratos públicos a partir do Portal Nacional de
            Contratações Públicas (PNCP), com fonte e data de atualização em cada registro.
          </li>
          <li>Páginas de órgãos, fornecedores, parlamentares e seus contatos públicos oficiais.</li>
          <li>Blog com reportagens, explicações e guias sobre o dinheiro público.</li>
          <li>Canal para enviar informações, documentos e pedidos de correção.</li>
          <li>Acompanhamento de proposições legislativas e de como votaram os parlamentares.</li>
        </ul>
        <p>Cada etapa será anunciada aqui, com o que foi incluído e o que ainda falta.</p>
      </section>

      <section>
        <h2>Como trabalhamos</h2>
        <ul>
          <li>
            Cada informação aponta para a fonte oficial de onde veio e a data em que foi obtida.
          </li>
          <li>
            Valores informam o que representam: estimado, contratado, empenhado, liquidado ou pago.
          </li>
          <li>
            Relações sugeridas entre registros são identificadas como sugestões, não como fatos.
          </li>
          <li>Alertas automáticos indicam situações para verificação, não acusações.</li>
          <li>As mesmas perguntas valem para qualquer partido, governo ou representante.</li>
          <li>Quando errarmos, corrigimos com destaque proporcional ao erro.</li>
        </ul>
      </section>

      <section>
        <h2>Quem faz a A Lupa</h2>
        <p>
          Nosso manifesto assume o compromisso de ser transparente sobre quem faz o projeto, como
          ele é financiado e quais interesses podem afetar nosso trabalho. Essas informações serão
          publicadas nesta página antes da abertura dos dados.
        </p>
      </section>

      <section id="contato">
        <h2>Contato</h2>
        <p>
          Para sugestões, correções, imprensa ou parcerias, escreva para{' '}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
        </p>
        <p>
          Órgãos públicos e representantes citados poderão apresentar esclarecimentos e documentos
          pelo mesmo canal; as respostas serão registradas junto ao conteúdo correspondente.
        </p>
      </section>
    </ContentPage>
  );
}
