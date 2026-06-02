const express = require('express');
const { default: makeWASocket, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const { useMongoDBAuthState } = require('./mongoAuth');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const qrcode = require('qrcode');
const { connectDB, getMongoClient } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

let globalStatus = 'disconnected';
let currentQrData = null;
let currentSocket = null;
let reconnectAttempts = 0;

async function startBaileys() {
    await connectDB();
    const collection = getMongoClient().db('garage_bot').collection('auth_info_baileys');
    const { state, saveCreds } = await useMongoDBAuthState(collection);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.macOS('Desktop'),
        syncFullHistory: false
    });

    currentSocket = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("New QR Code received!");
            // Convert QR string to Base64 image
            currentQrData = await qrcode.toDataURL(qr);
        }
        
        if (connection === 'close') {
            globalStatus = 'disconnected';
            currentQrData = null;
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed due to ', lastDisconnect.error?.message || lastDisconnect.error, ', reconnecting ', shouldReconnect);
            
            if (shouldReconnect && reconnectAttempts < 10) {
                reconnectAttempts++;
                console.log(`Reconnecting... Attempt ${reconnectAttempts}`);
                setTimeout(() => startBaileys(), 2000);
            } else if (!shouldReconnect) {
                console.log("Logged out! Please delete auth_info_baileys and try again.");
            }
        } else if (connection === 'open') {
            reconnectAttempts = 0;
            globalStatus = 'connected';
            currentQrData = null;
            console.log('✅ Opened connection and successfully synced with WhatsApp!');
        }
    });
}

// Start pairing session
app.post('/api/pair', async (req, res) => {
    // Cleanup old session from MongoDB
    await connectDB();
    await getMongoClient().db('garage_bot').collection('auth_info_baileys').deleteMany({});
    
    if (fs.existsSync('./auth_info_baileys')) {
        fs.rmSync('./auth_info_baileys', { recursive: true, force: true });
    }
    
    globalStatus = 'disconnected';
    currentQrData = null;
    reconnectAttempts = 0;

    console.log(`Starting QR Code session...`);
    await startBaileys();
    res.json({ success: true });
});

app.get('/api/status', (req, res) => {
    res.json({ 
        status: globalStatus,
        qr: currentQrData 
    });
});

app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`🌟 Pairing Server is running!`);
    console.log(`🔗 Go to: http://localhost:${PORT}`);
    console.log(`========================================`);
});
