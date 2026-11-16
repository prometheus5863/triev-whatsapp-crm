const config = require('../config');

// Tickets saved in DRY_RUN (no SHEET_WEBHOOK_URL) stay in memory.
const memory = [];

async function saveTicket(ticket) {
    if (config.dryRun || !config.sheetWebhookUrl) {
        memory.push(ticket);
        return { dryRun: true };
    }
    // Google Apps Script web app that appends a row to the tickets sheet
    // (AppSheet reads the same sheet). text/plain avoids a CORS preflight.
    const res = await fetch(config.sheetWebhookUrl, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(ticket),
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Sheet save failed: HTTP ${res.status}`);
    return res.json().catch(() => ({}));
}

module.exports = { saveTicket, memory };
