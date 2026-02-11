const http = require('http');

// Helper to send a request
const sendWebhook = (text, source = "919876543210") => {
    return new Promise((resolve) => {
        const payload = JSON.stringify({
            "type": "message",
            "payload": {
                "id": "MSG-" + Date.now(),
                "source": source,
                "type": "text",
                "payload": {
                    "text": text
                },
                "sender": {
                    "phone": source,
                    "name": "Rider",
                    "country_code": "91"
                }
            }
        });

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/webhook',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': payload.length
            }
        };

        console.log(`\n\n[CLIENT] Sending: "${text}"`);

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`[SERVER] Status: ${res.statusCode} | Body: ${data}`);
                resolve();
            });
        });

        req.on('error', (e) => console.error(`[CLIENT] Error: ${e.message}`));
        req.write(payload);
        req.end();
    });
};

const runSimulation = async () => {
    console.log("=== Starting Conversation Simulation ===");

    // 1. Trigger Help
    await sendWebhook("help");
    await new Promise(r => setTimeout(r, 1000)); // Wait for async processing

    // 2. Send Chassis
    await sendWebhook("EV-CHASSIS-12345");
    await new Promise(r => setTimeout(r, 1000));

    // 3. Select Category
    await sendWebhook("Battery");
    await new Promise(r => setTimeout(r, 1000));

    // 4. Send Note
    await sendWebhook("Range dropping quickly");
    await new Promise(r => setTimeout(r, 1000));

    // 5. Send Region
    await sendWebhook("Delhi");
    await new Promise(r => setTimeout(r, 1000));

    // 6. Send Location (Final Step)
    await sendWebhook("Connaught Place, Block B");

    console.log("\n=== Simulation Complete ===");
};

runSimulation();
