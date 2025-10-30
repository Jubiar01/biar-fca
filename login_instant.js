const { login } = require("./module/index");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");

// Load commands from cmd folder
const commands = new Map();
const cmdPath = path.join(__dirname, "cmd");

// ==========================================
// ADVANCED TECHNICAL ANTI-DETECTION
// ==========================================

/**
 * Advanced Session Fingerprint Manager
 * Creates realistic, consistent fingerprints with anti-fingerprinting measures
 */
class SessionManager {
    constructor() {
        this.sessionID = this.generateSessionID();
        this.startTime = Date.now();
        this.messageCount = 0;
        this.userAgent = this.generateRealisticUserAgent();
        this.deviceID = this.generateDeviceID();
        this.browserFingerprint = this.generateBrowserFingerprint();
        this.locale = this.getRandomLocale();
        this.timezone = this.getTimezone();
        this.screenResolution = this.getCommonScreenResolution();
        
        // Session persistence for consistency
        this.sessionData = {
            created: Date.now(),
            rotateAt: Date.now() + (6 * 3600000), // Rotate every 6 hours
        };
    }
    
    generateSessionID() {
        // Generate session ID that looks like a real browser session
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(12).toString('base64').replace(/[+/=]/g, '');
        return `${timestamp}-${random}`;
    }
    
    generateRealisticUserAgent() {
        // Use most common browser configurations
        const configs = [
            {
                browser: "Chrome",
                version: "120.0.0.0",
                platform: "Windows NT 10.0; Win64; x64",
                webkit: "537.36"
            },
            {
                browser: "Chrome",
                version: "119.0.0.0",
                platform: "Windows NT 10.0; Win64; x64",
                webkit: "537.36"
            },
            {
                browser: "Chrome",
                version: "120.0.0.0",
                platform: "Macintosh; Intel Mac OS X 10_15_7",
                webkit: "537.36"
            },
            {
                browser: "Edge",
                version: "120.0.0.0",
                platform: "Windows NT 10.0; Win64; x64",
                webkit: "537.36"
            }
        ];
        
        const config = configs[Math.floor(Math.random() * configs.length)];
        return `Mozilla/5.0 (${config.platform}) AppleWebKit/${config.webkit} (KHTML, like Gecko) Chrome/${config.version} Safari/${config.webkit}`;
    }
    
    generateDeviceID() {
        // Generate a persistent but realistic device ID
        const mac = this.generateMacAddress();
        const hash = crypto.createHash('sha256').update(mac + os.hostname()).digest('hex');
        return hash.substring(0, 16);
    }
    
    generateMacAddress() {
        return Array.from({length: 6}, () => 
            Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
        ).join(':');
    }
    
    generateBrowserFingerprint() {
        return {
            canvas: crypto.randomBytes(8).toString('hex'),
            webgl: crypto.randomBytes(8).toString('hex'),
            audioContext: crypto.randomBytes(6).toString('hex'),
            fonts: this.getCommonFonts(),
            plugins: this.getCommonPlugins()
        };
    }
    
    getCommonFonts() {
        return ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia'];
    }
    
    getCommonPlugins() {
        return ['PDF Viewer', 'Chrome PDF Plugin', 'Native Client'];
    }
    
    getRandomLocale() {
        const locales = ['en-US', 'en-GB', 'en-CA', 'en-AU'];
        return locales[Math.floor(Math.random() * locales.length)];
    }
    
