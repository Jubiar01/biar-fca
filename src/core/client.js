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
 * Cookie Refresh Manager
 * Maintains fresh cookies every 20 minutes to keep the bot online
 * Now includes MQTT keep-alive pings for enhanced connection stability
 */
class CookieRefreshManager {
    constructor(ctx, defaultFuncs, globalOptions) {
        this.ctx = ctx;
        this.defaultFuncs = defaultFuncs;
        this.globalOptions = globalOptions;
        this.refreshInterval = 1200000; // 20 minutes (20 * 60 * 1000)
        this.mqttPingInterval = 30000; // 30 seconds for MQTT keep-alive
        this.isRefreshing = false;
        this.refreshTimer = null;
        this.mqttPingTimer = null;
        this.lastRefresh = Date.now();
        this.lastMqttPing = Date.now();
        this.refreshCount = 0;
        this.mqttPingCount = 0;
        this.failureCount = 0;
        this.mqttPingFailures = 0;
    }
    
    /**
     * Start the cookie refresh cycle and MQTT keep-alive pings
     */
    start() {
        if (this.refreshTimer) {
            return; // Already running
        }
        
        utils.log("🔄 Cookie Refresh Manager: STARTED");
        utils.log("   • Cookie refresh: Every 20 minutes");
        utils.log("   • MQTT keep-alive: Every 30 seconds");
        
        // Initial refresh after 30 seconds to allow bot to fully initialize
        setTimeout(() => this.refreshCookies(), 30000);
        
        // Set up recurring refresh every 20 minutes
        this.refreshTimer = setInterval(() => {
            this.refreshCookies();
        }, this.refreshInterval);
        
        // Start MQTT keep-alive pings (every 30 seconds)
        this.startMqttKeepAlive();
    }
    
    /**
     * Stop the cookie refresh cycle and MQTT keep-alive pings
     */
    stop() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
        
