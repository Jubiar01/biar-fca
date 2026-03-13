"use strict";

/**
 * Anti-Detection Utilities for Facebook Bot
 * Helps avoid account bans by making bot behavior more human-like
 */

/**
 * Generate realistic random delays
 * @param {number} min - Minimum delay in ms
 * @param {number} max - Maximum delay in ms
 * @returns {Promise} Resolves after delay
 */
function randomDelay(min = 50, max = 200) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Simulate typing for a realistic duration based on message length
 * @param {string} _message - The message to be sent
 * @returns {number} Delay in milliseconds
 */
function calculateTypingTime(_message) {
    return 0; // Disabled for responsiveness
}

/**
 * Simulate human reading time before responding
 * @param {string} _receivedMessage - The message received
 * @returns {number} Delay in milliseconds
 */
function calculateReadingTime(_receivedMessage) {
    return 0; // Disabled for responsiveness
}

/**
 * Rate limiter - Passive mode (logging only)
 */
class RateLimiter {
    constructor() {
        this.messageCount = 0;
    }
    
    /**
     * Check if we can send a message
     * @returns {boolean}
     */
    canSendMessage() {
        return true; // Always allow
    }
    
    /**
     * Record a message being sent
     */
    recordMessage() {
        this.messageCount++;
    }
    
    /**
     * Get suggested delay before next message
     * @returns {number} Delay in ms
     */
    getSuggestedDelay() {
        return 0;
    }
}

/**
 * User agent rotation for less predictable behavior
 */
const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15"
];

/**
 * Get a random user agent
 * @returns {string}
 */
function getRandomUserAgent() {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

/**
 * Behavior tracker to detect patterns (Passive)
 */
class BehaviorTracker {
    constructor() {
        this.lastMessages = new Map();
    }
    
    looksLikeSpam(_threadID, _message) {
        return false;
    }
    
    recordMessage(_threadID, _message) {
        // No-op
    }
    
    cleanup() {
        // No-op
    }
}

/**
 * Activity scheduler - Always Active
 */
class ActivityScheduler {
    constructor(_options = {}) {
        this.enabled = false;
    }
    
    isSleepTime() {
        return false;
    }
    
    getTimeMultiplier() {
        return 1.0;
    }
    
    shouldRespond() {
        return true;
    }
}

/**
 * Multi-message handler - Immediate processing
 */
class MultiMessageHandler {
    addMessage(threadID, message, callback) {
        callback([message]);
    }
}

/**
 * Typo simulator - occasionally add realistic typos
 */
class TypoSimulator {
    constructor(frequency = 0.05) {
        this.frequency = frequency;
    }
    
    addTypo(message) {
        return message; // Disabled to ensure command accuracy
    }
}

/**
 * Cooldown manager - Disabled
 */
class CooldownManager {
    constructor() {}
    
    recordMessage() {}
    
    startCooldown() {}
    
    endCooldown() {}
    
    onCooldown() {
        return false;
    }
    
    timeRemaining() {
        return 0;
    }
}

// Export utilities
module.exports = {
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
};

