import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentPage } from '@/components/content-page';
import { contactEmail, pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  title: 'Termos de uso',
  description:
    'Regras de uso da A Lupa: consulta gratuita, limites das informações, direitos sobre o conteúdo e uso em massa dos dados.',
  path: '/termos',
});

export default function TermosPage() {
  return (
    <ContentPage
      eyebrow="TERMOS DE USO"
      title="Termos de uso"
      lead="Ao usar a A Lupa, você concorda com estes termos. Eles existem para manter a consulta aberta a todos e proteger a qualidade das informações."
      updatedAt="6 de outubro de 2026"
    >
      <section>
        <h2>1. O serviço</h2>
        <p>
          A A Lupa reúne, organiza e explica informações públicas brasileiras. A consulta pelo site
          e pelo aplicativo é gratuita e não exige cadastro. Recursos que dependam de conta, como
          acompanhamento de assuntos e alertas, terão regras próprias informadas antes do uso.
        </p>
        <p>
          O projeto está em construção, e funcionalidades podem ser incluídas, alteradas ou
          interrompidas a qualquer momento.
        </p>
      </section>

      <section>
        <h2>2. Natureza e limites das informações</h2>
        <ul>
          <li>
            Os dados vêm de fontes oficiais e são apresentados com indicação da origem e da data de
            obtenção. Eles podem conter erros, atrasos ou lacunas da própria fonte.
          </li>
          <li>
            A ausência de um registro na A Lupa não significa que a despesa, o contrato ou o fato
            não existam: nossa cobertura é parcial e informada em cada assunto.
          </li>
          <li>
            Relações sugeridas e alertas automáticos indicam situações para verificação. Eles não
            são acusações nem conclusões sobre a conduta de pessoas ou instituições.
          </li>
          <li>
            Conteúdos editoriais são identificados e separados dos dados importados. Para decisões
            com efeito jurídico, consulte sempre o documento oficial.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Correções e direito de resposta</h2>
        <p>
          Se encontrar um erro ou for citado em algum conteúdo, escreva para{' '}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a> com a referência e, se possível, o
          documento que sustenta a correção. Avaliaremos cada pedido e registraremos as correções
          relevantes junto ao conteúdo.
        </p>
      </section>

      <section>
        <h2>4. Uso permitido</h2>
        <p>
          Você pode consultar, citar, compartilhar links e reproduzir trechos do conteúdo para fins
          pessoais, educacionais, jornalísticos ou de controle social, desde que indique a A Lupa
          como fonte e inclua o link para a página consultada.
        </p>
      </section>

      <section>
        <h2>5. Uso automatizado e dados em massa</h2>
        <p>
          Os dados brutos continuam disponíveis gratuitamente nas fontes oficiais. A base da A Lupa
          — com seleção, tratamento, normalização, relações e histórico — é uma compilação protegida
          pela Lei de Direitos Autorais (Lei nº 9.610/1998, art. 7º, XIII).
        </p>
        <p>Por isso, sem autorização prévia e por escrito, não é permitido:</p>
        <ul>
          <li>
            extrair o conteúdo de forma automatizada ou em massa, por robôs, raspadores ou programas
            semelhantes;
          </li>
          <li>
            reproduzir, redistribuir ou comercializar partes substanciais da base, ou criar produtos
            ou serviços concorrentes a partir dela;
          </li>
          <li>
            contornar limites de acesso, desafios de verificação ou outras medidas de proteção do
            site.
          </li>
        </ul>
        <p>
          Buscadores podem indexar as páginas conforme as regras do arquivo robots.txt. Veículos,
          empresas e instituições interessados em acesso em volume ou por API podem escrever para{' '}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
        </p>
      </section>

      <section>
        <h2>6. Condutas proibidas</h2>
        <ul>
          <li>Usar o site para atividades ilegais, assédio, ameaças ou discriminação.</li>
          <li>
            Prejudicar o funcionamento do site, sobrecarregá-lo ou tentar acesso não autorizado.
          </li>
          <li>Apresentar informações da A Lupa de forma distorcida ou fora de contexto.</li>
        </ul>
      </section>

      <section>
        <h2>7. Marca e conteúdo</h2>
        <p>
          O nome, a marca, o logo, os textos editoriais e o design da A Lupa pertencem ao projeto.
          Seu uso fora das hipóteses do item 4 depende de autorização.
        </p>
      </section>

      <section>
        <h2>8. Links externos</h2>
        <p>
          O site aponta para páginas de órgãos públicos e outras fontes. Não controlamos esses
          endereços nem respondemos por seu conteúdo ou disponibilidade.
        </p>
      </section>

      <section>
        <h2>9. Responsabilidade</h2>
        <p>
          Trabalhamos para manter as informações corretas e o site disponível, mas não garantimos
          ausência de erros ou interrupções. A A Lupa não se responsabiliza por decisões tomadas
          exclusivamente com base no conteúdo publicado, sem consulta às fontes oficiais.
        </p>
      </section>

      <section>
        <h2>10. Privacidade</h2>
        <p>
          O tratamento de dados pessoais segue a nossa{' '}
          <Link href="/privacidade">Política de privacidade</Link>.
        </p>
      </section>

      <section>
        <h2>11. Alterações e legislação</h2>
        <p>
          Estes termos podem ser atualizados, e a data da última versão fica no topo da página.
          Aplica-se a legislação brasileira.
        </p>
      </section>
    </ContentPage>
  );
}
