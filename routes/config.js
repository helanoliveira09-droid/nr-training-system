const router = require('express').Router();
const Config = require('../models/Config');
const adminAuth = require('../middleware/adminAuth');

router.get('/', async (req, res) => {
  try {
    let cfg = await Config.findOne();
    if (!cfg) cfg = await Config.create({});
    res.json(cfg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', adminAuth, async (req, res) => {
  try {
    let cfg = await Config.findOne();
    if (!cfg) {
      cfg = await Config.create(req.body);
    } else {
      cfg.set(req.body);
      await cfg.save();
    }
    res.json(cfg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
