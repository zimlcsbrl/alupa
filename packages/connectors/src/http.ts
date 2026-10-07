import type { z } from 'zod';

export class ErroFonte extends Error {
  constructor(
    message: string,
    readonly url: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ErroFonte';
  }
}

const espera = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * GET em JSON com novas tentativas (backoff exponencial) e validação do formato.
 * Falha de validação não é repetida: indica mudança de formato na fonte e deve ser investigada.
 */
export async function buscarJson<T extends z.ZodType>(
  url: string,
  schema: T,
  { tentativas = 4, timeoutMs = 30_000 }: { tentativas?: number; timeoutMs?: number } = {},
): Promise<z.infer<T>> {
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
        // Erros 4xx não melhoram com nova tentativa.
        throw Object.assign(new ErroFonte(`HTTP ${resposta.status}`, url, resposta.status), {
          definitivo: true,
        });
      }

      const resultado = schema.safeParse(await resposta.json());
      if (!resultado.success) {
        throw Object.assign(new ErroFonte(`Formato inesperado: ${resultado.error.message}`, url), {
          definitivo: true,
        });
      }
      return resultado.data;
    } catch (erro) {
      ultimoErro = erro;
      if ((erro as { definitivo?: boolean }).definitivo || tentativa === tentativas) break;
      await espera(500 * 2 ** (tentativa - 1));
    }
  }

  throw ultimoErro;
}
