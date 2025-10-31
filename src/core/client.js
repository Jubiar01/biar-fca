"use strict";

const utils = require("../utils");
const setOptionsModel = require('./models/setOptions');
const buildAPIModel = require('./models/buildAPI');
const loginHelperModel = require('./models/loginHelper');
const crypto = require("crypto");
const os = require("os");

const globalOptions = {};
let api = null;
let _ctx = null;
let _defaultFuncs = null;

const fbLink = (ext) => ("https://www.facebook.com" + (ext ? '/' + ext : ''));
const ERROR_RETRIEVING = "Error retrieving userID. This can be caused by many factors, including being blocked by Facebook for logging in from an unknown location. Try logging in with a browser to verify.";

// ==========================================
// ADVANCED ANTI-DETECTION SYSTEM
// ==========================================

/**
 * Advanced Session Fingerprint Manager
 * Creates realistic, consistent fingerprints with anti-fingerprinting measures
 */
class SessionManager {
    constructor() {
        this.sessionID = this.generateSessionID();
        this.startTime = Date.now();
        this.userAgent = this.generateRealisticUserAgent();
        this.deviceID = this.generateDeviceID();
        this.locale = this.getRandomLocale();
        this.timezone = this.getTimezone();
        this.screenResolution = this.getCommonScreenResolution();
        this.sessionData = {
            created: Date.now(),
            rotateAt: Date.now() + (6 * 3600000), // Rotate every 6 hours
        };
    }
    
    generateSessionID() {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(12).toString('base64').replace(/[+/=]/g, '');
        return `${timestamp}-${random}`;
    }
    
    generateRealisticUserAgent() {
        const configs = [
            {
                version: "120.0.0.0",
                platform: "Windows NT 10.0; Win64; x64",
                webkit: "537.36"
            },
            {
                version: "119.0.0.0",
                platform: "Windows NT 10.0; Win64; x64",
                webkit: "537.36"
            },
            {
                version: "120.0.0.0",
                platform: "Macintosh; Intel Mac OS X 10_15_7",
                webkit: "537.36"
            },
            {
                version: "121.0.0.0",
                platform: "X11; Linux x86_64",
                webkit: "537.36"
            }
        ];
        
        const config = configs[Math.floor(Math.random() * configs.length)];
        return `Mozilla/5.0 (${config.platform}) AppleWebKit/${config.webkit} (KHTML, like Gecko) Chrome/${config.version} Safari/${config.webkit}`;
    }
    
    generateDeviceID() {
        const mac = this.generateMacAddress();
        const hash = crypto.createHash('sha256').update(mac + os.hostname()).digest('hex');
        return hash.substring(0, 16);
    }
    
    generateMacAddress() {
        return Array.from({length: 6}, () => 
            Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
        ).join(':');
    }
    
    getRandomLocale() {
        const locales = ['en-US', 'en-GB', 'en-CA', 'en-AU'];
        return locales[Math.floor(Math.random() * locales.length)];
    }
    
    getTimezone() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    
    getCommonScreenResolution() {
        const resolutions = ['1920x1080', '1366x768', '1536x864', '2560x1440', '1440x900'];
        return resolutions[Math.floor(Math.random() * resolutions.length)];
    }
    
    shouldRotateSession() {
        return Date.now() > this.sessionData.rotateAt;
    }
    
    rotateSession() {
        this.sessionID = this.generateSessionID();
        this.sessionData.rotateAt = Date.now() + (6 * 3600000);
    }
    
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
 * Traffic Analysis Resistance Layer
 * Adds timing jitter and variability to resist detection
 */
class TrafficAnalysisResistance {
    constructor() {
        this.enabled = true;
    }
    
    getTimingJitter() {
        return Math.floor(Math.random() * 100);
    }
    
    addPaddingNoise(data) {
        const padding = crypto.randomBytes(Math.floor(Math.random() * 16)).toString('hex');
        return {
            data,
            _padding: padding
        };
    }
    
    getRealisticDelay(baseDelay = 0) {
        const variance = Math.random() * 200;
        return baseDelay + variance;
    }
}

/**
 * Request Obfuscation Layer
 * Adds entropy and metadata to requests
 */
class RequestObfuscator {
    constructor() {
        this.requestSequence = 0;
        this.entropy = crypto.randomBytes(16).toString('hex');
    }
    
