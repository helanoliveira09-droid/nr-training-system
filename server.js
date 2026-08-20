require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const setoresRouter = require('./routes/setores');
const nrtypesRouter = require('./routes/nrtypes');
const treinamentosRouter = require('./routes/treinamentos');
const configRouter = require('./routes/config');
const authRouter = require('./routes/auth');

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' })); // permite anexar certificados PDF / logo em base64

// ---------- API ----------
app.use('/api/auth', authRouter);
app.use('/api/setores', setoresRouter);
app.use('/api/nrtypes', nrtypesRouter);
app.use('/api/treinamentos', treinamentosRouter);
app.use('/api/config', configRouter);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// ---------- FRONTEND ESTATICO ----------
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERRO: defina a variavel de ambiente MONGODB_URI (veja .env.example).');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB conectado.');
    app.listen(PORT, () => console.log('Servidor rodando na porta ' + PORT));
  })
  .catch((err) => {
    console.error('Erro ao conectar ao MongoDB:', err.message);
    process.exit(1);
  });
