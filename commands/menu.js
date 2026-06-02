module.exports = {
    name: 'menu',
    description: 'View the interactive garage menu.',
    async execute(sock, remoteJid, args, textLower, msg) {
        const menu = `🚗 *Welcome to ABC Garage!* 🛠️\n\n` +
                     `*Commands:*\n` +
                     `🔹 .cars (View available vehicles)\n` +
                     `🔹 .search <brand> (Search inventory)\n` +
                     `🔹 .ping\n` +
                     `🔹 .runtime\n` +
                     `🔹 .group on/off (Admin toggle)\n` +
                     `🔹 .menu\n` +
                     `🔹 .help (View all commands)\n\n` +
                     `*Quick Options:*\n` +
                     `1️⃣ Book Service\n` +
                     `2️⃣ Service Pricing\n` +
                     `3️⃣ Vehicle Status\n` +
                     `4️⃣ Speak to an Agent\n\n` +
                     `_(Or just tell me what you need using natural language!)_`;
        
        await sock.sendMessage(remoteJid, { text: menu });
    }
};
