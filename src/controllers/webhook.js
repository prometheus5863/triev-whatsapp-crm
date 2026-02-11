const { saveTicketToSheet } = require('../services/database');

// Hardcoded config based on your TriEV Gateway setup
const CONFIG = {
    GUPSHUP_API_URL: 'https://mediaapi.smsgupshup.com/GatewayAPI/rest',
    ACCOUNT_ID: process.env.GUPSHUP_ACCOUNT_ID || '2000254352',
    PASSWORD: process.env.GUPSHUP_PASSWORD || 'cV8@SMe2',
    SOURCE_NUMBER: process.env.SOURCE_NUMBER || '919958565691',
};

// In-memory session storage
// Key: Sender Phone Number -> Value: { step: 'AWAITING_CHASSIS', data: { ... } }
const userSessions = {};

/**
 * Helper to send messages via Gupshup Enterprise Gateway API
 */
const sendGupshupMessage = async (destinationPhone, messageText) => {
    const params = new URLSearchParams({
        msg_type: 'TEXT',
        send_to: destinationPhone,
        userid: CONFIG.ACCOUNT_ID,
        password: CONFIG.PASSWORD,
        auth_scheme: 'plain',
        v: '1.1',
        format: 'text',
        msg: messageText
    });

    try {
        const response = await fetch(CONFIG.GUPSHUP_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });

        const result = await response.text();
        console.log(`Outbound message to ${destinationPhone}:`, result);
    } catch (error) {
        console.error('Error sending message to Gupshup:', error);
    }
};

const handleWebhook = async (req, res) => {
    // 1. Immediately acknowledge receipt so Gupshup doesn't retry
    res.status(200).send('success');

    try {
        const data = req.body;

        // 2. Safely extract sender phone and text based on Gateway webhook format
        const senderPhone = data.mobile || data.sender || (data.payload && data.payload.source);
        let inboundText = data.text || (data.payload && data.payload.payload && data.payload.payload.text);

        // If it's a delivery receipt or non-text message, ignore it
        if (!senderPhone || !inboundText) return;

        inboundText = inboundText.trim().toLowerCase();
        console.log(`Received from ${senderPhone}: ${inboundText}`);

        // --- 1. CHECK FOR "HELP" TRIGGER ---
        if (inboundText === 'help') {
            userSessions[senderPhone] = {
                step: 'AWAITING_CHASSIS',
                data: { riderMobile: senderPhone }
            };

            await sendGupshupMessage(senderPhone, "Welcome to TriEV RSA Support ⚡\n\nPlease reply with your vehicle's Chassis Number to begin:");
            return;
        }

        // --- 2. CHECK IF SESSION EXISTS ---
        const session = userSessions[senderPhone];
        if (!session) return; // Ignore messages if they haven't typed "help"

        // --- 3. STATE MACHINE HANDLER ---
        switch (session.step) {
            case 'AWAITING_CHASSIS':
                session.data.chassis = inboundText;
                session.step = 'AWAITING_CATEGORY';

                // Send a numbered text menu instead of a JSON list for Gateway compatibility
                const menuMsg = "Select Issue Category by replying with a number:\n\n1. Battery\n2. Motor\n3. Tires\n4. Other";
                await sendGupshupMessage(senderPhone, menuMsg);
                break;

            case 'AWAITING_CATEGORY':
                const categories = { '1': 'Battery', '2': 'Motor', '3': 'Tires', '4': 'Other' };
                // Map the number to the string, default to 'Other' if they type something else
                session.data.issueCategory = categories[inboundText] || 'Other';
                session.step = 'AWAITING_NOTE';

                await sendGupshupMessage(senderPhone, "Please describe the issue in a few words (Issue Note):");
                break;

            case 'AWAITING_NOTE':
                session.data.issueNote = inboundText;
                session.step = 'AWAITING_REGION';

                await sendGupshupMessage(senderPhone, "Which Region are you in? (e.g., Varanasi, Delhi):");
                break;

            case 'AWAITING_REGION':
                session.data.region = inboundText;
                session.step = 'AWAITING_LOCATION';

                await sendGupshupMessage(senderPhone, "Please share your exact Location (Landmark/Address):");
                break;

            case 'AWAITING_LOCATION':
                session.data.location = inboundText;

                // Generate Ticket Data
                const ticketId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
                session.data.ticketId = ticketId;
                const ticketDate = new Date().toLocaleString();
                session.data.callingMobileNo = senderPhone;

                // Save to Google Sheets Database
                try {
                    console.log("Saving to database...", session.data);
                    await saveTicketToSheet(session.data);
                } catch (err) {
                    console.error("Failed to save to sheet", err);
                    await sendGupshupMessage(senderPhone, "Error saving ticket. Please try again later.");
                    delete userSessions[senderPhone];
                    return;
                }

                // Send Full Bilingual Confirmation from your original script format
                const confirmMsg =
                    `Dear Rider,\n\n` +
                    `Thank you! Your RSA ticket is logged successfully ` +
                    `(धन्यवाद! आपका आरएसए टिकट सफलतापूर्वक दर्ज किया गया है). ✅\n\n` +
                    `🌍 *Region:* ${session.data.region}\n` +
                    `📞 *Calling No:* ${session.data.callingMobileNo}\n` +
                    `🛵 *Chassis:* ${session.data.chassis}\n` +
                    `🎫 *Ticket ID:* ${session.data.ticketId}\n` +
                    `🛠️ *Issue:* ${session.data.issueCategory}\n` +
                    `📝 *Note:* ${session.data.issueNote}\n\n` +
                    `Our technician will contact you shortly. ` +
                    `(हमारे तकनीशियन आपसे शीघ्र ही संपर्क करेंगे।)\n\n` +
                    `Thank you (धन्यवाद),\nTeam TriEV⚡ #JoinTheEVTribe`;

                await sendGupshupMessage(senderPhone, confirmMsg);

                // Clear Session so they can start over later
                delete userSessions[senderPhone];
                break;

            default:
                console.log("Unknown step:", session.step);
                break;
        }

    } catch (error) {
        console.error('Error in webhook handler:', error);
    }
};

module.exports = {
    handleWebhook,
    // Add verifyWebhook if your route file is looking for it
    verifyWebhook: (req, res) => res.status(200).send('Webhook is live')
};