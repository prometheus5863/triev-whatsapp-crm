const config = require('../config');
const flow = require('../bot/flow');
const { sendMessage } = require('../services/gupshup');
const { saveTicket } = require('../services/database');
const { createStore } = require('../services/sessions');

const sessions = createStore(config.sessionTtlMs);
setInterval(() => sessions.sweep(), 60 * 1000).unref();

// Gupshup sends two shapes: Enterprise Gateway (flat form fields) and the
// self-serve API (nested JSON). Accept both.
function parseInbound(body = {}) {
    const inner = body.payload || {};
    const phone = body.mobile || body.sender || inner.source || (inner.sender && inner.sender.phone);
    const text = body.text || (inner.payload && inner.payload.text);
    if (!phone || typeof text !== 'string') return null; // delivery receipt, media, etc.
    return { phone: String(phone), text };
}

async function process(phone, text) {
    const { session, replies, ticket } = flow.step(sessions.get(phone), text, phone);
    sessions.set(phone, session);
    for (const r of replies) await sendMessage(phone, r);
    if (ticket) {
        try {
            await saveTicket(ticket);
            await sendMessage(phone, flow.confirmation(ticket));
        } catch (err) {
            console.error('Ticket save failed:', err.message);
            await sendMessage(phone, flow.MESSAGES.saveFailed);
        }
    }
}

async function handleWebhook(req, res) {
    if (config.webhookSecret && req.query.secret !== config.webhookSecret) {
        return res.status(401).send('unauthorized');
    }
    // Acknowledge first so Gupshup does not retry while we work.
    res.status(200).send('success');
    const inbound = parseInbound(req.body);
    if (!inbound) return;
    try {
        await process(inbound.phone, inbound.text);
    } catch (err) {
        console.error('Webhook handler error:', err.message);
    }
}

const verifyWebhook = (req, res) => res.status(200).send('Webhook is live');

module.exports = { handleWebhook, verifyWebhook, parseInbound, process, sessions };
