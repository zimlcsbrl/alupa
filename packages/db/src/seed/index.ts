import { config } from 'dotenv';
import { createDb } from '../client';
import { fonte } from '../schema';
import { seedLocalidades } from './localidades';

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

try {
  await db.insert(fonte).values(fontes).onConflictDoNothing({ target: fonte.codigo });
  console.log(`Fontes: ${fontes.length} verificadas.`);

  const localidades = await seedLocalidades(db);
  console.log(`Localidades: União, ${localidades.ufs} UFs e ${localidades.municipios} municípios.`);
} finally {
  await db.$client.end();
}
