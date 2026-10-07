import { z } from 'zod';
import { buscarJson } from './http';

/** API de Dados Abertos da Câmara: https://dadosabertos.camara.leg.br/swagger/api.html */
const BASE = 'https://dadosabertos.camara.leg.br/api/v2';

const deputadoSchema = z.object({
  id: z.number().int(),
  nome: z.string(),
  siglaPartido: z.string().nullish(),
  siglaUf: z.string().length(2),
  idLegislatura: z.number().int(),
  urlFoto: z.string().nullish(),
  email: z.string().nullish(),
});

const paginaSchema = z.object({
  dados: z.array(deputadoSchema),
  links: z.array(z.object({ rel: z.string(), href: z.string() })),
});

const legislaturaSchema = z.object({
  dados: z.object({ id: z.number().int(), dataInicio: z.string(), dataFim: z.string() }),
});

export type DeputadoCamara = z.infer<typeof deputadoSchema>;

export const urlPerfil = (id: number) => `https://www.camara.leg.br/deputados/${id}`;
export const urlApiDeputado = (id: number) => `${BASE}/deputados/${id}`;

/** Deputados em exercício (padrão da API: a legislatura atual). */
export async function deputadosEmExercicio(): Promise<DeputadoCamara[]> {
  const deputados: DeputadoCamara[] = [];
  let url: string | undefined = `${BASE}/deputados?itens=100&pagina=1&ordem=ASC&ordenarPor=nome`;
  while (url) {
    const pagina: z.infer<typeof paginaSchema> = await buscarJson(url, paginaSchema);
    deputados.push(...pagina.dados);
    url = pagina.links.find((l) => l.rel === 'next')?.href;
  }
  return deputados;
}

export async function legislatura(id: number) {
  const { dados } = await buscarJson(`${BASE}/legislaturas/${id}`, legislaturaSchema);
  return { id: dados.id, inicio: dados.dataInicio, fim: dados.dataFim };
}
