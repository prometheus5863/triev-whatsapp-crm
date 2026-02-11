const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook');

// Gupshup often requires a GET request to verify the URL, and a POST to send the actual data
router.get('/webhook', webhookController.verifyWebhook);
router.post('/webhook', webhookController.receiveMessage);

module.exports = router;