        if (this.mqttPingTimer) {
            clearInterval(this.mqttPingTimer);
            this.mqttPingTimer = null;
        }

        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
        }
        
        utils.log("🛑 Cookie Refresh Manager: STOPPED");
    }
    
    /**
     * Start MQTT keep-alive pings to maintain connection
     */
    startMqttKeepAlive() {
        if (this.mqttPingTimer) {
            return; // Already running
        }
        
        // Send initial ping after 5 seconds
        setTimeout(() => this.sendMqttPing(), 5000);
        
        // Set up recurring MQTT pings every 30 seconds
        this.mqttPingTimer = setInterval(() => {
            this.sendMqttPing();
        }, this.mqttPingInterval);

        // Health monitoring: check for message activity
        this.healthCheckTimer = setInterval(() => {
            this.checkConnectionHealth();
        }, 60000); // Check every minute
    }

    checkConnectionHealth() {
        if (!this.ctx.lastMessageTime) {
            return; // Not initialized yet
        }

        const timeSinceLastMessage = Date.now() - this.ctx.lastMessageTime;
        const fiveMinutes = 5 * 60 * 1000;

        // If no MQTT messages for 5+ minutes and connection says it's connected
        if (timeSinceLastMessage > fiveMinutes && this.ctx.mqttClient && this.ctx.mqttClient.connected) {
            if (this.globalOptions.logging !== false) {
                utils.log(`⚠️  No MQTT activity for ${Math.floor(timeSinceLastMessage / 60000)} minutes. Forcing reconnection...`);
            }
            
            // Force reconnection
            if (this.ctx.reconnectMqtt) {
                this.ctx.reconnectMqtt().catch(err => {
                    utils.error("Health check reconnection failed:", err.message);
                });
            }
        }
    }
    
    /**
     * Send a keep-alive ping through MQTT connection
     * This keeps the MQTT WebSocket connection active
     */
    async sendMqttPing() {
        try {
            // Check if MQTT client exists and is connected
            if (!this.ctx.mqttClient || !this.ctx.mqttClient.connected) {
                // Don't count as failure if client is not initialized yet
                if (this.mqttPingCount > 0) {
                    this.mqttPingFailures++;
                    if (this.globalOptions.logging !== false) {
                        utils.log(`⚠️  MQTT ping skipped: Client not connected (${this.mqttPingFailures} failures)`);
                    }
                    
                    // Trigger reconnection if too many failures
                    if (this.mqttPingFailures >= 5 && this.ctx.reconnectMqtt) {
                        utils.log(`🔄 Attempting MQTT reconnection after ${this.mqttPingFailures} ping failures...`);
                        this.mqttPingFailures = 0;
                        try {
                            await this.ctx.reconnectMqtt();
                        } catch (reconnErr) {
                            utils.error("Failed to reconnect MQTT:", reconnErr.message);
                        }
                    }
                }
                return;
            }
            
            // Send a presence update to keep MQTT alive
            const presencePayload = {
                "make_user_available_at_ms": Date.now(),
                "last_active_at_ms": Date.now()
            };
            
            await this.ctx.mqttClient.publish(
                '/orca_presence',
                JSON.stringify({ p: presencePayload }),
                { qos: 0, retain: false }
            );
            
            this.mqttPingCount++;
            this.lastMqttPing = Date.now();
            this.mqttPingFailures = 0; // Reset failures on success
            
            // Log only every 10th ping to avoid spam (every 5 minutes)
            if (this.mqttPingCount % 10 === 0 && this.globalOptions.logging !== false) {
                const minutesUp = Math.floor((Date.now() - this.lastRefresh) / 60000);
                utils.log(`💚 MQTT Keep-Alive: ${this.mqttPingCount} pings sent | Uptime: ${minutesUp}min`);
            }
            
        } catch (error) {
            this.mqttPingFailures++;
            
            if (this.globalOptions.logging !== false && this.mqttPingFailures % 5 === 0) {
                utils.log(`⚠️  MQTT ping failed (${this.mqttPingFailures} failures): ${error.message}`);
            }
            
            // If too many failures, trigger reconnection
            if (this.mqttPingFailures >= 10 && this.ctx.reconnectMqtt) {
                utils.log(`🔄 Triggering MQTT reconnection after ${this.mqttPingFailures} failures...`);
                this.mqttPingFailures = 0;
                try {
                    await this.ctx.reconnectMqtt();
                } catch (reconnErr) {
                    utils.error("Failed to reconnect MQTT:", reconnErr.message);
                }
            }
        }
    }
    
    /**
     * Refresh cookies by making a keep-alive request to Facebook
     * Gets fresh cookies to maintain session and keep bot online
     */
    async refreshCookies() {
        if (this.isRefreshing) {
            return; // Prevent concurrent refreshes
        }
        
        this.isRefreshing = true;
        
        try {
            const now = Date.now();
            const timeSinceLastRefresh = now - this.lastRefresh;
            
            // Make requests to refresh cookies and get fresh session data
            // Use multiple endpoints to ensure comprehensive cookie refresh
            const endpoints = [
                'https://www.facebook.com/',
                'https://www.facebook.com/ajax/bz',
                'https://www.facebook.com/ajax/webstorage/process_keys/?state=0',
                'https://www.facebook.com/home.php'
            ];
            
            // Rotate through endpoints to avoid pattern detection
            const endpoint = endpoints[this.refreshCount % endpoints.length];
            
            utils.log(`🔄 Refreshing cookies from ${endpoint.split('/')[3] || 'home'}...`);
            
            const response = await this.defaultFuncs.get(
                endpoint,
                this.ctx.jar,
                null,
                this.ctx,
                { noRef: true }
            );
            
            let cookiesUpdated = 0;
            let tokensUpdated = false;
            
            // Update cookies from response - critical for maintaining session
            if (response && response.headers && response.headers['set-cookie']) {
                const cookies = response.headers['set-cookie'];
                cookies.forEach(cookie => {
                    if (cookie.indexOf('.facebook.com') > -1) {
                        this.ctx.jar.setCookie(cookie, 'https://www.facebook.com');
                        cookiesUpdated++;
                    }
                    const messengerCookie = cookie.replace(/domain=\.facebook\.com/, 'domain=.messenger.com');
                    this.ctx.jar.setCookie(messengerCookie, 'https://www.messenger.com');
                });
            }
            
            // Update tokens if present in response - ensures valid authentication
            if (response && response.body) {
                const bodyStr = typeof response.body === 'string' ? response.body : JSON.stringify(response.body);
                
                // Try to extract DTSG token
                const dtsgMatch = bodyStr.match(/"DTSGInitialData".*?"token":"([^"]+)"/);
                if (dtsgMatch && dtsgMatch[1]) {
                    this.ctx.fb_dtsg = dtsgMatch[1];
                    tokensUpdated = true;
                }
                
                // Also try alternate DTSG pattern
                if (!tokensUpdated) {
                    const altDtsgMatch = bodyStr.match(/DTSGInitialData"[^}]*"token":"([^"]+)"/);
                    if (altDtsgMatch && altDtsgMatch[1]) {
                        this.ctx.fb_dtsg = altDtsgMatch[1];
                        tokensUpdated = true;
                    }
                }
            }
            
            this.refreshCount++;
            this.lastRefresh = now;
            this.failureCount = 0; // Reset failure count on success
            
            // Log every refresh since it's every 20 minutes
            if (this.globalOptions.logging !== false) {
                const minutesAgo = Math.floor(timeSinceLastRefresh / 60000);
                utils.log(`✅ Cookie refresh #${this.refreshCount} completed`);
                utils.log(`   • Cookies updated: ${cookiesUpdated}`);
                utils.log(`   • Tokens updated: ${tokensUpdated ? 'Yes' : 'No'}`);
                utils.log(`   • Time since last: ${minutesAgo > 0 ? minutesAgo + 'min' : Math.floor(timeSinceLastRefresh / 1000) + 's'} ago`);
                utils.log(`   • Next refresh in: 20 minutes`);
            }
            
        } catch (error) {
            this.failureCount++;
            
            if (this.globalOptions.logging !== false) {
                utils.log(`⚠️  Cookie refresh failed (attempt ${this.failureCount}): ${error.message}`);
            }
            
            // If we have too many failures, something might be wrong
            if (this.failureCount >= 5) {
                utils.log(`❌ Cookie refresh failed ${this.failureCount} times. Check your connection or session validity.`);
            }
        } finally {
            this.isRefreshing = false;
        }
    }
    
    /**
     * Get refresh and MQTT keep-alive statistics
     */
    getStats() {
        return {
            enabled: !!this.refreshTimer,
            refreshCount: this.refreshCount,
            failureCount: this.failureCount,
            lastRefresh: new Date(this.lastRefresh).toISOString(),
            timeSinceLastRefresh: Date.now() - this.lastRefresh,
            refreshInterval: this.refreshInterval,
            // MQTT keep-alive stats
            mqttKeepAlive: {
                enabled: !!this.mqttPingTimer,
                pingCount: this.mqttPingCount,
                pingFailures: this.mqttPingFailures,
                lastPing: new Date(this.lastMqttPing).toISOString(),
                timeSinceLastPing: Date.now() - this.lastMqttPing,
                pingInterval: this.mqttPingInterval
            }
        };
    }
    
    /**
     * Update refresh interval (in milliseconds)
     */
    setRefreshInterval(intervalMs) {
        if (intervalMs < 60000) {
            utils.log('⚠️  Minimum refresh interval is 1 minute (60000ms)');
            return;
        }
        
        this.refreshInterval = intervalMs;
        
        // Restart with new interval if already running
        if (this.refreshTimer) {
            this.stop();
            this.start();
        }
        
        const minutes = Math.floor(intervalMs / 60000);
        utils.log(`⏱️  Cookie refresh interval updated to ${minutes} minute${minutes > 1 ? 's' : ''}`);
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
            this.api.sendMessage = async (message, threadID, replyToMessage, isSingleUser) => {
                return this.applyProtection(async () => {
                    return originalSendMessage.call(this.api, message, threadID, replyToMessage, isSingleUser);
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
 * @param {boolean} [options.cookieRefresh=true] Enable automatic cookie refresh and MQTT keep-alive to maintain bot online status.
 * @param {number} [options.cookieRefreshInterval=1200000] Cookie refresh interval in milliseconds (default: 20 minutes).
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
        // Cookie refresh options
        cookieRefresh: options.cookieRefresh !== false, // Default: true (auto-refresh cookies)
        cookieRefreshInterval: options.cookieRefreshInterval || 1200000, // Default: 20 minutes (20 * 60 * 1000)
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
            
            // Store references
            api = loginApi;
            _ctx = loginApi.ctx;
            _defaultFuncs = loginApi.defaultFuncs;
            
            // Initialize Cookie Refresh Manager
            const cookieRefreshEnabled = options.cookieRefresh !== false; // Default: true
            const cookieRefreshInterval = options.cookieRefreshInterval || 1200000; // Default: 20 minutes
            let cookieRefreshManager = null;
            
            if (cookieRefreshEnabled) {
                cookieRefreshManager = new CookieRefreshManager(_ctx, _defaultFuncs, globalOptions);
                
                // Start cookie refresh
                cookieRefreshManager.start();
                
                // Add methods to API
                loginApi.getCookieRefreshStats = () => cookieRefreshManager.getStats();
                loginApi.stopCookieRefresh = () => cookieRefreshManager.stop();
                loginApi.startCookieRefresh = () => cookieRefreshManager.start();
                loginApi.setCookieRefreshInterval = (intervalMs) => cookieRefreshManager.setRefreshInterval(intervalMs);
                
                // Log cookie refresh info
                if (options.logging !== false) {
                    const minutes = Math.floor(cookieRefreshInterval / 60000);
                    utils.log("🔄 Keep-Alive System: ENABLED");
                    utils.log(`   • Cookie refresh: Every ${minutes} minute${minutes > 1 ? 's' : ''}`);
                    utils.log(`   • MQTT keep-alive: Every 30 seconds`);
                    utils.log(`   • First cookie refresh: in 30 seconds`);
                    utils.log(`   • First MQTT ping: in 5 seconds`);
                }
            }
            
            // Wrap API with enhanced protection
            if (advancedProtection) {
                const enhancedApi = new EnhancedAPI(loginApi, true);
                
                // Add getProtectionStats method
                loginApi.getProtectionStats = () => {
                    const protectionStats = enhancedApi.getProtectionStats();
                    const cookieStats = cookieRefreshManager ? cookieRefreshManager.getStats() : { enabled: false };
                    
                    return {
                        ...protectionStats,
                        cookieRefresh: cookieStats
                    };
                };
                
                // Log protection info
                if (options.logging !== false) {
                    const stats = enhancedApi.getProtectionStats();
                    utils.log("✅ Protection initialized");
                    utils.log(`   Session ID: ${stats.sessionID}`);
                    utils.log(`   Device ID: ${stats.deviceID}`);
                }
            }
            
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
