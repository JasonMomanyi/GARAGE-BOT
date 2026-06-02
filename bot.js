const { default: makeWASocket, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const { useMongoDBAuthState } = require('./mongoAuth');
const express = require('express');
const pino = require('pino');
const axios = require('axios');
const qrcode = require('qrcode');
const { runtime, gmdFancy } = require('./gift');
const { connectDB, getSetting, setSetting, getAvailableCars, searchCars, getMongoClient } = require('./database'); // Import DB
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Store user states for the simple menu
const userStates = {};
const PREFIX = '.';

async function generateAIResponse(text, userName) {
    if (!GROQ_API_KEY || GROQ_API_KEY.includes('your_groq_api_key')) {
        return "I'm currently unable to process complex requests because my AI module isn't fully configured yet!";
    }
    
    try {
        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.1-8b-instant", // Updated to current free fast model
                messages: [
                    { role: "system", content: `You are the ABC Garage assistant based in Nairobi, Kenya. Keep your answers short, professional, and friendly. Address the customer by their name (${userName}). Use Kenyan formatting: currency is KES (Ksh), and casually mix in a little Swahili/Sheng (like 'Sasa', 'Karibu', 'Asante') where appropriate.` },
                    { role: "user", content: text }
                ],
                max_tokens: 300
            },
            {
                headers: {
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("Groq AI Error:", error.response?.data || error.message);
        return "Sorry, my AI system is experiencing a temporary glitch.";
    }
}

let currentQR = null;

// Create a web server to serve the QR code and keep Render.com Web Service happy
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
    if (currentQR) {
        res.send(`
            <html style="background-color: #f0f2f5; font-family: sans-serif;">
                <body style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0;">
                    <div style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center;">
                        <h2>🔗 Link WhatsApp to ABC Garage</h2>
                        <p>Scan this QR code using the <b>Linked Devices</b> option in WhatsApp.</p>
                        <img src="${currentQR}" style="border: 2px solid #ddd; border-radius: 10px; padding: 10px; width: 250px; height: 250px;" />
                        <p style="color: #666; font-size: 14px; margin-top: 20px;">This page will refresh automatically...</p>
                        <script>setTimeout(() => window.location.reload(), 5000);</script>
                    </div>
                </body>
            </html>
        `);
    } else {
        res.send('🚗 ABC Garage Bot is running smoothly and connected to WhatsApp!');
    }
});
app.listen(PORT, () => console.log(`🌍 Web server listening on port ${PORT}. Go to the Render URL to view the QR code!`));