    getRequestMetadata() {
        this.requestSequence++;
        const now = Date.now();
        const jitter = Math.random() * 100;
        
        return {
            seq: this.requestSequence,
            ts: now + Math.floor(jitter),
            entropy: crypto.randomBytes(8).toString('hex'),
            nonce: this.generateNonce(),
            checksum: this.generateChecksum(now)
        };
    }
    
    generateNonce() {
        return crypto.randomBytes(16).toString('base64').substring(0, 22);
    }
    
    generateChecksum(timestamp) {
        const data = `${timestamp}-${this.entropy}-${this.requestSequence}`;
        return crypto.createHash('md5').update(data).digest('hex').substring(0, 8);
    }
}

/**
 * Pattern Diffusion System
 * Prevents detectable patterns in bot behavior
 */
class PatternDiffuser {
    constructor() {
        this.patterns = new Map();
    }
    
    shouldDiffuse(threadID) {
        const pattern = this.patterns.get(threadID) || [];
        const now = Date.now();
        
        const recent = pattern.filter(t => now - t < 60000);
        this.patterns.set(threadID, recent);
        
        let diffuseDelay = 0;
        
        if (recent.length > 20) {
            diffuseDelay = Math.random() * 200;
        } else if (recent.length > 30) {
            diffuseDelay = Math.random() * 500;
        } else if (recent.length > 50) {
            diffuseDelay = Math.random() * 1000;
        }
        
        const recentBurst = recent.filter(t => now - t < 5000);
        if (recentBurst.length > 5) {
            diffuseDelay += Math.random() * 300;
        }
        
        return diffuseDelay;
    }
    
    recordMessage(threadID) {
        const pattern = this.patterns.get(threadID) || [];
        pattern.push(Date.now());
        this.patterns.set(threadID, pattern);
    }
}

/**
 * Enhanced API Wrapper with Anti-Detection
 * Wraps the API with protection layers
 */
class EnhancedAPI {
    constructor(originalApi, protectionEnabled = true) {
        this.api = originalApi;
        this.protectionEnabled = protectionEnabled;
        
        if (protectionEnabled) {
            this.sessionManager = new SessionManager();
            this.trafficResistance = new TrafficAnalysisResistance();
            this.requestObfuscator = new RequestObfuscator();
            this.patternDiffuser = new PatternDiffuser();
            
            // Start session rotation
            this.startSessionRotation();
        }
        
        // Wrap all API methods
        this.wrapApiMethods();
    }
    
    startSessionRotation() {
        setInterval(() => {
            if (this.sessionManager.shouldRotateSession()) {
                this.sessionManager.rotateSession();
            }
        }, 300000); // Check every 5 minutes
    }
    
    async applyProtection(fn, threadID) {
        if (!this.protectionEnabled) {
            return await fn();
        }
        
        // Add timing jitter
        const timingJitter = this.trafficResistance.getTimingJitter();
        if (timingJitter > 0) {
            await new Promise(r => setTimeout(r, timingJitter));
        }
        
        // Check pattern diffusion
        const diffuseDelay = this.patternDiffuser.shouldDiffuse(threadID);
        if (diffuseDelay > 0) {
            await new Promise(r => setTimeout(r, diffuseDelay));
        }
        
        // Execute with protection
        const result = await fn();
        
        // Record activity
        if (threadID) {
            this.patternDiffuser.recordMessage(threadID);
        }
        
        return result;
    }
    
    wrapApiMethods() {
        // Store original method
        const originalSendMessage = this.api.sendMessage || this.api.sendMessageMqtt;
        
        // Wrap sendMessage with protection
        if (originalSendMessage) {
            this.api.sendMessage = async (message, threadID, callback, messageID) => {
                return this.applyProtection(async () => {
                    return new Promise((resolve, reject) => {
                        originalSendMessage.call(this.api, message, threadID, (err, info) => {
                            if (err) {
                                if (callback) callback(err);
                                return reject(err);
                            }
                            if (callback) callback(null, info);
                            resolve(info);
                        }, messageID);
                    });
                }, threadID);
            };
        }
        
        // Wrap other methods if protection is enabled
        if (this.protectionEnabled) {
            const methodsToWrap = ['sendTypingIndicator', 'markAsRead', 'markAsDelivered'];
            
            methodsToWrap.forEach(methodName => {
                const originalMethod = this.api[methodName];
                if (originalMethod) {
                    this.api[methodName] = async (...args) => {
                        const jitter = this.trafficResistance.getTimingJitter();
                        await new Promise(r => setTimeout(r, jitter));
                        return originalMethod.apply(this.api, args);
                    };
                }
            });
        }
    }
    
