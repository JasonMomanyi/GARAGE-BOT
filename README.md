# 🚗 ABC Garage WhatsApp Bot

A powerful, robust, and smart WhatsApp Auto-Reply Bot designed specifically for Kenyan garages. Built on Node.js using `@whiskeysockets/baileys` and powered by **Groq AI (Llama 3.1)** for lightning-fast, intelligent, and culturally localized customer interactions.

## 🌟 Features
- **Smart AI Fallback:** Intelligently answers complex customer inquiries using a free Groq AI backend.
- **Kenyan Localization:** Automatically detects customer names and replies with local Kenyan context, Swahili/Sheng greetings, and Ksh formatting.
- **Local SQLite Database:** Built-in vehicle catalog. Add, remove, and manage cars instantly.
- **Prefix Commands (`.`):**
  - `.menu` - View the interactive garage menu.
  - `.cars` - Browse all available vehicles in the database.
  - `.search <brand>` - Search inventory (e.g., `.search Toyota`).
  - `.ping` / `.runtime` - Check bot status.
  - `.group on` / `.group off` - Toggle responses in group chats.
- **Human Escalation:** Type `4` in the menu to pause the bot and wait for a human agent.

---

## 🚀 Local Installation Guide

### Prerequisites
1. [Node.js](https://nodejs.org/) installed on your computer.
2. A free [Groq API Key](https://console.groq.com/keys) (No credit card required).

### 1. Setup the Project
1. Clone or download this repository.
2. Open your terminal inside the `GARAGE-BOT` folder.
3. Install dependencies:
   ```bash
   npm install
   ```

### 2. Configure Environment Variables
1. Open the `.env` file in the root folder.
2. Add your Groq API Key at the bottom:
   ```text
   GROQ_API_KEY=gsk_your_api_key_here
   ```

### 3. Pair Your WhatsApp Device

1. Start the pairing server:
   ```bash
   node pairing_server.js
   ```
2. Open your web browser and navigate to: `http://localhost:3000`
3. Click **Generate QR Code**.
4. Open WhatsApp on your phone -> Tap **Linked Devices** -> **Link a Device** -> Scan the QR Code on your screen.
5. Once your terminal says `✅ Bot successfully connected`, press `Ctrl+C` in your terminal to stop the pairing server.

### 4. Run the Bot
1. Start the actual auto-reply bot:
   ```bash
   node bot.js
   ```
2. Your bot is now active! Send a message like "Sasa, I need a car" from another phone to test it.

---

## ☁️ Free Cloud Deployment Guides

To keep your bot running 24/7 without leaving your PC on, you can deploy it to the cloud for free.

### Option 1: Render.com (Easiest & Free)
Render provides a free web service tier. *Note: Render's free tier sleeps after 15 mins of inactivity. Use a free pinging service like UptimeRobot to keep it awake!*

1. Upload this entire `GARAGE-BOT` folder to a new **GitHub Repository**.
   - *Crucial: Ensure `.env` and `auth_info_baileys/` are inside your `.gitignore` so your private keys are not public!*
2. Go to [Render.com](https://render.com) and create an account.
3. Click **New +** -> **Web Service**.
4. Connect your GitHub account and select your repo.
5. Configure the service:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node bot.js`
6. **Environment Variables:** Scroll down to the Environment section and add your `GROQ_API_KEY` and `MONGODB_URI` manually so the cloud server can access them.
7. Click **Deploy**.

> **🌟 100% Automated Cloud Persistence:**
> This bot uses **MongoDB Atlas** for its vehicle database and WhatsApp session state! This means that even when Render's free tier sleeps and wipes the ephemeral disk, your bot's memory is perfectly safe in the cloud. It will automatically reconnect the moment it wakes up without needing to rescan the QR code or push backup files!
