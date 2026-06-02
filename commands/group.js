const { setSetting } = require('../database');

module.exports = {
    name: 'group',
    description: 'Toggle group responses on or off. Usage: .group on',
    async execute(sock, remoteJid, args, textLower, msg) {
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
    }
};
