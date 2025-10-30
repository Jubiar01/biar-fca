const { login } = require("./module/index");
const fs = require("fs");
const path = require("path");
const {
    randomDelay,
    calculateTypingTime,
    calculateReadingTime,
    RateLimiter,
    getRandomUserAgent,
    BehaviorTracker,
    ActivityScheduler,
    MultiMessageHandler,
    TypoSimulator,
    CooldownManager
} = require("./src/utils/antiDetection");

// Load commands from cmd folder
const commands = new Map();
const cmdPath = path.join(__dirname, "cmd");

// Initialize anti-detection systems
const rateLimiter = new RateLimiter();
const behaviorTracker = new BehaviorTracker();
const activityScheduler = new ActivityScheduler({
    enabled: true, // Set to false to disable sleep/activity patterns
    sleepHours: { start: 23, end: 7 }, // 11 PM to 7 AM (customize for your timezone)
    peakHours: [12, 13, 18, 19, 20, 21], // Lunch & evening (faster responses)
    slowHours: [6, 7, 8, 9, 14, 15], // Morning & afternoon (slower responses)
    weekendSlower: true // Slower on weekends
});
const multiMessageHandler = new MultiMessageHandler();
const typoSimulator = new TypoSimulator(0.03); // 3% chance of typo (realistic)
const cooldownManager = new CooldownManager();

// Clean up behavior tracker every hour
setInterval(() => behaviorTracker.cleanup(), 3600000);

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

/**
 * Send message with human-like behavior
 * @param {Object} api - Facebook API
 * @param {string} message - Message to send
 * @param {string} threadID - Thread ID
 * @param {string} originalMessage - Original message received (for reading time)
 */
async function sendMessageHumanLike(api, message, threadID, originalMessage = "") {
    try {
        // Check if on cooldown (forced break after heavy usage)
        if (cooldownManager.onCooldown()) {
            const remaining = Math.round(cooldownManager.timeRemaining() / 1000);
            console.log(`⏸️  On cooldown - ${remaining}s remaining`);
            return;
        }
        
        // Check activity schedule (sleep hours, etc.)
        if (!activityScheduler.shouldRespond()) {
            return; // Bot is "offline"
        }
        
        // Check rate limits
        if (!rateLimiter.canSendMessage()) {
            const delay = rateLimiter.getSuggestedDelay();
            console.log(`⏳ Rate limit: Waiting ${delay}ms before sending...`);
            await randomDelay(delay, delay + 1000);
        }
        
        // Check for spam patterns
        if (behaviorTracker.looksLikeSpam(threadID, message)) {
            console.log("⚠️  Skipping message - spam pattern detected");
            return;
        }
        
        // Add realistic typos occasionally
        let finalMessage = typoSimulator.addTypo(message);
        
        // Get time-of-day multiplier (slower at night, faster during peak hours)
        const timeMultiplier = activityScheduler.getTimeMultiplier();
        if (timeMultiplier !== 1.0) {
            console.log(`⏰ Time multiplier: ${timeMultiplier.toFixed(2)}x (${new Date().getHours()}:00)`);
        }
        
        // Simulate reading the received message
        let readingTime = calculateReadingTime(originalMessage) * timeMultiplier;
        console.log(`📖 Reading for ${Math.round(readingTime)}ms...`);
        await randomDelay(readingTime * 0.8, readingTime * 1.2);
        
        // Start typing indicator
        await api.sendTypingIndicator(true, threadID);
        
        // Simulate typing the response
        let typingTime = calculateTypingTime(finalMessage) * timeMultiplier;
        console.log(`⌨️  Typing for ${Math.round(typingTime)}ms...`);
        await randomDelay(typingTime * 0.8, typingTime * 1.2);
        
        // Send the message
        await api.sendMessage(finalMessage, threadID);
        
        // Stop typing indicator
        await api.sendTypingIndicator(false, threadID);
        
        // Record the message
        rateLimiter.recordMessage();
        behaviorTracker.recordMessage(threadID, finalMessage);
        cooldownManager.recordMessage();
        
        console.log(`✅ Message sent to ${threadID}`);
        
        // Add a small random delay after sending (varies by time of day)
        await randomDelay(500 * timeMultiplier, 1500 * timeMultiplier);
        
    } catch (error) {
        console.error("❌ Error sending message:", error.message);
        
        // Stop typing on error
        try {
            await api.sendTypingIndicator(false, threadID);
        } catch (e) {
            // Ignore
        }
    }
}