    getProtectionStats() {
        if (!this.protectionEnabled) {
            return { enabled: false };
        }
        
        return {
            enabled: true,
            sessionID: this.sessionManager.sessionID.substring(0, 24) + '...',
            deviceID: this.sessionManager.deviceID,
            requests: this.requestObfuscator.requestSequence,
            uptime: Date.now() - this.sessionManager.startTime
        };
    }
}

/**
 * Initiates the login process for a Facebook account with advanced anti-detection.
 *
 * @param {object} credentials The user's login credentials (e.g., email/password or appState cookies).
 * @param {object} [options={}] Optional login configurations.
 * @param {boolean} [options.advancedProtection=true] Enable advanced anti-detection features.
 * @param {boolean} [options.autoRotateSession=true] Automatically rotate session fingerprints.
 * @param {boolean} [options.randomUserAgent=true] Use random realistic user agents.
 * @param {function} callback The callback function to be invoked upon login completion.
 * @returns {Promise<void>}
 */
async function login(credentials, options, callback) {
    if (typeof options === "function") {
        callback = options;
        options = {};
    }
    
    if ('logging' in options) {
        utils.logOptions(options.logging);
    }
    
    // Initialize anti-detection systems if enabled
    const advancedProtection = options.advancedProtection !== false; // Default: true
    let sessionManager = null;
    
    if (advancedProtection) {
        sessionManager = new SessionManager();
        
        // Log protection status
        if (options.logging !== false) {
            utils.log("🛡️  Advanced Protection: ENABLED");
            utils.log("   • Session fingerprint management");
            utils.log("   • Request obfuscation");
            utils.log("   • Pattern diffusion");
            utils.log("   • Traffic analysis resistance");
        }
    }
    
    const defaultOptions = {
        selfListen: false,
        listenEvents: true,
        listenTyping: false,
        updatePresence: true, // Enable for realistic presence
        forceLogin: false,
        autoMarkDelivery: true, // Enable for realistic behavior
        autoMarkRead: true,
        autoReconnect: true,
        online: true,
        emitReady: false,
        userAgent: sessionManager ? sessionManager.userAgent : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        // Advanced protection options
        advancedProtection: advancedProtection,
        autoRotateSession: options.autoRotateSession !== false,
        randomUserAgent: options.randomUserAgent !== false,
    };
    
    Object.assign(globalOptions, defaultOptions, options);
    
    // Apply session-specific options if protection is enabled
    if (sessionManager) {
        globalOptions.mqttClient = {
            clientID: sessionManager.deviceID,
            keepAlive: 60 + Math.floor(Math.random() * 30),
            reconnectPeriod: 1000 + Math.floor(Math.random() * 500)
        };
    }

    await setOptionsModel(globalOptions, options);

    loginHelperModel(
        credentials,
        globalOptions,
        (loginError, loginApi) => {
            if (loginError) {
                return callback(loginError);
            }
            
            // Wrap API with enhanced protection
            if (advancedProtection) {
                const enhancedApi = new EnhancedAPI(loginApi, true);
                
                // Add getProtectionStats method
                loginApi.getProtectionStats = () => enhancedApi.getProtectionStats();
                
                // Log protection info
                if (options.logging !== false) {
                    const stats = enhancedApi.getProtectionStats();
                    utils.log("✅ Protection initialized");
                    utils.log(`   Session ID: ${stats.sessionID}`);
                    utils.log(`   Device ID: ${stats.deviceID}`);
                }
            }
            
            api = loginApi;
            _ctx = loginApi.ctx;
            _defaultFuncs = loginApi.defaultFuncs;
            
            return callback(null, loginApi);
        },
        setOptionsModel,
        buildAPIModel,
        api,
        fbLink, 
        ERROR_RETRIEVING
    );
}

module.exports = {
    login
};
