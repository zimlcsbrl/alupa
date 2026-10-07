import { config } from 'dotenv';
import { createDb } from '../client';
import { fonte } from '../schema';

config({ path: '../../.env' });

const fontes = [
  {
    codigo: 'pncp',
    nome: 'Portal Nacional de Contratações Públicas',
    urlDocumentacao: 'https://pncp.gov.br/api/consulta/swagger-ui/index.html',
  },
  {
    codigo: 'camara',
    nome: 'Câmara dos Deputados — Dados Abertos',
    urlDocumentacao: 'https://dadosabertos.camara.leg.br/swagger/api.html',
  },
  {
    codigo: 'senado',
    nome: 'Senado Federal — Dados Abertos',
    urlDocumentacao: 'https://www12.senado.leg.br/dados-abertos',
  },
  {
    codigo: 'ibge-localidades',
    nome: 'IBGE — API de Localidades',
    urlDocumentacao: 'https://servicodados.ibge.gov.br/api/docs/localidades',
  },
];

const db = createDb('direct');

await db.insert(fonte).values(fontes).onConflictDoNothing({ target: fonte.codigo });
console.log(`Seed concluído: ${fontes.length} fontes verificadas.`);

await db.$client.end();
