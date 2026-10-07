import { z } from 'zod';
import { buscarJson } from './http';

/** Dados Abertos do Senado: https://www12.senado.leg.br/dados-abertos */
export const URL_LISTA_ATUAL = 'https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json';

const legislaturaSchema = z.object({ DataInicio: z.string(), DataFim: z.string() });

const parlamentarSchema = z.object({
  IdentificacaoParlamentar: z.object({
    CodigoParlamentar: z.string(),
    NomeParlamentar: z.string(),
    NomeCompletoParlamentar: z.string().nullish(),
    UrlFotoParlamentar: z.string().nullish(),
    UrlPaginaParlamentar: z.string().nullish(),
    EmailParlamentar: z.string().nullish(),
    SiglaPartidoParlamentar: z.string().nullish(),
    // Ausente em alguns registros; a UF usada é a do mandato.
    UfParlamentar: z.string().nullish(),
  }),
  Mandato: z.object({
    CodigoMandato: z.string(),
    UfParlamentar: z.string().length(2),
    DescricaoParticipacao: z.string().nullish(),
    PrimeiraLegislaturaDoMandato: legislaturaSchema,
    SegundaLegislaturaDoMandato: legislaturaSchema.nullish(),
  }),
});

// Com um único parlamentar, a API devolve um objeto em vez de lista.
const listaSchema = z.object({
  ListaParlamentarEmExercicio: z.object({
    Parlamentares: z.object({
      Parlamentar: z.union([z.array(parlamentarSchema), parlamentarSchema]),
    }),
  }),
});

export interface SenadorEmExercicio {
  codigo: string;
  nome: string;
  nomeCompleto: string | null;
  fotoUrl: string | null;
  paginaUrl: string | null;
  email: string | null;
  partido: string | null;
  uf: string;
  mandato: { codigo: string; inicio: string; fim: string; participacao: string | null };
}

const https = (url: string | null | undefined) => url?.replace(/^http:\/\//, 'https://') ?? null;

export async function senadoresEmExercicio(): Promise<SenadorEmExercicio[]> {
  const dados = await buscarJson(URL_LISTA_ATUAL, listaSchema);
  const lista = dados.ListaParlamentarEmExercicio.Parlamentares.Parlamentar;
  return (Array.isArray(lista) ? lista : [lista]).map(
    ({ IdentificacaoParlamentar: p, Mandato: m }) => ({
      codigo: p.CodigoParlamentar,
      nome: p.NomeParlamentar,
      nomeCompleto: p.NomeCompletoParlamentar ?? null,
      fotoUrl: https(p.UrlFotoParlamentar),
      paginaUrl: https(p.UrlPaginaParlamentar),
      email: p.EmailParlamentar ?? null,
      partido: p.SiglaPartidoParlamentar ?? null,
      uf: m.UfParlamentar,
      mandato: {
        codigo: m.CodigoMandato,
        inicio: m.PrimeiraLegislaturaDoMandato.DataInicio,
        fim: (m.SegundaLegislaturaDoMandato ?? m.PrimeiraLegislaturaDoMandato).DataFim,
        participacao: m.DescricaoParticipacao ?? null,
      },
    }),
  );
}