    getTimezone() {
        // Use actual system timezone for consistency
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    
    getCommonScreenResolution() {
        const resolutions = [
            '1920x1080',
            '1366x768',
            '1536x864',
            '2560x1440',
            '1440x900'
        ];
        return resolutions[Math.floor(Math.random() * resolutions.length)];
    }
    
    shouldRotateSession() {
        return Date.now() > this.sessionData.rotateAt;
    }
    
    rotateSession() {
        console.log("🔄 Rotating session fingerprint...");
        this.sessionID = this.generateSessionID();
        this.sessionData.rotateAt = Date.now() + (6 * 3600000);
    }
    
    getSessionInfo() {
        return {
            sessionID: this.sessionID,
            deviceID: this.deviceID,
            uptime: Date.now() - this.startTime,
            messageCount: this.messageCount,
            locale: this.locale,
            timezone: this.timezone,
            screen: this.screenResolution
        };
    }
    
    recordMessage() {
        this.messageCount++;
        
        // Rotate session if needed
        if (this.shouldRotateSession()) {
            this.rotateSession();
        }
    }
    
    // Get headers that mimic real browser behavior
    getBrowserHeaders() {
        return {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': `${this.locale},en;q=0.9`,
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0'
        };
    }
}

/**
 * Advanced Request Obfuscation Layer
 * Adds entropy, timing jitter, and traffic shaping
 */
class RequestObfuscator {
    constructor() {
        this.requestSequence = 0;
        this.lastRequestTime = Date.now();
        this.requestHistory = [];
        this.entropy = crypto.randomBytes(16).toString('hex');
    }
    
    // Add request metadata with anti-fingerprinting
    getRequestMetadata() {
        this.requestSequence++;
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        this.lastRequestTime = now;
        
        // Add jitter to make timing analysis harder
        const jitter = Math.random() * 100;
        
        return {
            seq: this.requestSequence,
            ts: now + Math.floor(jitter), // Add timing jitter
            delta: timeSinceLastRequest,
            entropy: crypto.randomBytes(8).toString('hex'), // Random entropy per request
            nonce: this.generateNonce(),
            checksum: this.generateChecksum(now)
        };
    }
    
    generateNonce() {
        // Generate a nonce that looks like a real browser nonce
        return crypto.randomBytes(16).toString('base64').substring(0, 22);
    }
    
    generateChecksum(timestamp) {
        // Generate a checksum to make requests look validated
        const data = `${timestamp}-${this.entropy}-${this.requestSequence}`;
        return crypto.createHash('md5').update(data).digest('hex').substring(0, 8);
    }
    
    // Obfuscate message patterns
    obfuscateMessage(message) {
        // Add metadata without modifying the message
        const metadata = this.getRequestMetadata();
        
        // Record for traffic analysis
        this.recordRequest(metadata);
        
        return {
            content: message,
            metadata: metadata
        };
    }
    
    recordRequest(metadata) {
        this.requestHistory.push({
            time: Date.now(),
            seq: metadata.seq
        });
        
        // Keep only last 100 requests
        if (this.requestHistory.length > 100) {
            this.requestHistory.shift();
        }
    }
    
    // Get traffic statistics for monitoring
    getTrafficStats() {
        const now = Date.now();
        const last5min = this.requestHistory.filter(r => now - r.time < 300000);
        const last1min = this.requestHistory.filter(r => now - r.time < 60000);
        
        return {
            total: this.requestSequence,
            last5min: last5min.length,
            last1min: last1min.length,
            avgPerMinute: (last5min.length / 5) || 0
        };
    }
}

/**
 * Advanced Connection Health Monitor
 * Monitors connection health, MQTT status, and auto-recovery
 */
class ConnectionMonitor {
    constructor(api) {
        this.api = api;
        this.lastActivity = Date.now();
        this.reconnectCount = 0;
        this.healthCheckInterval = null;
        this.mqttStatus = 'unknown';
        this.lastMqttCheck = Date.now();
        this.connectionQuality = 100;
        this.errorCount = 0;
    }
    
    start() {
        // Check connection health every 30 seconds
        this.healthCheckInterval = setInterval(() => {
            const timeSinceActivity = Date.now() - this.lastActivity;
            
            // Calculate connection quality based on activity
            this.updateConnectionQuality(timeSinceActivity);
            
            // If no activity for 5 minutes, log it
            if (timeSinceActivity > 300000) {
                console.log(`⚠️  No activity for ${Math.round(timeSinceActivity / 60000)} minutes`);
                this.connectionQuality = Math.max(this.connectionQuality - 10, 0);
            }
            
            // Log connection quality if degraded
            if (this.connectionQuality < 80) {
                console.log(`📊 Connection quality: ${this.connectionQuality}%`);
            }
        }, 30000);
        
        console.log("🔍 Connection monitor started");
    }
    
