import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';
import { apenasDigitos } from './texto';

/**
 * Impressões digitais de documentos para ligar registros da mesma pessoa entre fontes e anos
 * sem armazenar o documento. Usa HMAC-SHA256 com chave secreta: um hash simples seria
 * reversível, porque o espaço de CPFs e títulos é pequeno.
 */
function hmac(tipo: string, digitos: string, segredo: string) {
  if (!segredo || segredo.length < 32) {
    throw new Error('ALUPA_CHAVE_IDENTIDADE ausente ou curta demais (mínimo 32 caracteres).');
  }
  return createHmac('sha256', segredo).update(`${tipo}:${digitos}`).digest('hex');
}

/** Chave a partir do CPF; null para CPFs ausentes, mascarados ou inválidos. */
export function chaveDeIdentidade(cpf: string | null | undefined, segredo: string): string | null {
  const digitos = apenasDigitos(cpf ?? '');
  if (digitos.length !== 11 || /^(\d)\1{10}$/.test(digitos)) {
    hmac('cpf', '', segredo); // valida o segredo mesmo sem CPF
    return null;
  }
  return hmac('cpf', digitos, segredo);
}

/**
 * Chave a partir do título de eleitor (12 dígitos). O TSE mascarou o CPF nos arquivos de 2024,
 * mas manteve o título: é ele que liga 2024 a 2022 e 2026.
 */
export function chaveDeTitulo(titulo: string | null | undefined, segredo: string): string | null {
  const digitos = apenasDigitos(titulo ?? '');
  if (digitos.length !== 12 || /^(\d)\1{11}$/.test(digitos)) return null;
  return hmac('titulo', digitos, segredo);
}

/**
 * CPF no formato usado pelo Portal da Transparência e pela base de sócios da Receita:
 * só os 6 dígitos do meio ficam visíveis ("***.456.789-**").
 */
export function mascararCpf(cpf: string | null | undefined): string | null {
  const d = apenasDigitos(cpf ?? '');
  if (d.length !== 11) return null;
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
}

const VERSAO_CIFRA = 'v1';

function chaveAes(chaveBase64: string) {
  const chave = Buffer.from(chaveBase64 ?? '', 'base64');
  if (chave.length !== 32) {
    throw new Error('ALUPA_CHAVE_CIFRA ausente ou inválida (precisa ter 32 bytes em base64).');
  }
  return chave;
}

/** Cifra um texto com AES-256-GCM. Resultado: "v1:<base64 de iv|tag|conteúdo>". */
export function cifrar(texto: string, chaveBase64: string): string {
  const iv = randomBytes(12);
  const cifra = createCipheriv('aes-256-gcm', chaveAes(chaveBase64), iv);
  const conteudo = Buffer.concat([cifra.update(texto, 'utf8'), cifra.final()]);
  return `${VERSAO_CIFRA}:${Buffer.concat([iv, cifra.getAuthTag(), conteudo]).toString('base64')}`;
}

/** Decifra um valor produzido por `cifrar`; falha se o conteúdo tiver sido alterado. */
export function decifrar(valor: string, chaveBase64: string): string {
  const [versao, corpo] = valor.split(':');
  if (versao !== VERSAO_CIFRA || !corpo) throw new Error('Formato de valor cifrado desconhecido.');
  const bruto = Buffer.from(corpo, 'base64');
  const decifra = createDecipheriv('aes-256-gcm', chaveAes(chaveBase64), bruto.subarray(0, 12));
  decifra.setAuthTag(bruto.subarray(12, 28));
  return Buffer.concat([decifra.update(bruto.subarray(28)), decifra.final()]).toString('utf8');
}
