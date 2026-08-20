const mongoose = require('mongoose');

const InstrutorSchema = new mongoose.Schema(
  {
    nome: { type: String, default: '' },
    registro: { type: String, default: '' },
    conteudo: { type: String, default: '' },
    data: { type: String, default: '' }
  },
  { _id: false }
);

const TreinamentoSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    setorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Setor' },
    funcao: { type: String, default: '' },
    nrId: { type: mongoose.Schema.Types.ObjectId, ref: 'NRType', required: true },
    dataTreinamento: { type: String, default: '' },
    carga: { type: String, default: '' },
    validadeTipo: { type: String, default: '1' }, // 1=anual, 2=bienal, 3=trienal, 0=personalizado
    validadeData: { type: String, default: '' },
    local: { type: String, default: '' },
    dias: { type: String, default: '' },
    conteudo: { type: String, default: '' },
    instrutores: { type: [InstrutorSchema], default: [] },
    obs: { type: String, default: '' },
    certFile: {
      name: { type: String, default: '' },
      dataUrl: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Treinamento', TreinamentoSchema);