// Main bot logic
function startBot(api) {
    console.log("\n" + "=".repeat(60));
    console.log("🛡️  BOT STARTED WITH ADVANCED ANTI-DETECTION");
    console.log("=".repeat(60));
    console.log(`Logged in as: ${api.getCurrentUserID()}`);
    console.log("\n✅ Anti-detection features enabled:");
    console.log("  🤖 Human-like typing simulation (200-300 chars/min)");
    console.log("  📖 Reading time delays before responding");
    console.log("  ⏰ Activity scheduling (sleep 11PM-7AM, peak hours aware)");
    console.log("  🚦 Rate limiting (max 10 msgs/min, 100 msgs/hour)");
    console.log("  ⏸️  Auto-cooldown after 50 messages (10 min break)");
    console.log("  ✏️  Realistic typo simulation (3% chance)");
    console.log("  📚 Multi-message handling (waits for all messages)");
    console.log("  🚫 Spam pattern detection");
    console.log("  ⌨️  Typing indicators ('typing...')");
    console.log("  🎲 Random delays & time-of-day variance");
    console.log("  👀 Occasionally ignores messages (2% - more human-like)");
    
    const currentHour = new Date().getHours();
    if (activityScheduler.isSleepTime()) {
        console.log("\n😴 WARNING: Currently in SLEEP HOURS - bot will NOT respond");
        console.log(`   Sleep hours: ${activityScheduler.sleepHours.start}:00 - ${activityScheduler.sleepHours.end}:00`);
        console.log("   Bot will resume responses during awake hours");
    } else if (activityScheduler.peakHours.includes(currentHour)) {
        console.log("\n⚡ Currently PEAK HOURS - faster responses (still human-like)");
    } else if (activityScheduler.slowHours.includes(currentHour)) {
        console.log("\n🐌 Currently SLOW HOURS - slower responses");
    }
    
    console.log("\n📊 Configuration:");
    console.log(`   Sleep hours: ${activityScheduler.sleepHours.start}:00 - ${activityScheduler.sleepHours.end}:00`);
    console.log(`   Peak hours: ${activityScheduler.peakHours.join(', ')}`);
    console.log(`   Cooldown: After ${cooldownManager.messagesBeforeCooldown} msgs`);
    console.log("   Typo chance: 3%");
    console.log("   Ignore chance: 2%");
    console.log("\n💡 TIP: Bot is MUCH slower but MUCH safer from bans!\n");
    
    api.listenMqtt(async (err, message) => {
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
        console.log(`\n📨 Command: ${commandName} | ${message.isGroup ? 'Group' : 'Personal'} | From: ${senderID}`);
        
        // Execute command with anti-detection wrapper
        try {
            // Create a wrapped API that uses human-like sending
            const safeApi = {
                ...api,
                sendMessage: async (msg, tid, replyTo) => {
                    await sendMessageHumanLike(api, msg, tid || threadID, body);
                    return { messageID: "sent", threadID: tid || threadID };
                }
            };
            
            // Run command with safe API
            await command.run({ api: safeApi, message, args, threadID, senderID });
            
        } catch (error) {
            console.error(`❌ Error executing ${commandName}:`, error);
            // Even error messages should be rate-limited
            await sendMessageHumanLike(api, `❌ Error: ${error.message}`, threadID, body);
        }
    });
}

// Login process with anti-detection options
const appStatePath = path.join(__dirname, "appstate.json");

if (fs.existsSync(appStatePath)) {
    // Login with appstate and anti-detection options
    const appState = JSON.parse(fs.readFileSync(appStatePath, "utf8"));
    
    const options = {
        appState,
        // Anti-detection options
        selfListen: false,
        listenEvents: true,
        updatePresence: true, // Appear online like a real user
        autoMarkRead: true,  // Mark messages as read automatically
        autoMarkDelivery: true, // Mark as delivered
        forceLogin: false,
        userAgent: getRandomUserAgent(), // Use realistic user agent
        online: true
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
    console.log("No appstate.json found!");
    console.log("Please login with email and password first:");
    console.log("You can modify this section to add your credentials or use appstate.");
}

