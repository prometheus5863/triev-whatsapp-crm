// All secrets come from the environment. Nothing is hard-coded.
// With no Gupshup credentials the bot runs in DRY_RUN: it logs what it
// would send and keeps tickets in memory, so the flow can be demoed safely.
require('dotenv').config();

const env = process.env;
const config = {
    port: Number(env.PORT) || 3000,
    gupshup: {
        apiUrl: env.GUPSHUP_API_URL || 'https://mediaapi.smsgupshup.com/GatewayAPI/rest',
        accountId: env.GUPSHUP_ACCOUNT_ID || '',
        password: env.GUPSHUP_PASSWORD || '',
    },
    sheetWebhookUrl: env.SHEET_WEBHOOK_URL || '',
    webhookSecret: env.WEBHOOK_SECRET || '',
    sessionTtlMs: (Number(env.SESSION_TTL_MINUTES) || 30) * 60 * 1000,
};
config.dryRun = env.DRY_RUN === '1' || !config.gupshup.accountId || !config.gupshup.password;

module.exports = config;
