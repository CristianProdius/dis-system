const express = require('express');
const router = express.Router();
const discourseController = require('../controllers/discourseController');

router.get('/channels', (req, res) => discourseController.listChannels(req, res));
router.get('/channel/:id', (req, res) => discourseController.getChannel(req, res));
router.post('/channel', (req, res) => discourseController.createChannel(req, res));
router.post('/post', (req, res) => discourseController.createPost(req, res));

module.exports = router;