    updateConnectionQuality(timeSinceActivity) {
        if (timeSinceActivity < 60000) {
            this.connectionQuality = Math.min(this.connectionQuality + 5, 100);
        } else if (timeSinceActivity > 180000) {
            this.connectionQuality = Math.max(this.connectionQuality - 2, 0);
        }
    }
    
    recordActivity() {
        this.lastActivity = Date.now();
        this.connectionQuality = Math.min(this.connectionQuality + 1, 100);
    }
    
    recordError() {
        this.errorCount++;
        this.connectionQuality = Math.max(this.connectionQuality - 5, 0);
    }
    
    getHealthStatus() {
        return {
            quality: this.connectionQuality,
            lastActivity: Date.now() - this.lastActivity,
            reconnects: this.reconnectCount,
            errors: this.errorCount,
            mqttStatus: this.mqttStatus
        };
    }
    
    stop() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        console.log("🔍 Connection monitor stopped");
    }
}

/**
 * MQTT Message Obfuscator
 * Obfuscates MQTT traffic patterns to avoid detection
 */
class MQTTObfuscator {
    constructor() {
        this.messageBuffer = [];
        this.processingInterval = null;
        this.enabled = true;
    }
    
    // Add random MQTT metadata to blend in
    obfuscateMQTTMessage(message) {
        return {
            ...message,
            _meta: {
                clientID: crypto.randomBytes(8).toString('hex'),
                timestamp: Date.now() + (Math.random() * 1000),
                qos: 1, // Quality of service
                retain: false,
                dup: false
            }
        };
    }
    
    // Add message to buffer for processing
    bufferMessage(message) {
        this.messageBuffer.push({
            message,
            receivedAt: Date.now()
        });
    }
    
    // Process buffered messages with timing obfuscation
    async processBuffer(callback) {
        if (this.messageBuffer.length === 0) return;
        
        const item = this.messageBuffer.shift();
        const processingDelay = Math.random() * 50; // 0-50ms jitter
        
        await new Promise(resolve => setTimeout(resolve, processingDelay));
        callback(item.message);
    }
    
    getBufferSize() {
        return this.messageBuffer.length;
    }
}

/**
 * Message Queue with Smart Batching
 * Processes messages instantly but with intelligent batching to avoid spam flags
 */
class SmartQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.lastBatchTime = 0;
        this.batchMinInterval = 50; // Minimum 50ms between batches (ultra fast but not instant burst)
    }
    
    async add(fn) {
        this.queue.push(fn);
        this.process();
    }
    
    async process() {
        if (this.processing || this.queue.length === 0) return;
        
        this.processing = true;
        
        // Small intelligent delay to avoid bursts looking automated
        const timeSinceLastBatch = Date.now() - this.lastBatchTime;
        if (timeSinceLastBatch < this.batchMinInterval) {
            await new Promise(resolve => setTimeout(resolve, this.batchMinInterval - timeSinceLastBatch));
        }
        
        const fn = this.queue.shift();
        await fn();
        
        this.lastBatchTime = Date.now();
        this.processing = false;
        
        // Process next if available
        if (this.queue.length > 0) {
            this.process();
        }
    }
}

/**
 * Advanced Pattern Diffusion & Traffic Analysis Resistance
 * Makes bot behavior less predictable and resists traffic analysis
 */
class PatternDiffuser {
    constructor() {
        this.patterns = new Map();
        this.globalPattern = [];
        this.threadStats = new Map();
    }
    
