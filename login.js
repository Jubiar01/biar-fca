const { login } = require("./module/index");
const fs = require("fs");
const path = require("path");

// Load commands from cmd folder
const commands = new Map();
const cmdPath = path.join(__dirname, "cmd");

function loadCommands() {
    if (!fs.existsSync(cmdPath)) {
        console.log("Creating cmd folder...");
        fs.mkdirSync(cmdPath);
    }
    
    const files = fs.readdirSync(cmdPath).filter(file => file.endsWith(".js"));
    
    for (const file of files) {
        try {
            const command = require(path.join(cmdPath, file));
            if (command.config && command.config.name) {
                commands.set(command.config.name, command);
                console.log(`✓ Loaded command: ${command.config.name}`);
            }
        } catch (error) {
            console.error(`Error loading ${file}:`, error.message);
        }
    }
    
    console.log(`Loaded ${commands.size} command(s)`);
}

// Main bot logic
function startBot(api) {
    console.log("Bot is ready!");
    console.log(`Logged in as: ${api.getCurrentUserID()}`);
    console.log("\n⚠️  IMPORTANT: If personal messages don't work:");
    console.log("1. The chat might be in 'Message Requests' - check Facebook");
    console.log("2. Send a message FROM the bot account TO Jubiar first to open the conversation");
    console.log("3. Check that threadID appears in logs when you send 'test'\n");
    
    api.listenMqtt((err, message) => {
        if (err) return console.error(err);
        
        // Only process text messages
        if (message.type !== "message" && message.type !== "message_reply") return;
        if (!message.body) return;
        
        const { body, threadID, senderID } = message;
        const args = body.trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        // Check if command exists
        const command = commands.get(commandName);
        if (!command) return;
        
        // Log command execution
        console.log(`\n✅ Command: ${commandName} | ${message.isGroup ? 'Group' : 'Personal'} | Thread: ${threadID}`);
        
        // Execute command
        try {
            command.run({ api, message, args, threadID, senderID });
        } catch (error) {
            console.error(`❌ Error executing ${commandName}:`, error);
            api.sendMessage(`❌ Error: ${error.message}`, threadID);
        }
    });
}

// Login process
const appStatePath = path.join(__dirname, "appstate.json");

if (fs.existsSync(appStatePath)) {
    // Login with appstate and improved anti-detection settings
    const appState = JSON.parse(fs.readFileSync(appStatePath, "utf8"));
    
    const options = {
        appState,
        // Anti-detection settings
        selfListen: false,
        listenEvents: true,
        updatePresence: true,  // Appear online to seem more human
        autoMarkRead: true,    // Auto-mark as read
        autoMarkDelivery: true, // Auto-mark as delivered
        forceLogin: false,
        online: true,
        // Use a realistic user agent
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    };
    
    login(options, (err, api) => {
        if (err) {
            console.error("Login failed:", err);
            return;
        }
        
        // Save updated appstate
        fs.writeFileSync(appStatePath, JSON.stringify(api.getAppState(), null, 2));
        
        // Load commands and start bot
        loadCommands();
        startBot(api);
    });
} else {
    // First time login with credentials
    console.log("No appstate.json found!");
    console.log("Please login with email and password:");
    console.log("You can modify this section to add your credentials or use appstate.");
    
    // Example login (uncomment and add your credentials)
    /*
    login({ email: "YOUR_EMAIL", password: "YOUR_PASSWORD" }, (err, api) => {
        if (err) {
            console.error("Login failed:", err);
            return;
        }
        
        // Save appstate for future use
        fs.writeFileSync(appStatePath, JSON.stringify(api.getAppState(), null, 2));
        console.log("✓ Appstate saved!");
        
        // Load commands and start bot
        loadCommands();
        startBot(api);
    });
    */
}

