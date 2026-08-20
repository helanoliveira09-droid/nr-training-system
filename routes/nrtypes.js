const router = require('express').Router();
const NRType = require('../models/NRType');
const adminAuth = require('../middleware/adminAuth');

router.get('/', async (req, res) => {
  try {
    const items = await NRType.find().sort({ code: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', adminAuth, async (req, res) => {
  try {
    const item = await NRType.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const item = await NRType.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ error: 'Norma não encontrada.' });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await NRType.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Popula o banco com as NRs padrão (usado apenas se a coleção estiver vazia)
router.post('/seed', adminAuth, async (req, res) => {
  try {
    const count = await NRType.countDocuments();
    if (count > 0) return res.json({ ok: true, seeded: false });
    const defaults = require('../seedData').DEFAULT_NR_TYPES;
    await NRType.insertMany(defaults);
    res.json({ ok: true, seeded: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