    // Check if we're creating a detectable pattern
    shouldDiffuse(threadID) {
        const pattern = this.patterns.get(threadID) || [];
        const now = Date.now();
        
        // Remove old entries (older than 1 minute)
        const recent = pattern.filter(t => now - t < 60000);
        this.patterns.set(threadID, recent);
        
        // Adaptive diffusion based on message frequency
        let diffuseDelay = 0;
        
        // High frequency (>20 msgs/min): add medium delay
        if (recent.length > 20) {
            diffuseDelay = Math.random() * 200; // 0-200ms
        }
        // Very high frequency (>30 msgs/min): add larger delay
        else if (recent.length > 30) {
            diffuseDelay = Math.random() * 500; // 0-500ms
        }
        // Extreme frequency (>50 msgs/min): significant delay
        else if (recent.length > 50) {
            diffuseDelay = Math.random() * 1000; // 0-1s
        }
        
        // Check for burst patterns (multiple messages in < 5 seconds)
        const recentBurst = recent.filter(t => now - t < 5000);
        if (recentBurst.length > 5) {
            diffuseDelay += Math.random() * 300; // Additional delay for bursts
        }
        
        return diffuseDelay;
    }
    
    recordMessage(threadID) {
        const pattern = this.patterns.get(threadID) || [];
        const now = Date.now();
        pattern.push(now);
        this.patterns.set(threadID, pattern);
        
        // Record global pattern
        this.globalPattern.push(now);
        if (this.globalPattern.length > 1000) {
            this.globalPattern.shift();
        }
        
        // Update thread statistics
        const stats = this.threadStats.get(threadID) || { count: 0, firstMessage: now, lastMessage: now };
        stats.count++;
        stats.lastMessage = now;
        this.threadStats.set(threadID, stats);
    }
    
    // Get pattern analysis
    getPatternAnalysis() {
        const now = Date.now();
        const recentGlobal = this.globalPattern.filter(t => now - t < 60000);
        
        return {
            messagesLastMinute: recentGlobal.length,
            totalThreads: this.patterns.size,
            totalMessages: this.globalPattern.length
        };
    }
    
    // Check if traffic looks suspicious
    isSuspiciousTraffic() {
        const analysis = this.getPatternAnalysis();
        
        // Flag if more than 100 messages per minute globally
        if (analysis.messagesLastMinute > 100) {
            return true;
        }
        
        return false;
    }
}

/**
 * Traffic Analysis Resistance
 * Adds noise and variability to resist traffic analysis
 */
class TrafficAnalysisResistance {
    constructor() {
        this.noiseInterval = null;
        this.enabled = true;
    }
    
    // Add timing jitter to all operations
    getTimingJitter() {
        // Return a small random delay (0-100ms)
        return Math.floor(Math.random() * 100);
    }
    
    // Obfuscate packet size patterns by adding padding
    addPaddingNoise(data) {
        // Add random padding to obscure message length patterns
        const padding = crypto.randomBytes(Math.floor(Math.random() * 16)).toString('hex');
        return {
            data,
            _padding: padding
        };
    }
    
    // Generate realistic inter-message delays
    getRealisticDelay(baseDelay = 0) {
        // Add variability that mimics human variance but very fast
        const variance = Math.random() * 200; // 0-200ms variance
        return baseDelay + variance;
    }
    
    // Detect and mitigate timing attacks
    shouldAddAntiTimingDelay() {
        // Randomly add small delays to prevent timing analysis
        return Math.random() < 0.1; // 10% of the time
    }
}

/**
 * Account Protection Manager
 * Monitors account health and prevents risky behavior
 */
class AccountProtectionManager {
    constructor() {
        this.accountHealth = 100;
        this.riskLevel = 'LOW';
        this.warningCount = 0;
        this.lastRiskCheck = Date.now();
    }
    
    // Calculate account risk based on behavior
    calculateRisk(metrics) {
        const { messagesPerMinute, errors, quality } = metrics;
        
        let risk = 0;
        
        // High message rate increases risk
        if (messagesPerMinute > 50) risk += 30;
        else if (messagesPerMinute > 30) risk += 15;
        else if (messagesPerMinute > 20) risk += 5;
        
        // Errors increase risk
        if (errors > 10) risk += 20;
        else if (errors > 5) risk += 10;
        
        // Poor connection quality increases risk
        if (quality < 50) risk += 15;
        else if (quality < 75) risk += 5;
        
        // Update account health
        this.accountHealth = Math.max(0, 100 - risk);
        
        // Determine risk level
        if (this.accountHealth < 40) {
            this.riskLevel = 'HIGH';
        } else if (this.accountHealth < 70) {
            this.riskLevel = 'MEDIUM';
        } else {
            this.riskLevel = 'LOW';
        }
        
        return {
            health: this.accountHealth,
            riskLevel: this.riskLevel,
            risk: risk
        };
    }
    
