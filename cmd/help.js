module.exports = {
    config: {
        name: "help",
        description: "Show all available commands",
        usage: "help [command]",
        author: "Your Name"
    },
    
    run: function({ api, message, args, threadID }) {
        const fs = require("fs");
        const path = require("path");
        
        const cmdPath = path.join(__dirname);
        const commandFiles = fs.readdirSync(cmdPath).filter(file => file.endsWith(".js"));
        
        let helpMessage = "📋 Available Commands:\n\n";
        
        commandFiles.forEach(file => {
            try {
                const command = require(path.join(cmdPath, file));
                if (command.config && command.config.name) {
                    helpMessage += `• ${command.config.name} - ${command.config.description}\n`;
                }
            } catch (error) {
                // Skip invalid command files
            }
        });
        
        helpMessage += "\n💡 Use the command name to execute it!";
        
        api.sendMessage(helpMessage, threadID, message.messageID);
    }
};

