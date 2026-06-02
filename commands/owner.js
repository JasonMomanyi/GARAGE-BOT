module.exports = {
    name: 'owner',
    description: 'Displays information about the bot owner.',
    async execute(sock, remoteJid, args, textLower, msg) {
        const vcard = 'BEGIN:VCARD\n' 
            + 'VERSION:3.0\n' 
            + 'FN:Jason Momanyi (Garage Admin)\n'
            + 'ORG:ABC Garage;\n' 
            + 'TEL;type=CELL;type=VOICE;waid=254700000000:+254 700 000 000\n'
            + 'END:VCARD';

        await sock.sendMessage(remoteJid, { 
            contacts: { 
                displayName: 'Jason Momanyi', 
                contacts: [{ vcard }] 
            }
        });
    }
};
