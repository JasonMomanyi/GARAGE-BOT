const { getAvailableCars } = require('../database');

module.exports = {
    name: 'cars',
    description: 'Browse all available vehicles in the garage.',
    async execute(sock, remoteJid, args, textLower, msg) {
        const cars = await getAvailableCars();
        if (cars.length === 0) {
            await sock.sendMessage(remoteJid, { text: "No cars currently available." });
            return;
        }
        let carList = "🚗 *AVAILABLE VEHICLES IN ABC GARAGE* 🚗\n\n";
        cars.forEach(car => {
            carList += `🔹 *${car.brand} ${car.model}* (${car.year})\n💰 Price: ${car.price}\n\n`;
        });
        carList += "Reply with `.search <brand>` to find specific cars!";
        await sock.sendMessage(remoteJid, { text: carList });
    }
};
