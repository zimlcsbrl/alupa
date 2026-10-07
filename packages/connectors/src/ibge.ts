import { z } from 'zod';
import { buscarJson } from './http';

/** API de Localidades do IBGE: https://servicodados.ibge.gov.br/api/docs/localidades */
const BASE = 'https://servicodados.ibge.gov.br/api/v1/localidades';

const estadoSchema = z.object({
  id: z.number().int(),
  sigla: z.string().length(2),
  nome: z.string().min(1),
});

/** Visão "nivelado": um objeto plano por município, com a UF já resolvida. */
const municipioNiveladoSchema = z.object({
  'municipio-id': z.number().int(),
  'municipio-nome': z.string().min(1),
  'UF-id': z.number().int(),
  'UF-sigla': z.string().length(2),
});

export interface UfIbge {
  codigo: string;
  sigla: string;
  nome: string;
}

export interface MunicipioIbge {
  codigo: string;
  nome: string;
  codigoUf: string;
  siglaUf: string;
}

export async function listarUfs(): Promise<UfIbge[]> {
  const estados = await buscarJson(`${BASE}/estados`, z.array(estadoSchema));
  return estados.map((e) => ({ codigo: String(e.id), sigla: e.sigla, nome: e.nome }));
}

export async function listarMunicipios(): Promise<MunicipioIbge[]> {
  const municipios = await buscarJson(
    `${BASE}/municipios?view=nivelado`,
    z.array(municipioNiveladoSchema),
  );
  return municipios.map((m) => ({
    codigo: String(m['municipio-id']),
    nome: m['municipio-nome'],
    codigoUf: String(m['UF-id']),
    siglaUf: m['UF-sigla'],
  }));
}
