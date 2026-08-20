const mongoose = require('mongoose');

const InstrutorSchema = new mongoose.Schema(
  {
    nome: { type: String, default: '' },
    registro: { type: String, default: '' },
    conteudo: { type: String, default: '' }, // conteúdo/tópico ministrado por este instrutor
    data: { type: String, default: '' }
  },
  { _id: false }
);

const NRTypeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    conteudo: { type: String, default: '' }, // conteúdo programático geral da norma
    instrutores: { type: [InstrutorSchema], default: [] } // responsáveis técnicos padrão
  },
  { timestamps: true }
);

module.exports = mongoose.model('NRType', NRTypeSchema);
