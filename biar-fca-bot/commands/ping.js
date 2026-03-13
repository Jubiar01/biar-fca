module.exports = {
    name: 'ping',
    execute: (api, event, args) => {
        api.sendMessage('Pong! 🏓', event.threadID, event.messageID);
    }
};
