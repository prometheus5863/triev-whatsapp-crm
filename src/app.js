const express = require('express');
const dotenv = require('dotenv');
const webhookController = require('./controllers/webhook');

dotenv.config();

const app = express();

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Webhook route
app.post('/webhook', webhookController.handleWebhook);

// Basic health check route
app.get('/', (req, res) => {
  res.send('TriEV WhatsApp CRM Bot is running!');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
