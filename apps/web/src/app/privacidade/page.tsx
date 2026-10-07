import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentPage } from '@/components/content-page';
import { contactEmail, pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  title: 'Política de privacidade',
  description:
    'Como a A Lupa trata dados pessoais de visitantes e de pessoas citadas em informações públicas, conforme a LGPD.',
  path: '/privacidade',
});

export default function PrivacidadePage() {
  return (
    <ContentPage
      eyebrow="POLÍTICA DE PRIVACIDADE"
      title="Privacidade"
      lead="Esta política explica quais dados pessoais a A Lupa trata, por quê e como você pode exercer seus direitos, conforme a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD)."
      updatedAt="6 de outubro de 2026"
    >
      <section>
        <h2>1. Resumo</h2>
        <ul>
          <li>Nesta versão do site não há cadastro, formulários, anúncios nem rastreamento.</li>
          <li>Não usamos cookies de publicidade ou de análise de comportamento.</li>
          <li>
            Registros técnicos de acesso são mantidos pelo serviço de hospedagem para segurança e
            funcionamento.
          </li>
          <li>
            Quando novos recursos tratarem dados pessoais, esta política será atualizada antes de
            eles entrarem no ar.
          </li>
        </ul>
      </section>

      <section>
        <h2>2. Quem é o responsável</h2>
        <p>
          A Lupa é a controladora dos dados pessoais tratados neste site. Para qualquer assunto
          sobre privacidade, incluindo o contato com o encarregado pelo tratamento de dados, escreva
          para <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
        </p>
      </section>

      <section>
        <h2>3. Dados de quem visita o site</h2>
        <h3>Registros de acesso</h3>
        <p>
          Ao acessar o site, o servidor recebe dados técnicos como endereço IP, data e hora,
          endereço da página, navegador e sistema operacional. Eles são usados para entregar as
          páginas, proteger o site contra abusos e investigar falhas, com base no legítimo interesse
          (art. 7º, IX, da LGPD) e no cumprimento de obrigação legal de guarda de registros (Marco
          Civil da Internet, Lei nº 12.965/2014, art. 15), pelo prazo de seis meses, salvo ordem
          judicial ou necessidade de apuração de incidente.
        </p>
        <h3>Contato por e-mail</h3>
        <p>
          Se você nos escrever, usaremos seu nome, endereço de e-mail e o conteúdo da mensagem
          apenas para responder e dar andamento ao assunto. Não publicamos a identidade de quem
          envia informações sem autorização expressa.
        </p>
        <h3>Cookies e armazenamento local</h3>
        <p>
          Esta versão não utiliza cookies próprios. O site pode guardar no seu navegador arquivos
          necessários para funcionar como aplicativo instalável (PWA), sem identificar você.
        </p>
      </section>

      <section>
        <h2>4. Dados pessoais em informações públicas</h2>
        <p>
          O propósito da A Lupa é organizar informações de interesse público publicadas por órgãos
          oficiais, como contratos, pagamentos, emendas e mandatos. Esses registros podem conter
          dados pessoais, por exemplo nomes de agentes públicos, de parlamentares ou de fornecedores
          pessoas físicas.
        </p>
        <p>Nesses casos, seguimos estas regras:</p>
        <ul>
          <li>
            O tratamento se apoia na finalidade, na boa-fé e no interesse público que justificaram a
            disponibilização desses dados (art. 7º, § 3º, da LGPD), além da Lei de Acesso à
            Informação (Lei nº 12.527/2011).
          </li>
          <li>
            Publicamos o mínimo necessário para entender o registro. Números de CPF não são exibidos
            por completo.
          </li>
          <li>
            Contatos de parlamentares e órgãos são apenas os institucionais e divulgados
            oficialmente, com indicação da fonte.
          </li>
          <li>
            Dados que não tenham relação com o interesse público do registro poderão ser omitidos ou
            removidos mediante solicitação justificada.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Compartilhamento</h2>
        <p>
          Não vendemos dados pessoais de visitantes. Podemos compartilhá-los apenas com fornecedores
          que nos ajudam a operar o site — hospedagem, proteção contra ataques e envio de e-mails —,
          que tratam os dados conforme nossas instruções, ou quando houver obrigação legal ou ordem
          judicial. Alguns desses fornecedores podem processar dados fora do Brasil, com as
          salvaguardas previstas na LGPD.
        </p>
      </section>

      <section>
        <h2>6. Seus direitos</h2>
        <p>
          Você pode pedir a confirmação de que tratamos seus dados, acesso, correção, anonimização,
          bloqueio ou eliminação de dados desnecessários, informações sobre compartilhamento e
          revisão de decisões automatizadas, entre outros direitos do art. 18 da LGPD. Escreva para{' '}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>. Também é possível apresentar
          reclamação à Autoridade Nacional de Proteção de Dados (ANPD).
        </p>
        <p>
          Pedidos sobre dados contidos em registros oficiais serão avaliados considerando o
          interesse público da informação. Quando o dado estiver incorreto na própria fonte,
          indicaremos o órgão responsável pela correção.
        </p>
      </section>

      <section>
        <h2>7. Segurança</h2>
        <p>
          Adotamos medidas técnicas e administrativas para proteger os dados, como conexão
          criptografada (HTTPS), controle de acesso e registro de alterações. Em caso de incidente
          de segurança relevante, comunicaremos os titulares afetados e a ANPD, conforme a lei.
        </p>
      </section>

      <section>
        <h2>8. Alterações</h2>
        <p>
          Esta política será revisada sempre que surgirem novos recursos, como cadastro, alertas,
          envio de informações ou enquetes. A data da última atualização fica no topo da página.
          Veja também os <Link href="/termos">Termos de uso</Link>.
        </p>
      </section>
    </ContentPage>
  );
}
