const test = require('node:test');
const assert = require('node:assert');
process.env.DRY_RUN = '1';
const flow = require('../src/bot/flow');
const { createStore } = require('../src/services/sessions');
const webhook = require('../src/controllers/webhook');
const { outbox } = require('../src/services/gupshup');
const { memory } = require('../src/services/database');

const run = (texts, phone = '919800000000') => {
    let session = null, out;
    for (const t of texts) { out = flow.step(session, t, phone, { rand: () => 0.5, now: new Date(0) }); session = out.session; }
    return out;
};

test('ignores chatter until the trigger word', () => {
    assert.deepStrictEqual(flow.step(null, 'hello', '91x'), { session: null, replies: [] });
});

test('trigger is case-insensitive and restarts mid-flow', () => {
    const out = run(['HELP', 'ev-1', ' Help ']);
    assert.strictEqual(out.session.step, 'AWAITING_CHASSIS');
    assert.deepStrictEqual(out.session.data, { riderMobile: '919800000000' });
});

test('full conversation yields a complete ticket', () => {
    const { session, ticket } = run(['help', 'ev-chassis-123', '1', 'Range dropping', 'Varanasi', 'Lanka Gate']);
    assert.strictEqual(session, null);
    assert.deepStrictEqual(ticket, {
        riderMobile: '919800000000', chassis: 'EV-CHASSIS-123', issueCategory: 'Battery',
        issueNote: 'Range dropping', region: 'Varanasi', location: 'Lanka Gate',
        callingMobileNo: '919800000000', ticketId: 'TKT-5500', ticketDate: '1970-01-01T00:00:00.000Z',
    });
    const msg = flow.confirmation(ticket);
    for (const s of ['TKT-5500', 'EV-CHASSIS-123', 'Battery', 'Varanasi']) assert.ok(msg.includes(s));
    assert.match(msg, /[ऀ-ॿ]/, 'confirmation keeps the Hindi lines');
});

test('category accepts number or name, falls back to Other', () => {
    assert.strictEqual(flow.parseCategory('2'), 'Motor');
    assert.strictEqual(flow.parseCategory(' tires '), 'Tires');
    assert.strictEqual(flow.parseCategory('it is making a noise'), 'Other');
});

test('free text keeps its case', () => {
    const { ticket } = run(['help', 'x', '4', 'Brake Lever Loose', 'Delhi', 'CP Block B']);
    assert.strictEqual(ticket.issueNote, 'Brake Lever Loose');
});

test('sessions expire after the TTL', () => {
    let t = 0;
    const s = createStore(1000, () => t);
    s.set('a', { step: 'X' });
    t = 999; assert.ok(s.get('a'));
    t = 2000; assert.strictEqual(s.get('a'), null);
    assert.strictEqual(s.size, 0);
});

test('parses both Gupshup payload shapes, skips receipts', () => {
    assert.deepStrictEqual(webhook.parseInbound({ mobile: '9198', text: 'help' }), { phone: '9198', text: 'help' });
    assert.deepStrictEqual(webhook.parseInbound({ type: 'message', payload: { source: '9198', payload: { text: 'help' } } }), { phone: '9198', text: 'help' });
    assert.strictEqual(webhook.parseInbound({ type: 'message-event', payload: { type: 'delivered' } }), null);
});

test('end to end in dry-run: 5 prompts, 1 ticket, 1 confirmation', async () => {
    outbox.length = 0; memory.length = 0;
    for (const t of ['help', 'ev-9', 'battery', 'dead', 'Varanasi', 'Assi Ghat']) await webhook.process('919811111111', t);
    assert.strictEqual(memory.length, 1);
    assert.strictEqual(outbox.length, 6);
    assert.ok(outbox[5].text.includes(memory[0].ticketId));
    assert.strictEqual(webhook.sessions.get('919811111111'), null);
});
