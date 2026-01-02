const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplaceController');

router.get('/list', (req, res) => marketplaceController.listItems(req, res));
router.get('/item/:id', (req, res) => marketplaceController.getItem(req, res));
router.post('/item', (req, res) => marketplaceController.createItem(req, res));
router.post('/purchase', (req, res) => marketplaceController.purchaseItem(req, res));

module.exports = router;
