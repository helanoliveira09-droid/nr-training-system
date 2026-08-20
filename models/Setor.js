const mongoose = require('mongoose');

const SetorSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    responsavel: { type: String, default: '', trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setor', SetorSchema);
