module.exports = {
    name: 'fancy',
    description: 'Stylize text. Usage: .fancy Hello World',
    async execute(sock, remoteJid, args, textLower, msg) {
        if (!args.length) {
            await sock.sendMessage(remoteJid, { text: "Please provide text to stylize. Example: `.fancy Hello World`" });
            return;
        }
        await sock.sendMessage(remoteJid, { text: args.join(" ") }); // Stylization logic can be expanded here
    }
};
