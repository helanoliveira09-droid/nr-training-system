// Script utilitário para popular o MongoDB com os dados padrão (setores e NRs).
// Uso:  node seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const Setor = require('./models/Setor');
const NRType = require('./models/NRType');
const { DEFAULT_NR_TYPES, DEFAULT_SETORES } = require('./seedData');

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('Defina MONGODB_URI no arquivo .env antes de rodar o seed.');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Conectado ao MongoDB.');

  const nrCount = await NRType.countDocuments();
  if (nrCount === 0) {
    await NRType.insertMany(DEFAULT_NR_TYPES);
    console.log('Normas (NR) padrão inseridas: ' + DEFAULT_NR_TYPES.length);
  } else {
    console.log('Coleção de NRs já possui dados, nada foi inserido.');
  }

  const setorCount = await Setor.countDocuments();
  if (setorCount === 0) {
    await Setor.insertMany(DEFAULT_SETORES);
    console.log('Setores padrão inseridos: ' + DEFAULT_SETORES.length);
  } else {
    console.log('Coleção de setores já possui dados, nada foi inserido.');
  }

  console.log('Seed concluído.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