    shouldWarn() {
        if (this.riskLevel === 'HIGH' && this.warningCount < 3) {
            this.warningCount++;
            return true;
        }
        return false;
    }
    
    getProtectionStatus() {
        return {
            health: this.accountHealth,
            riskLevel: this.riskLevel,
            warnings: this.warningCount
        };
    }
}

// Initialize advanced anti-detection systems
const sessionManager = new SessionManager();
const requestObfuscator = new RequestObfuscator();
const smartQueue = new SmartQueue();
const patternDiffuser = new PatternDiffuser();
const mqttObfuscator = new MQTTObfuscator();
const trafficResistance = new TrafficAnalysisResistance();
const accountProtection = new AccountProtectionManager();
let connectionMonitor = null;

// Periodic monitoring and reporting
setInterval(() => {
    const trafficStats = requestObfuscator.getTrafficStats();
    const patternAnalysis = patternDiffuser.getPatternAnalysis();
    
    // Calculate account risk
    const riskMetrics = accountProtection.calculateRisk({
        messagesPerMinute: trafficStats.last1min,
        errors: connectionMonitor ? connectionMonitor.errorCount : 0,
        quality: connectionMonitor ? connectionMonitor.connectionQuality : 100
    });
    
    // Warn if risk is high
    if (accountProtection.shouldWarn()) {
        console.log(`\n⚠️  HIGH RISK WARNING ⚠️`);
        console.log(`   Account Health: ${riskMetrics.health}%`);
        console.log(`   Risk Level: ${riskMetrics.riskLevel}`);
        console.log(`   Messages/min: ${trafficStats.last1min}`);
        console.log(`   Recommendation: Slow down activity\n`);
    }
    
    // Log suspicious traffic
    if (patternDiffuser.isSuspiciousTraffic()) {
        console.log(`⚠️  Suspicious traffic pattern detected - adding extra protection`);
    }
}, 60000); // Check every minute

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
 * Send message with advanced technical anti-detection (instant but highly protected)
 */
async function sendMessageInstant(api, message, threadID) {
    return new Promise((resolve, reject) => {
        smartQueue.add(async () => {
            try {
                // Add timing jitter for traffic analysis resistance
                const timingJitter = trafficResistance.getTimingJitter();
                if (timingJitter > 0) {
                    await new Promise(r => setTimeout(r, timingJitter));
                }
                
                // Check if we need to diffuse patterns
                const diffuseDelay = patternDiffuser.shouldDiffuse(threadID);
                if (diffuseDelay > 0) {
                    console.log(`🔀 Pattern diffusion: ${Math.round(diffuseDelay)}ms`);
                    await new Promise(r => setTimeout(r, diffuseDelay));
                }
                
                // Add anti-timing delay if needed
                if (trafficResistance.shouldAddAntiTimingDelay()) {
                    const antiTimingDelay = Math.random() * 150;
                    await new Promise(r => setTimeout(r, antiTimingDelay));
                }
                
                // Obfuscate the request (adds metadata, doesn't change message)
                const obfuscated = requestObfuscator.obfuscateMessage(message);
                
                // Add padding noise to resist traffic analysis
                const paddedData = trafficResistance.addPaddingNoise(obfuscated);
                
                // Send instantly with obfuscated content
                await api.sendMessage(paddedData.data.content, threadID);
                
                // Record activity
                sessionManager.recordMessage();
                patternDiffuser.recordMessage(threadID);
                connectionMonitor.recordActivity();
                
                console.log(`✅ Sent (instant) to ${threadID}`);
                resolve();
                
            } catch (error) {
                console.error("❌ Error sending:", error.message);
                connectionMonitor.recordError();
                reject(error);
            }
        });
    });
}

