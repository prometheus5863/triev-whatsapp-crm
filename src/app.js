const express = require('express');
const config = require('./config');
const webhook = require('./controllers/webhook');

const app = express();
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

app.get('/webhook', webhook.verifyWebhook);
app.post('/webhook', webhook.handleWebhook);

app.get('/', (req, res) => res.send('TriEV WhatsApp CRM Bot is running!'));
app.get('/health', (req, res) => res.json({ ok: true, dryRun: config.dryRun, activeSessions: webhook.sessions.size }));

if (require.main === module) {
    app.listen(config.port, () => {
        console.log(`Server on :${config.port}${config.dryRun ? ' (DRY_RUN: nothing is sent to WhatsApp)' : ''}`);
    });
}

module.exports = app;
