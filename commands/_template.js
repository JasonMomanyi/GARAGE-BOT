/**
 * 🛠️ HOW TO CREATE A NEW COMMAND 🛠️
 * 
 * 1. Copy this file and rename it to your command name (e.g., `sticker.js`).
 * 2. The `name` property below MUST be the exact command trigger (without the dot).
 * 3. Write your custom logic inside the `execute` function.
 * 4. The bot will automatically detect this file and add it to the `.help` list! No restart required if using nodemon!
 */

module.exports = {
    name: 'template',
    description: 'A template file for developers to create new commands.',
    async execute(sock, remoteJid, args, textLower, msg) {
        // Your logic here!
        // Example:
        await sock.sendMessage(remoteJid, { text: "Hello! This is a custom command." });
    }
};