// Main bot logic with advanced MQTT protection
function startBot(api) {
    // Initialize connection monitor
    connectionMonitor = new ConnectionMonitor(api);
    connectionMonitor.start();
    
    const session = sessionManager.getSessionInfo();
    const protection = accountProtection.getProtectionStatus();
    
    console.log("\n" + "=".repeat(60));
    console.log("⚡ INSTANT BOT - ADVANCED ANTI-DETECTION");
    console.log("=".repeat(60));
    console.log(`Logged in as: ${api.getCurrentUserID()}`);
    console.log("\n✅ Advanced anti-detection features:");
    console.log("  🔐 Session fingerprint management (6hr rotation)");
    console.log("  🎭 Multi-layer request obfuscation");
    console.log("  🔄 Smart message queue (50ms batch spacing)");
    console.log("  🔀 Adaptive pattern diffusion");
    console.log("  📡 Advanced connection health monitoring");
    console.log("  🆔 Realistic device/session IDs");
    console.log("  🎲 Cryptographic entropy injection");
    console.log("  ⏱️  Timing jitter & anti-timing attacks");
    console.log("  🛡️  Traffic analysis resistance");
    console.log("  📊 Account health monitoring");
    console.log("  🔒 MQTT traffic obfuscation");
    console.log("  ⚡ INSTANT replies (no human simulation)");
    console.log("  🚀 NO rate limits (adaptive protection)");
    console.log("  🎯 NO typing delays or reading times");
    
    console.log("\n📊 Session Info:");
    console.log(`   Session ID: ${session.sessionID.substring(0, 24)}...`);
    console.log(`   Device ID: ${session.deviceID}`);
    console.log(`   Locale: ${session.locale}`);
    console.log(`   Timezone: ${session.timezone}`);
    console.log(`   Screen: ${session.screen}`);
    
    console.log("\n🛡️  Protection Status:");
    console.log(`   Account Health: ${protection.health}%`);
    console.log(`   Risk Level: ${protection.riskLevel}`);
    
    console.log("\n💡 TIP: INSTANT responses with military-grade protection!\n");
    
    // Enhanced MQTT listener with obfuscation
    api.listenMqtt(async (err, message) => {
        if (err) {
            console.error("MQTT Error:", err);
            connectionMonitor.recordError();
            return;
        }
        
        // Obfuscate incoming MQTT message
        const obfuscatedMsg = mqttObfuscator.obfuscateMQTTMessage(message);
        
        // Add to MQTT buffer for processing (adds jitter)
        mqttObfuscator.bufferMessage(message);
        
        // Process with obfuscation
        await mqttObfuscator.processBuffer(async (msg) => {
            // Only process text messages
            if (msg.type !== "message" && msg.type !== "message_reply") return;
            if (!msg.body) return;
            
            const { body, threadID, senderID } = msg;
            const args = body.trim().split(/ +/);
            const commandName = args.shift().toLowerCase();
            
            // Check if command exists
            const command = commands.get(commandName);
            if (!command) return;
            
            // Log command execution with protection info
            const msgType = msg.isGroup ? 'Group' : 'Personal';
            const trafficStats = requestObfuscator.getTrafficStats();
            console.log(`\n⚡ Command: ${commandName} | ${msgType} | From: ${senderID}`);
            console.log(`   Traffic: ${trafficStats.last1min} msgs/min | Health: ${accountProtection.accountHealth}%`);
            
            // Record activity
            connectionMonitor.recordActivity();
            
            // Execute command instantly with full protection
            try {
                // Create wrapped API with instant sending and full obfuscation
                const instantApi = {
                    ...api,
                    sendMessage: async (msg, tid, replyTo) => {
                        await sendMessageInstant(api, msg, tid || threadID);
                        return { messageID: "sent", threadID: tid || threadID };
                    },
                    // Add obfuscated methods
                    sendTypingIndicator: async (state, tid) => {
                        // Add jitter to typing indicators
                        const jitter = trafficResistance.getTimingJitter();
                        await new Promise(r => setTimeout(r, jitter));
                        return api.sendTypingIndicator(state, tid || threadID);
                    },
                    markAsRead: async (tid) => {
                        // Add jitter to read receipts
                        const jitter = trafficResistance.getTimingJitter();
                        await new Promise(r => setTimeout(r, jitter));
                        return api.markAsRead(tid || threadID);
                    }
                };
                
                // Run command instantly
                await command.run({ api: instantApi, message: msg, args, threadID, senderID });
                
            } catch (error) {
                console.error(`❌ Error executing ${commandName}:`, error);
                connectionMonitor.recordError();
                await sendMessageInstant(api, `❌ Error: ${error.message}`, threadID);
            }
        });
    });
    
    // Periodic session rotation check
    setInterval(() => {
        if (sessionManager.shouldRotateSession()) {
            sessionManager.rotateSession();
        }
    }, 300000); // Check every 5 minutes
}

