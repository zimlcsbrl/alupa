/** Remove acentos e marcas diacríticas, preservando as letras base. */
export function semAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/\p{M}/gu, '');
}

/** Slug legível para URLs: minúsculas, sem acentos, palavras separadas por hífen. */
export function slugify(texto: string): string {
  return semAcentos(texto)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Mantém só os dígitos de um identificador (CNPJ, CPF, código IBGE). */
export function apenasDigitos(texto: string): string {
  return texto.replace(/\D/g, '');
}

/**
 * Normaliza um CNPJ para 14 dígitos, aceitando entrada com ou sem máscara.
 * Retorna null se o valor não tiver 14 dígitos ou se os dígitos verificadores não conferirem.
 */
export function normalizarCnpj(texto: string): string | null {
  const cnpj = apenasDigitos(texto);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return null;

  const digito = (base: string) => {
    let peso = base.length - 7;
    let soma = 0;
    for (const c of base) {
      soma += Number(c) * peso--;
      if (peso < 2) peso = 9;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const d1 = digito(cnpj.slice(0, 12));
  const d2 = digito(cnpj.slice(0, 12) + d1);
  return cnpj.endsWith(`${d1}${d2}`) ? cnpj : null;
}

/** Nome para comparação entre fontes: maiúsculas, sem acentos, pontuação ou espaços extras. */
export function normalizarNome(nome: string): string {
  return semAcentos(nome)
    .toUpperCase()
    .replace(/[^A-Z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Dígitos verificadores de um CNPJ a partir dos 12 primeiros dígitos. */
function digitosCnpj(base12: string): string {
  const dv = (base: string) => {
    let peso = base.length - 7;
    let soma = 0;
    for (const c of base) {
      soma += Number(c) * peso--;
      if (peso < 2) peso = 9;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = dv(base12);
  return `${d1}${dv(base12 + d1)}`;
}

/** CNPJ completo da matriz (ordem 0001) a partir dos 8 dígitos-base. */
export function cnpjDaMatriz(cnpjBasico: string): string | null {
  if (!/^\d{8}$/.test(cnpjBasico)) return null;
  const base = `${cnpjBasico}0001`;
  return base + digitosCnpj(base);
}
