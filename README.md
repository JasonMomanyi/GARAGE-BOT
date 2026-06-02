# 🚗 ABC Garage WhatsApp Bot

A powerful, robust, and smart WhatsApp Auto-Reply Bot designed specifically for Kenyan garages. Built on Node.js using `@whiskeysockets/baileys` and powered by **Groq AI (Llama 3.1)** for lightning-fast, intelligent, and culturally localized customer interactions.

## 🌟 Features
- **Smart AI Fallback:** Intelligently answers complex customer inquiries using a free Groq AI backend.
- **Kenyan Localization:** Automatically detects customer names and replies with local Kenyan context, Swahili/Sheng greetings, and Ksh formatting.
- **100% Cloud Persistence:** Built entirely on **MongoDB Atlas** for both the vehicle database and WhatsApp Authentication state. Your bot will never lose its memory!
- **Auto-Healing QR Pairing:** If you unpair your phone, the bot automatically purges its database and serves a fresh QR code on a beautiful webpage.
- **Prefix Commands (`.`):**
  - `.menu` - View the interactive garage menu.
  - `.cars` - Browse all available vehicles in the database.
  - `.search <brand>` - Search inventory (e.g., `.search Toyota`).
  - `.ping` / `.runtime` - Check bot status.
  - `.group on` / `.group off` - Toggle responses in group chats.
- **Master Account Access:** Send commands starting with `.` directly from the host phone without triggering infinite AI loops!
- **Human Escalation:** Type `4` in the menu to pause the bot and wait for a human agent.

---

## ☁️ Zero-Downtime Deployment Guide (Render + MongoDB)

This bot is designed to be hosted 100% in the cloud for free using Render.com and MongoDB Atlas. Because it uses MongoDB for storage, Render's "ephemeral disk" wipes will **never** reset your bot!

### Step 1: Prepare your Cloud Databases
1. Go to **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)** and create a free cluster.
2. In the sidebar, go to **Network Access**, click "Add IP Address", and choose **ALLOW ACCESS FROM ANYWHERE** (`0.0.0.0/0`). *(CRITICAL for Render to connect!)*
3. Go to **Database**, click **Connect**, choose "Drivers", and copy your `MongoDB URI` string (replace `<password>` with your actual password).
4. Get a free Groq API key from **[Groq Console](https://console.groq.com/keys)**.

### Step 2: Push Code to GitHub
1. Upload this entire `GARAGE-BOT` folder to a new, empty **GitHub Repository**.
2. *Crucial: Ensure `.env` is inside your `.gitignore` before pushing!*

### Step 3: Deploy on Render
1. Go to **[Render.com](https://render.com)** and create a new **Web Service**.
2. Connect your GitHub account and select your `GARAGE-BOT` repo.
3. Keep the defaults:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node bot.js`
4. **Environment Variables:** Scroll down and add:
   - `GROQ_API_KEY` : `your_groq_key`
   - `MONGODB_URI` : `your_mongodb_connection_string`
5. Click **Deploy**.

### Step 4: Scan the QR Code via the Web!
This bot has a built-in web portal specifically for pairing! You do not need to check terminal logs.
1. Once Render says "Your service is live 🎉", look at the top left of the Render dashboard and click your **primary URL** (e.g., `https://garage-bot-xyz.onrender.com`).
2. A beautiful webpage will load showing a large WhatsApp QR Code.
3. Open WhatsApp on your phone -> Tap **Linked Devices** -> **Link a Device** -> Scan the QR Code on your screen.
4. The webpage will automatically refresh in 5 seconds and display: *"🚗 ABC Garage Bot is running smoothly and connected to WhatsApp!"*

> **⚠️ Note on Unpairing:** If you ever want to change phones or restart the connection, simply go to your phone, tap the Linked Device, and hit **Log Out**. The bot will detect the logout, instantly purge its old database session, and immediately generate a fresh QR code on your Render URL so you can scan a new device!

### Step 5: Prevent Render from Sleeping (Important!)
Render's Free Tier will put your bot to sleep if nobody visits the web URL for 15 minutes. This causes your bot to suddenly become inactive and ignore commands.
**To fix this forever:**
1. Go to **[cron-job.org](https://cron-job.org)** or **[UptimeRobot](https://uptimerobot.com)** and create a free account.
2. Create a new "HTTP(s)" Monitor/Job.
3. Enter your Render URL (`https://garage-bot-xyz.onrender.com`).
4. Set it to ping every **10 minutes**.
*(This completely bypasses the 15-minute sleep timer and keeps your WhatsApp bot awake 24/7!)*