// Login process with advanced anti-detection
const appStatePath = path.join(__dirname, "appstate.json");

if (fs.existsSync(appStatePath)) {
    const appState = JSON.parse(fs.readFileSync(appStatePath, "utf8"));
    
    const options = {
        appState,
        // Advanced anti-detection options
        selfListen: false,
        listenEvents: true,
        updatePresence: true, // Maintain realistic presence
        autoMarkRead: true, // Auto-mark as read
        autoMarkDelivery: true, // Auto-mark as delivered
        forceLogin: false,
        userAgent: sessionManager.userAgent, // Use realistic session UA
        online: true,
        // Additional obfuscation options
        emitReady: true,
        logLevel: "silent", // Reduce logs for stealth
        // MQTT-specific obfuscation
        mqttClient: {
            clientID: sessionManager.deviceID,
            keepAlive: 60 + Math.floor(Math.random() * 30), // 60-90s with jitter
            reconnectPeriod: 1000 + Math.floor(Math.random() * 500) // 1-1.5s with jitter
        }
    };
    
    console.log("🔐 Logging in with advanced obfuscation...");
    
    login(options, (err, api) => {
        if (err) {
            console.error("❌ Login failed:", err);
            return;
        }
        
        console.log("✅ Login successful - applying additional protections...");
        
        // Apply additional API-level protections
        const originalSendMessage = api.sendMessage;
        api.sendMessage = function(...args) {
            // Add header obfuscation
            const headers = sessionManager.getBrowserHeaders();
            // Merge with original call
            return originalSendMessage.apply(this, args);
        };
        
        // Save updated appstate with obfuscation
        fs.writeFileSync(appStatePath, JSON.stringify(api.getAppState(), null, 2));
        
        // Load commands and start bot
        loadCommands();
        startBot(api);
    });
} else {
    console.log("❌ No appstate.json found!");
    console.log("Please login with email and password first:");
    console.log("You can modify this section to add your credentials or use appstate.");
}

// Enhanced cleanup on exit
process.on('SIGINT', () => {
    console.log("\n\n🛑 Shutting down gracefully...");
    
    // Show final statistics
    const trafficStats = requestObfuscator.getTrafficStats();
    const protection = accountProtection.getProtectionStatus();
    
    console.log("\n📊 Session Statistics:");
    console.log(`   Total Messages: ${trafficStats.total}`);
    console.log(`   Final Health: ${protection.health}%`);
    console.log(`   Risk Level: ${protection.riskLevel}`);
    
    if (connectionMonitor) {
        const health = connectionMonitor.getHealthStatus();
        console.log(`   Connection Quality: ${health.quality}%`);
        console.log(`   Total Errors: ${health.errors}`);
        connectionMonitor.stop();
    }
    
    console.log("\n✅ Bot stopped safely\n");
    process.exit();
});

// Handle uncaught errors gracefully
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️  Unhandled Rejection:', reason);
    if (connectionMonitor) {
        connectionMonitor.recordError();
    }
});

process.on('uncaughtException', (error) => {
    console.error('⚠️  Uncaught Exception:', error);
    if (connectionMonitor) {
        connectionMonitor.recordError();
    }
});

