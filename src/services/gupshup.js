const config = require('../config');

// Outbound messages in DRY_RUN land here so tests and /debug can read them.
const outbox = [];

async function sendMessage(to, text) {
    if (config.dryRun) {
        outbox.push({ to, text, at: Date.now() });
        if (outbox.length > 200) outbox.shift();
        console.log(`[dry-run] -> ${to}: ${text.split('\n')[0]}`);
        return { dryRun: true };
    }
    const params = new URLSearchParams({
        method: 'SendMessage',
        msg_type: 'TEXT',
        send_to: to,
        userid: config.gupshup.accountId,
        password: config.gupshup.password,
        auth_scheme: 'plain',
        v: '1.1',
        format: 'text',
        msg: text,
    });
    const res = await fetch(config.gupshup.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
        signal: AbortSignal.timeout(10000),
    });
    const body = await res.text();
    // The gateway answers 200 with "error | <code> | <reason>" on failure.
    if (!res.ok || /^error/i.test(body.trim())) throw new Error(`Gupshup send failed: ${body.slice(0, 120)}`);
    return { body };
}

module.exports = { sendMessage, outbox };
