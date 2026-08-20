const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema(
  {
    empresaNome: { type: String, default: '' },
    logoDataUrl: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Config', ConfigSchema);