async function startBot() {
    await connectDB(); // Initialize MongoDB first
    
    // Use MongoDB for Baileys auth state
    const collection = getMongoClient().db('garage_bot').collection('auth_info_baileys');
    const { state, saveCreds } = await useMongoDBAuthState(collection);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    
    console.log(`Starting ABC Garage Bot using WA v${version.join('.')}, isLatest: ${isLatest}`);
    
    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        browser: Browsers.macOS('Desktop')
    });
    
    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('\n======================================================');
            console.log('📸 NEW QR GENERATED! CLICK YOUR RENDER URL TO SCAN IT:');
            console.log(`🌐 https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'your-render-url.onrender.com'}`);
            console.log('======================================================\n');
            currentQR = await qrcode.toDataURL(qr);
        }

        if (connection === 'close') {
            currentQR = null;
            const statusCode = (lastDisconnect.error)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            
            if (shouldReconnect) {
                startBot();
            } else {
                console.log('⚠️ Session was logged out from WhatsApp (Unpaired). Purging old credentials to generate a new QR...');
                try {
                    await getMongoClient().db('garage_bot').collection('auth_info_baileys').drop();
                } catch(e) {
                    console.log('No existing session to drop.');
                }
                // Restart to generate fresh QR
                startBot();
            }
        } else if (connection === 'open') {
            currentQR = null;
            console.log('✅ Bot successfully connected to WhatsApp!');
        }
    });
    
    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message) return;
        
        // Extract text depending on message type
        let text = msg.message.conversation || 
                   msg.message.extendedTextMessage?.text || 
                   "";
        
        const textLower = text.trim().toLowerCase();
        if (!textLower) return;

        // Ignore messages sent by you (the master), UNLESS it is a command starting with '.'
        if (msg.key.fromMe && !textLower.startsWith(PREFIX)) return;

        const remoteJid = msg.key.remoteJid;
        const isGroup = remoteJid.endsWith('@g.us');

        // Group Settings Logic
        const groupResponses = await getSetting('group_responses');
        if (isGroup && groupResponses === 'off' && !textLower.startsWith('.group')) {
            return; // Ignore all messages in groups if disabled, EXCEPT the toggle command
        }

        console.log(`Received message from ${remoteJid}: ${text}`);

        // ----------------------------------------------------
        // 1. PREFIX COMMAND ROUTER
        // ----------------------------------------------------
        if (textLower.startsWith(PREFIX)) {
            const args = text.slice(PREFIX.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();

            switch (command) {
                case 'ping':
                    await sock.sendMessage(remoteJid, { text: "Pong! Bot is active and responding rapidly. 🚀" });
                    return;

                case 'runtime':
                    // Pass current process uptime to runtime function from gift
                    const timeStr = runtime(process.uptime());
                    const runtimeMsg = `⏱️ *System Uptime:*\n${timeStr}`;
                    await sock.sendMessage(remoteJid, { text: runtimeMsg });
                    return;

                case 'fancy':
                    if (!args.length) {
                        await sock.sendMessage(remoteJid, { text: "Please provide text to stylize. Example: `.fancy Hello World`" });
                        return;
                    }
                    await sock.sendMessage(remoteJid, { text: args.join(" ") }); // gmdFancy removed due to incompatibility
                    return;

                case 'group':
                    const toggle = args[0]?.toLowerCase();
                    if (toggle === 'on') {
                        await setSetting('group_responses', 'on');
                        await sock.sendMessage(remoteJid, { text: "✅ Group responses have been ENABLED." });
                    } else if (toggle === 'off') {
                        await setSetting('group_responses', 'off');
                        await sock.sendMessage(remoteJid, { text: "🚫 Group responses have been DISABLED." });
                    } else {
                        await sock.sendMessage(remoteJid, { text: "Usage: `.group on` or `.group off`" });
                    }
                    return;

                case 'cars':
                    const cars = await getAvailableCars();
                    if (cars.length === 0) {
                        await sock.sendMessage(remoteJid, { text: "No cars currently available." });
                        return;
                    }
                    let carList = "🚗 *AVAILABLE VEHICLES IN ABC GARAGE* 🚗\n\n";
                    cars.forEach(car => {
                        carList += `🔹 *${car.brand} ${car.model}* (${car.year})\n💰 Price: ${car.price}\n\n`;
                    });
                    carList += "Reply with `.search <brand>` to find specific cars!";
                    await sock.sendMessage(remoteJid, { text: carList });
                    return;

                case 'search':
                    if (!args.length) {
                        await sock.sendMessage(remoteJid, { text: "Please provide a brand to search. Example: `.search Toyota`" });
                        return;
                    }
                    const query = args.join(" ");
                    const results = await searchCars(query);
                    
                    if (results.length === 0) {
                        await sock.sendMessage(remoteJid, { text: `No vehicles found matching "${query}".` });
                        return;
                    }
                    
                    let searchRes = `🔍 *Search Results for "${query}"*\n\n`;
                    results.forEach(car => {
                        searchRes += `🔹 *${car.brand} ${car.model}* (${car.year}) - [${car.status}]\n💰 Price: ${car.price}\n\n`;
                    });
                    await sock.sendMessage(remoteJid, { text: searchRes });
                    return;

                case 'menu':
                case 'help':
                    const menu = `🚗 *Welcome to ABC Garage!* 🛠️\n\n` +
                                 `*Commands:*\n` +
                                 `🔹 .cars (View available vehicles)\n` +
                                 `🔹 .search <brand> (Search inventory)\n` +
                                 `🔹 .ping\n` +
                                 `🔹 .runtime\n` +
                                 `🔹 .group on/off (Admin toggle)\n` +
                                 `🔹 .menu\n\n` +
                                 `*Quick Options:*\n` +
                                 `1️⃣ Book Service\n` +
                                 `2️⃣ Service Pricing\n` +
                                 `3️⃣ Vehicle Status\n` +
                                 `4️⃣ Speak to an Agent\n\n` +
                                 `_(Or just tell me what you need using natural language!)_`;
                    
                    await sock.sendMessage(remoteJid, { text: menu });
                    return;

                default:
                    await sock.sendMessage(remoteJid, { text: `❌ Unknown command: ${PREFIX}${command}` });
                    return;
            }
        }
        
        // ----------------------------------------------------
        // 2. SIMPLE STATE MACHINE (For Menu Options)
        // ----------------------------------------------------
        if (!userStates[remoteJid]) {
            userStates[remoteJid] = { step: 'menu' };
        }
        const state = userStates[remoteJid];
        
        if (state.step === 'escalated') {
            return; // Ignored, waiting for human
        }

        if (['menu', 'hi', 'hello'].includes(textLower)) {
            state.step = 'menu';
            const menu = `🚗 *Welcome to ABC Garage!* 🛠️\n\n` +
                         `*Commands:*\n` +
                         `🔹 .cars (View available vehicles)\n` +
                         `🔹 .search <brand> (Search inventory)\n\n` +
                         `*Quick Options:*\n` +
                         `1️⃣ Book Service\n` +
                         `2️⃣ Service Pricing\n` +
                         `3️⃣ Vehicle Status\n` +
                         `4️⃣ Speak to an Agent\n\n` +
                         `_(Or just tell me what you need using natural language!)_`;
            await sock.sendMessage(remoteJid, { text: menu });
            return;
        }

        if (textLower === '4') {
            state.step = 'escalated';
            await sock.sendMessage(remoteJid, { text: "Connecting you to an agent... Please wait. 🕒" });
            return;
        }

        // ----------------------------------------------------
        // 3. AI FALLBACK
        // ----------------------------------------------------
        await sock.readMessages([msg.key]);
        const userName = msg.pushName || "Customer";
        const aiReply = await generateAIResponse(text, userName);
        await sock.sendMessage(remoteJid, { text: aiReply });
    });
}

// Start the bot
startBot();
