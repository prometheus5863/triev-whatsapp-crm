// Pure conversation state machine: no network, no globals.
// step(session, text, phone) -> { session, replies, ticket }
// session === null means "no conversation in progress".

const TRIGGER = 'help';
const CATEGORIES = { '1': 'Battery', '2': 'Motor', '3': 'Tires', '4': 'Other' };

const MESSAGES = {
    welcome: "Welcome to TriEV RSA Support \u26a1\n\nPlease reply with your vehicle's Chassis Number to begin:",
    category: 'Select Issue Category by replying with a number:\n\n1. Battery\n2. Motor\n3. Tires\n4. Other',
    note: 'Please describe the issue in a few words (Issue Note):',
    region: 'Which Region are you in? (e.g., Varanasi, Delhi):',
    location: 'Please share your exact Location (Landmark/Address):',
    saveFailed: 'Error saving ticket. Please try again later.',
};

const newTicketId = (rand = Math.random) => `TKT-${Math.floor(1000 + rand() * 9000)}`;

// Riders type "battery" as often as "1", so accept both.
const parseCategory = (text) => {
    const t = text.trim().toLowerCase();
    if (CATEGORIES[t]) return CATEGORIES[t];
    const byName = Object.values(CATEGORIES).find((c) => c.toLowerCase() === t);
    return byName || 'Other';
};

const confirmation = (t) =>
        `Dear Rider,\n\n` +
        `Thank you! Your RSA ticket is logged successfully ` +
        `(धन्यवाद! आपका आरएसए टिकट सफलतापूर्वक दर्ज किया गया है). ✅\n\n` +
        `🌍 *Region:* ${t.region}\n` +
        `📞 *Calling No:* ${t.callingMobileNo}\n` +
        `🛵 *Chassis:* ${t.chassis}\n` +
        `🎫 *Ticket ID:* ${t.ticketId}\n` +
        `🛠️ *Issue:* ${t.issueCategory}\n` +
        `📝 *Note:* ${t.issueNote}\n\n` +
        `Our technician will contact you shortly. ` +
        `(हमारे तकनीशियन आपसे शीघ्र ही संपर्क करेंगे।)\n\n` +
        `Thank you (धन्यवाद),\nTeam TriEV⚡ #JoinTheEVTribe`;;

function step(session, rawText, phone, opts = {}) {
    const text = String(rawText || '').trim();
    if (!text) return { session, replies: [] };

    // "help" always (re)starts the flow, even mid-conversation.
    if (text.toLowerCase() === TRIGGER) {
        return {
            session: { step: 'AWAITING_CHASSIS', data: { riderMobile: phone } },
            replies: [MESSAGES.welcome],
        };
    }
    if (!session) return { session: null, replies: [] };

    const data = { ...session.data };
    switch (session.step) {
        case 'AWAITING_CHASSIS':
            data.chassis = text.toUpperCase();
            return { session: { step: 'AWAITING_CATEGORY', data }, replies: [MESSAGES.category] };
        case 'AWAITING_CATEGORY':
            data.issueCategory = parseCategory(text);
            return { session: { step: 'AWAITING_NOTE', data }, replies: [MESSAGES.note] };
        case 'AWAITING_NOTE':
            data.issueNote = text;
            return { session: { step: 'AWAITING_REGION', data }, replies: [MESSAGES.region] };
        case 'AWAITING_REGION':
            data.region = text;
            return { session: { step: 'AWAITING_LOCATION', data }, replies: [MESSAGES.location] };
        case 'AWAITING_LOCATION':
            data.location = text;
            data.callingMobileNo = phone;
            data.ticketId = newTicketId(opts.rand);
            data.ticketDate = (opts.now || new Date()).toISOString();
            // The caller saves the ticket, then sends confirmation(ticket).
            return { session: null, replies: [], ticket: data };
        default:
            return { session: null, replies: [] };
    }
}

module.exports = { step, confirmation, parseCategory, MESSAGES, CATEGORIES, TRIGGER };
