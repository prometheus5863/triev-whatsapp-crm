require('dotenv').config();
const express = require('express');
const app = express();

// Middleware to parse incoming JSON from Gupshup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 TriEV CRM Prototype running on port ${PORT}`);
});
