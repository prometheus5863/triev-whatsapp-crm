exports.verifyWebhook = (req, res) => {
    // Standard URL verification 
    const challenge = req.query['hub.challenge'];
    if (challenge) {
        return res.status(200).send(challenge);
    }
    res.status(200).send('Webhook is live and ready.');
};

exports.receiveMessage = async (req, res) => {
    const incomingData = req.body;
    
    // Always return a 200 OK immediately so Gupshup doesn't retry the message
    res.status(200).send('Event received');

    try {
        // Parse the incoming WhatsApp message
        if (incomingData.type === 'message') {
            const text = incomingData.payload.text.toLowerCase();
            const senderPhone = incomingData.payload.source;

            // --- CRM Routing Logic ---
            if (text.includes('referral')) {
                // TODO: Trigger WhatsApp-based referral campaign logic here
                console.log(`Processing referral lead from ${senderPhone}`);
                
            } else if (text.includes('rent')) {
                // TODO: Trigger rent calculation formula using OEM and vehicle age
                console.log(`Calculating fleet rent for ${senderPhone}`);
                
            } else {
                // Standard new lead capture
                console.log(`New generic lead captured: ${senderPhone}`);
            }
        }
    } catch (error) {
        console.error('Error processing Gupshup webhook:', error);
    }
};
