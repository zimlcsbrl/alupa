import type { z } from 'zod';

export class ErroFonte extends Error {
  constructor(
    message: string,
    readonly url: string,
    readonly status?: number,
    /** Erros definitivos (4xx, formato inválido) não são repetidos. */
    readonly definitivo = false,
  ) {
    super(message);
    this.name = 'ErroFonte';
  }
}

export interface RespostaBruta {
  url: string;
  status: number;
  /** Corpo exatamente como recebido; vazio em respostas 204. */
  texto: string;
  contentType: string | null;
}

export interface OpcoesHttp {
  tentativas?: number;
  timeoutMs?: number;
}

const espera = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * GET com novas tentativas (backoff exponencial) para falhas de rede, 5xx e 429.
 * Devolve o corpo bruto, para que o original possa ser guardado e ter seu hash calculado.
 */
export async function buscar(
  url: string,
  { tentativas = 4, timeoutMs = 60_000 }: OpcoesHttp = {},
): Promise<RespostaBruta> {
  let ultimoErro: unknown;

  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    try {
      const resposta = await fetch(url, {
        headers: { accept: 'application/json', 'user-agent': 'A Lupa (https://alupa.app)' },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (resposta.status >= 500 || resposta.status === 429) {
        throw new ErroFonte(`HTTP ${resposta.status}`, url, resposta.status);
      }
      if (!resposta.ok) {
        throw new ErroFonte(`HTTP ${resposta.status}`, url, resposta.status, true);
      }
      return {
        url,
        status: resposta.status,
        texto: resposta.status === 204 ? '' : await resposta.text(),
        contentType: resposta.headers.get('content-type'),
      };
    } catch (erro) {
      ultimoErro = erro;
      if ((erro instanceof ErroFonte && erro.definitivo) || tentativa === tentativas) break;
      await espera(500 * 2 ** (tentativa - 1));
    }
  }

  throw ultimoErro;
}

/**
 * Valida um corpo JSON contra o schema esperado.
 * Falha de validação indica mudança de formato na fonte e deve ser investigada, não repetida.
 */
export function validarJson<T extends z.ZodType>(resposta: RespostaBruta, schema: T): z.infer<T> {
  let dados: unknown;
  try {
    dados = JSON.parse(resposta.texto);
  } catch {
    throw new ErroFonte('Resposta não é JSON válido.', resposta.url, resposta.status, true);
  }
  const resultado = schema.safeParse(dados);
  if (!resultado.success) {
    throw new ErroFonte(
      `Formato inesperado: ${resultado.error.message}`,
      resposta.url,
      resposta.status,
      true,
    );
  }
  return resultado.data;
}

/** GET em JSON já validado, para fontes cujo original não precisa ser guardado. */
export async function buscarJson<T extends z.ZodType>(
  url: string,
  schema: T,
  opcoes?: OpcoesHttp,
): Promise<z.infer<T>> {
  return validarJson(await buscar(url, opcoes), schema);
}
