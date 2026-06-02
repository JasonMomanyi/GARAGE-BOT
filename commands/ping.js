module.exports = {
    name: 'ping',
    description: 'Check if the bot is active and responding.',
    async execute(sock, remoteJid, args, textLower, msg) {
        await sock.sendMessage(remoteJid, { text: "Pong! Bot is active and responding rapidly. 🚀" });
    }
};
