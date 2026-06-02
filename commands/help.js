module.exports = {
    name: 'help',
    description: 'Dynamically lists all available commands in the bot.',
    async execute(sock, remoteJid, args, textLower, msg, commandsMap) {
        let helpText = "🛠️ *ABC GARAGE COMMAND LIST* 🛠️\n\n";
        
        commandsMap.forEach((commandPlugin, commandName) => {
            if (commandName !== 'template') { // Hide template
                helpText += `🔹 *.${commandName}*\n   _${commandPlugin.description}_\n\n`;
            }
        });
        
        helpText += "Want to add more? Just drop a new `.js` file into the `commands/` folder!";
        await sock.sendMessage(remoteJid, { text: helpText });
    }
};
