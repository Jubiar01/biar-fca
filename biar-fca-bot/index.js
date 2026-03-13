"use strict";

const fs = require('fs');
const path = require('path');
// const { login } = require('../');
const { login} = require('biar-fca')

// 1. Load your appstate
const APPSTATE_PATH = path.join(__dirname, 'appstate.json');

if (!fs.existsSync(APPSTATE_PATH)) {
    console.error('❌ Missing appstate.json. Please generate one and put it in the biar-fca-bot folder.');
    process.exit(1);
}

const appState = JSON.parse(fs.readFileSync(APPSTATE_PATH, 'utf8'));

// 2. Setup commands
const commands = new Map();
const commandsDir = path.join(__dirname, 'commands');

fs.readdirSync(commandsDir).forEach(file => {
    if (file.endsWith('.js')) {
        const command = require(path.join(commandsDir, file));
        if (command.name && typeof command.execute === 'function') {
            commands.set(command.name, command);
            console.log(`✅ Loaded command: ${command.name}`);
        }
    }
});

// 3. Login options
const options = {
    forceLogin: true,
    listenEvents: true,
    logLevel: "silent",
    selfListen: false,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
};

// 4. Start the bot
login({ appState }, options, (err, api) => {
    if (err) {
        console.error('❌ Login failed:', err);
        return;
    }

    console.log('🚀 Bot is online and listening for messages!');
    
    // Enable online presence (optional)
    if (api.startOnlinePresence) {
        api.startOnlinePresence();
        console.log('🟢 Online presence enabled.');
    }

    api.listenMqtt((err, event) => {
        if (err) return console.error('MQTT error:', err);

        if (event.type === 'message' || event.type === 'message_reply') {
            const body = event.body.trim();
            if (!body.startsWith('!')) return; // Prefix is '!'

            const args = body.slice(1).split(/\s+/);
            const commandName = args.shift().toLowerCase();

            if (commands.has(commandName)) {
                try {
                    commands.get(commandName).execute(api, event, args);
                } catch (cmdErr) {
                    console.error(`Error executing !${commandName}:`, cmdErr);
                }
            }
        }
    });
});
