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
  /** Tentativas extras quando a fonte limita a taxa (HTTP 429). */
  tentativasLimite?: number;
}

/** Espera pedida pela fonte em Retry-After (segundos ou data HTTP), em milissegundos. */
function esperaPedida(valor: string | null): number | null {
  if (!valor) return null;
  const segundos = Number(valor);
  if (Number.isFinite(segundos)) return segundos * 1000;
  const data = Date.parse(valor);
  return Number.isNaN(data) ? null : Math.max(0, data - Date.now());
}

const espera = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * GET com novas tentativas para falhas de rede e 5xx (backoff curto) e para limite de taxa,
 * HTTP 429 (espera o Retry-After ou 10 s, 20 s, 40 s, até 60 s).
 * Devolve o corpo bruto, para que o original possa ser guardado e ter seu hash calculado.
 */
export async function buscar(
  url: string,
  { tentativas = 4, timeoutMs = 60_000, tentativasLimite = 6 }: OpcoesHttp = {},
): Promise<RespostaBruta> {
  let falhas = 0;
  let limitadas = 0;

  for (;;) {
    let erro: unknown;
    let aguardar = 0;
    try {
      const resposta = await fetch(url, {
        headers: { accept: 'application/json', 'user-agent': 'A Lupa (https://alupa.app)' },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (resposta.status === 429) {
        limitadas++;
        erro = new ErroFonte('HTTP 429 (limite de requisições)', url, 429);
        aguardar =
          esperaPedida(resposta.headers.get('retry-after')) ??
          Math.min(60_000, 10_000 * 2 ** (limitadas - 1));
        if (limitadas > tentativasLimite) throw erro;
      } else if (resposta.status >= 500) {
        throw new ErroFonte(`HTTP ${resposta.status}`, url, resposta.status);
      } else if (!resposta.ok) {
        throw new ErroFonte(`HTTP ${resposta.status}`, url, resposta.status, true);
      } else {
        return {
          url,
          status: resposta.status,
          texto: resposta.status === 204 ? '' : await resposta.text(),
          contentType: resposta.headers.get('content-type'),
        };
      }
    } catch (e) {
      if (
        (e instanceof ErroFonte && (e.definitivo || e.status === 429)) ||
        ++falhas >= tentativas
      ) {
        throw e;
      }
      erro = e;
      aguardar = 500 * 2 ** (falhas - 1);
    }
    if (erro) await espera(aguardar);
  }
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
