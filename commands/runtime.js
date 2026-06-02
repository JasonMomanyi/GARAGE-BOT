const { runtime } = require('../gift');

module.exports = {
    name: 'runtime',
    description: 'Displays the total system uptime.',
    async execute(sock, remoteJid, args, textLower, msg) {
        const timeStr = runtime(process.uptime());
        const runtimeMsg = `⏱️ *System Uptime:*\n${timeStr}`;
        await sock.sendMessage(remoteJid, { text: runtimeMsg });
    }
};
