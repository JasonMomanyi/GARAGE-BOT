const { searchCars } = require('../database');

module.exports = {
    name: 'search',
    description: 'Search inventory for a specific brand. Usage: .search Toyota',
    async execute(sock, remoteJid, args, textLower, msg) {
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
    }
};
