module.exports = {
    name: 'echo',
    execute: (api, event, args) => {
        const text = args.join(' ');
        if (!text) return api.sendMessage('Please provide some text!', event.threadID, event.messageID);
        api.sendMessage(`📣 You said: ${text}`, event.threadID, event.messageID);
    }
};
