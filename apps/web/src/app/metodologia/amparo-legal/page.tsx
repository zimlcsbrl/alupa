import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentPage } from '@/components/content-page';
import { contactEmail, pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  title: 'Amparo legal e método',
  description:
    'De onde vem cada informação publicada pela A Lupa, como a buscamos e em que leis nos apoiamos para divulgá-la.',
  path: '/metodologia/amparo-legal',
});

/** Bloco padrão de cada tipo de dado: fonte, método, base legal e o que não mostramos. */
function Ficha({
  fonte,
  metodo,
  amparo,
  limites,
}: {
  fonte: React.ReactNode;
  metodo: React.ReactNode;
  amparo: React.ReactNode;
  limites: React.ReactNode;
}) {
  return (
    <dl className="legal-sheet">
      <div>
        <dt>Fonte</dt>
        <dd>{fonte}</dd>
      </div>
      <div>
        <dt>Como buscamos</dt>
        <dd>{metodo}</dd>
      </div>
      <div>
        <dt>Por que podemos divulgar</dt>
        <dd>{amparo}</dd>
      </div>
      <div>
        <dt>O que não mostramos</dt>
        <dd>{limites}</dd>
      </div>
    </dl>
  );
}

export default function AmparoLegalPage() {
  return (
    <ContentPage
      eyebrow="METODOLOGIA"
      title={
        <>
          De onde vem e <em>por que publicamos.</em>
        </>
      }
      lead="Cada informação da A Lupa tem uma fonte oficial, um método de coleta e uma base legal. Esta página explica os três, tipo de dado por tipo de dado. Os ícones ? espalhados pelo site trazem você direto ao trecho correspondente."
      updatedAt="7 de outubro de 2026"
    >
      <section id="principios">
        <h2>Princípios que valem para tudo</h2>
        <ul>
          <li>
            <strong>Publicidade é a regra.</strong> A Constituição garante o direito de receber
            informações de interesse coletivo (art. 5º, XXXIII) e impõe publicidade à administração
            pública (art. 37). A Lei de Acesso à Informação (Lei nº 12.527/2011, art. 3º, I) define
            a publicidade como preceito geral e o sigilo como exceção.
          </li>
          <li>
            <strong>Dado público continua protegido pela LGPD.</strong> Quando reutilizamos dados
            pessoais que já são de acesso público, seguimos a Lei Geral de Proteção de Dados (Lei nº
            13.709/2018, art. 7º, §§ 3º e 7º): respeitar a finalidade e o interesse público que
            justificaram a divulgação original, com boa-fé e só o necessário (art. 6º).
          </li>
          <li>
            <strong>Agentes públicos têm privacidade relativizada no que é público.</strong> O
            Supremo Tribunal Federal reconheceu, com repercussão geral, que é legítimo divulgar o
            nome de servidores e o valor de suas remunerações (ARE 652.777, Tema 483, 2015), por se
            tratar de informação de interesse coletivo.
          </li>
          <li>
            <strong>Mesmo critério para todos.</strong> As regras desta página valem igualmente para
            qualquer partido, governo ou candidato.
          </li>
        </ul>
        <p className="data-note">
          Uma observação sobre &ldquo;pessoa politicamente exposta&rdquo; (PEP): esse é um conceito
          das regras contra lavagem de dinheiro (Resolução COAF nº 40/2021), que obriga bancos e
          outras instituições a monitorar operações. Ele não autoriza nem proíbe divulgar dados, e
          por isso não é usado aqui como fundamento.
        </p>
      </section>

      <section id="patrimonio">
        <h2>Candidaturas e bens declarados</h2>
        <Ficha
          fonte={
            <>
              Tribunal Superior Eleitoral, Portal de Dados Abertos: arquivos de candidatos e de bens
              de candidatos de cada eleição.
            </>
          }
          metodo={
            <>
              Baixamos os arquivos oficiais, guardamos o original com sua impressão digital (hash) e
              reproduzimos cada bem como declarado. Totais e variações são calculados por nós, a
              partir desses valores, sem correção pela inflação, salvo quando indicado.
            </>
          }
          amparo={
            <>
              A declaração de bens é exigida pela lei eleitoral para o registro de candidatura (Lei
              nº 9.504/1997, art. 11, § 1º, IV) e é publicada pela própria Justiça Eleitoral para
              controle social. Reutilizamos esse dado com a mesma finalidade (LGPD, art. 7º, §§ 3º e
              7º).
            </>
          }
          limites={
            <>
              Não fazemos avaliação de mercado dos bens nem afirmamos irregularidade a partir de
              variações patrimoniais.
            </>
          }
        />
      </section>

      <section id="cpf">
        <h2>CPF de candidatos</h2>
        <Ficha
          fonte={
            <>
              Arquivos de candidatos do TSE. O CPF foi ocultado pela Resolução TSE nº 23.729/2024 e
              voltou a ser informação pública com a Resolução TSE nº 23.754/2026.
            </>
          }
          metodo={
            <>
              Usamos o CPF para distinguir homônimos e ligar a mesma pessoa entre eleições e bases
              (candidaturas, empresas). Internamente, ele fica cifrado; a ligação entre bases usa
              uma impressão digital irreversível (HMAC), não o número.
            </>
          }
          amparo={
            <>
              Ligar registros da mesma pessoa é exatamente a finalidade de controle social que levou
              o TSE a tornar o CPF público. Seguimos o princípio da necessidade da LGPD (art. 6º,
              III): usamos o dado para cruzar, sem expô-lo por inteiro.
            </>
          }
          limites={
            <>
              Exibimos no máximo o CPF parcial (<code>***.456.789-**</code>), no formato do Portal
              da Transparência e da Receita Federal. O título de eleitor nunca é exibido.
            </>
          }
        />
      </section>

      <section id="empresas">
        <h2>Participação em empresas</h2>
        <Ficha
          fonte={
            <>
              Receita Federal, dados abertos do CNPJ (quadro de sócios e administradores, empresas e
              estabelecimentos), publicados mensalmente na Política de Dados Abertos do Poder
              Executivo federal (Decreto nº 8.777/2016).
            </>
          }
          metodo={
            <>
              A base mostra o nome do sócio e os 6 dígitos do meio do CPF. Ligamos uma pessoa a uma
              empresa quando nome civil e esses dígitos coincidem com o CPF que ela informou ao TSE.
              Cada ligação aparece como <strong>possível correspondência</strong> até ser confirmada
              por outra fonte.
            </>
          }
          amparo={
            <>
              O registro de empresas é público por lei: qualquer pessoa pode consultar os
              assentamentos das juntas comerciais sem precisar provar interesse (Lei nº 8.934/1994,
              art. 29), e a própria Receita publica o quadro de sócios em formato aberto. Conhecer
              os vínculos empresariais de quem disputa ou exerce cargo público serve à prevenção de
              conflitos de interesse.
            </>
          }
          limites={
            <>
              Não mostramos telefones nem e-mails das empresas. Para empresário individual e MEI,
              cujo endereço costuma ser a residência do titular, mostramos só município e UF. Ser
              sócio de uma empresa não é irregularidade.
            </>
          }
        />
      </section>

      <section id="contratos">
        <h2>Contratações e contratos públicos</h2>
        <Ficha
          fonte={<>Portal Nacional de Contratações Públicas (PNCP), API de consulta.</>}
          metodo={
            <>
              Coletamos as contratações e os contratos publicados e guardamos o registro original,
              com data e impressão digital, de tudo o que exibimos. Informamos sempre a etapa do
              valor: estimado, homologado, contratado, empenhado ou pago. Quando o órgão não divulga
              a estimativa, mostramos &ldquo;não divulgado&rdquo;, não zero.
            </>
          }
          amparo={
            <>
              A Lei nº 14.133/2021 (art. 174) criou o PNCP justamente para a divulgação centralizada
              e obrigatória dos atos de contratação pública. A LAI (art. 8º) também exige a
              divulgação de licitações e contratos.
            </>
          }
          limites={
            <>
              Por ora, não publicamos dados de fornecedores pessoas físicas. Ligações entre
              contratos e empresas de políticos indicam relações a verificar, não conclusões.
            </>
          }
        />
      </section>

      <section id="contatos">
        <h2>Contatos de políticos e órgãos</h2>
        <Ficha
          fonte={
            <>
              Páginas oficiais da Câmara dos Deputados, do Senado Federal e da Assembleia
              Legislativa do RJ.
            </>
          }
          metodo={
            <>
              Registramos apenas contatos institucionais publicados pelas próprias Casas, com a
              fonte e a data da verificação.
            </>
          }
          amparo={
            <>
              São canais criados para o atendimento ao público e divulgados pelo próprio poder
              público (LAI, art. 8º).
            </>
          }
          limites={
            <>
              Não publicamos telefones ou e-mails pessoais. A A Lupa não envia mensagens em nome de
              ninguém.
            </>
          }
        />
      </section>

      <section id="imprensa">
        <h2>Imprensa</h2>
        <Ficha
          fonte={<>Matérias de veículos de uma lista aprovada pela equipe editorial.</>}
          metodo={
            <>
              Guardamos só a referência (título, veículo, data e link) e um resumo curto escrito
              pela A Lupa. O mesmo critério de seleção vale para todos os políticos.
            </>
          }
          amparo={
            <>
              Indicar e comentar reportagens publicadas é exercício da liberdade de informação
              (Constituição, art. 220). O conteúdo é de responsabilidade de cada veículo.
            </>
          }
          limites={<>Não reproduzimos o texto das matérias.</>}
        />
      </section>

      <section id="direitos">
        <h2>Correções e direitos</h2>
        <p>
          Se você é citado em alguma informação, pode pedir acesso, correção ou revisão, nos termos
          da LGPD (art. 18) e da nossa <Link href="/privacidade">Política de privacidade</Link>.
          Pedidos sobre dados que vêm de registros oficiais são avaliados considerando o interesse
          público da informação; quando o erro está na fonte, indicamos o órgão responsável. Escreva
          para <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
        </p>
        <p className="data-note">
          Esta página descreve como a A Lupa interpreta e aplica a legislação. Ela não é um parecer
          jurídico e está em revisão por assessoria jurídica.
        </p>
      </section>
    </ContentPage>
  );
}
