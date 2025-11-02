"use strict";

const utils = require('../../../utils');
const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

const ACTIONS = [
    'https://www.facebook.com/',
    'https://www.facebook.com/me',
    'https://www.facebook.com/notifications',
    'https://www.facebook.com/messages',
    'https://www.facebook.com/groups',
    'https://www.facebook.com/watch',
    'https://www.facebook.com/marketplace'
];

// Session validation state
const sessionState = {
    lastValidation: 0,
    validationInterval: 5 * 60 * 1000, // Validate every 5 minutes
    failureCount: 0,
    maxFailures: 3,
    isValid: true
};

const facebookHeaders = {
    'authority': 'www.facebook.com',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9',
    'cache-control': 'max-age=0',
    'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'viewport-width': '1920',
    'referer': 'https://www.facebook.com/',
    'dnt': '1'
};

/**
 * Validates if the session cookies are still valid
 * @param {Object} jar - Cookie jar to validate
 * @returns {boolean} True if session appears valid
 */
function validateCookies(jar) {
    try {
        if (!jar) return false;
        
        let cookies = [];
        
        if (typeof jar.getCookiesSync === 'function') {
            try {
                cookies = jar.getCookiesSync('https://www.facebook.com');
            } catch (e) {
                cookies = jar.getCookiesSync('http://www.facebook.com');
            }
        }
        
        // Check for essential cookies
        const cookieNames = cookies.map(c => c.key || c.name);
        const hasEssentialCookies = cookieNames.includes('c_user') && 
                                   (cookieNames.includes('xs') || cookieNames.includes('datr'));
        
        if (!hasEssentialCookies) {
            utils.warn('[PRESENCE] ⚠️  Missing essential cookies (c_user or xs). Session may be invalid.');
            return false;
        }
        
        // Check if cookies are expired
        const now = Date.now();
        const hasExpiredCookies = cookies.some(cookie => {
            if (cookie.expires && cookie.expires !== 'Infinity') {
                const expiryTime = new Date(cookie.expires).getTime();
                return expiryTime <= now;
            }
            return false;
        });
        
        if (hasExpiredCookies) {
            utils.warn('[PRESENCE] ⚠️  Some cookies have expired. Session may need refresh.');
            return false;
        }
        
        return true;
    } catch (error) {
        utils.error('[PRESENCE] Cookie validation error:', error.message);
        return false;
    }
}

/**
 * Validates the session by making a simple request to Facebook
 * @param {Object} session - Axios session to validate
 * @returns {Promise<boolean>} True if session is valid
 */
async function validateSession(session) {
    try {
        const now = Date.now();
        
        // Only validate if enough time has passed
        if (now - sessionState.lastValidation < sessionState.validationInterval) {
            return sessionState.isValid;
        }
        
        sessionState.lastValidation = now;
        
        const response = await session.get('https://www.facebook.com/', {
            timeout: 15000,
            validateStatus: (status) => status < 500
        });
        
        // Check if redirected to login page
        if (response.request?.path?.includes('/login') || 
            response.data?.includes('login_form') ||
            response.status === 401 || 
            response.status === 403) {
            
            sessionState.failureCount++;
            sessionState.isValid = false;
            
            utils.warn(`[PRESENCE] ⚠️  Session validation failed (${sessionState.failureCount}/${sessionState.maxFailures})`);
            
            if (sessionState.failureCount >= sessionState.maxFailures) {
                utils.error('[PRESENCE] ❌ Session is no longer valid. Account may be logged out.');
            }
            
            return false;
        }
        
        // Session is valid, reset failure count
        sessionState.failureCount = 0;
        sessionState.isValid = true;
        
        return true;
    } catch (error) {
        sessionState.failureCount++;
        sessionState.isValid = false;
        
        utils.error('[PRESENCE] Session validation error:', error.message);
        return false;
    }
}

function createSession(jar) {
    try {
        if (!jar) {
            throw new Error('Cookie jar is required');
        }
        
        // Validate cookies before creating session
        if (!validateCookies(jar)) {
            utils.warn('[PRESENCE] Cookie validation failed. Session may not work properly.');
            // Continue anyway, but session might fail
        }

        const cookieJar = new CookieJar();
        let cookies = [];

        if (typeof jar.getCookiesSync === 'function') {
            try {
                cookies = jar.getCookiesSync('https://www.facebook.com');
            } catch (e) {
                cookies = jar.getCookiesSync('http://www.facebook.com');
            }
        } else if (typeof jar.getCookies === 'function') {
            cookies = jar.getCookies('https://www.facebook.com');
        }

        if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
            if (jar.store && jar.store.idx && jar.store.idx['facebook.com']) {
                const fbDomain = jar.store.idx['facebook.com'];
                for (const path in fbDomain) {
                    for (const cookieName in fbDomain[path]) {
                        const cookie = fbDomain[path][cookieName];
                        cookies.push(cookie);
                    }
                }
            }
        }

        if (!cookies || cookies.length === 0) {
            utils.error('[PRESENCE] No cookies found in jar.');
            return null;
        }

        cookies.forEach(cookie => {
            try {
                let cookieStr;
                if (cookie.key && cookie.value) {
                    cookieStr = `${cookie.key}=${cookie.value}`;
                } else if (cookie.toString) {
                    cookieStr = cookie.toString();
                } else {
                    return;
                }
                cookieJar.setCookieSync(cookieStr, 'https://www.facebook.com');
            } catch (err) {
                utils.error('[PRESENCE] Error setting cookie:', err.message);
            }
        });

        return wrapper(axios.create({
            jar: cookieJar,
            withCredentials: true,
            headers: facebookHeaders,
            timeout: 30000,
            maxRedirects: 5
        }));
    } catch (error) {
        utils.error('[PRESENCE] Session creation failed:', error.message);
        return null;
    }
}

async function simulateHumanActivity(session) {
    if (!session) return false;

    try {
        // Validate session first
        const isValid = await validateSession(session);
        if (!isValid) {
            utils.warn('[PRESENCE] Session validation failed. Skipping human activity simulation.');
            return false;
        }
        
        const actions = [...ACTIONS];
        const shuffleActions = () => actions.sort(() => Math.random() - 0.5);
        
        const randomActions = shuffleActions().slice(0, 2 + Math.floor(Math.random() * 3));
        
        for (const action of randomActions) {
            const delay = 3000 + Math.random() * 7000;
            await new Promise(resolve => setTimeout(resolve, delay));
            
            try {
                const response = await session.get(action, {
                    headers: {
                        ...facebookHeaders,
                        'referer': 'https://www.facebook.com/'
                    },
                    validateStatus: (status) => status < 500
                });

                // Check for authentication issues
                if (response.status === 401 || response.status === 403) {
                    utils.error('[PRESENCE] ❌ Authentication failed. Session expired or account logged out.');
                    sessionState.isValid = false;
                    return false;
                }

                if (response.status === 200) {
                    console.log(`[PRESENCE] ✓ Activity: ${action}`);
                    
                    if (Math.random() > 0.7) {
                        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 5000));
                        await session.get('https://www.facebook.com/', {
                            headers: {
                                ...facebookHeaders,
                                'referer': action
                            }
                        });
                        console.log('[PRESENCE] ✓ Swiping action completed');
                    }
                }
            } catch (err) {
                // Check if it's a network error or authentication error
                if (err.response?.status === 401 || err.response?.status === 403) {
                    utils.error('[PRESENCE] ❌ Authentication error:', err.message);
                    sessionState.isValid = false;
                    return false;
                }
                console.error(`[PRESENCE] ⚠️  Failed to access ${action}:`, err.message);
            }
        }
        
        return true;
    } catch (error) {
        console.error(`[PRESENCE] Activity simulation error:`, error.message);
        return false;
    }
}

module.exports = function (defaultFuncs, api, ctx) {
    return function startOnlinePresence(intervalTime = 30000) {
        let stopped = false;
        let mainInterval = null;
        let mqttPingInterval = null;

        setTimeout(() => {
            const session = createSession(ctx.jar);
            
            if (!session) {
                console.log('[PRESENCE] ⚠️  Cookie jar not ready, skipping HTTP simulation');
            }

            console.log('[PRESENCE] 🟢 Starting enhanced online presence system...');
            console.log(`[PRESENCE] HTTP Activity: Every ${intervalTime / 1000} seconds`);
            console.log('[PRESENCE] MQTT Keep-Alive: Every 20 seconds');
            console.log('[PRESENCE] ┌────────────────────────────────────────────┐');
            console.log('[PRESENCE] │ Credits: Jonell Huthin Magallanes         │');
            console.log('[PRESENCE] │ Enhanced with MQTT Keep-Alive             │');
            console.log('[PRESENCE] └────────────────────────────────────────────┘');

            const sendMqttPresence = async () => {
                if (stopped) return;
                
                try {
                    if (ctx.mqttClient && ctx.mqttClient.connected) {
                        const presencePayload = {
                            "make_user_available_at_ms": Date.now(),
                            "last_active_at_ms": Date.now()
                        };
                        
                        await new Promise((resolve, reject) => {
                            ctx.mqttClient.publish(
                                '/orca_presence',
                                JSON.stringify({ p: presencePayload }),
                                { qos: 1, retain: false },
                                (err) => {
                                    if (err) {
                                        console.error('[PRESENCE] MQTT ping failed:', err.message);
                                        reject(err);
                                    } else {
                                        console.log('[PRESENCE] ✓ MQTT presence update sent');
                                        resolve();
                                    }
                                }
                            );
                        });
                    } else {
                        console.log('[PRESENCE] ⚠️  MQTT client not connected, skipping ping');
                    }
                } catch (err) {
                    console.error('[PRESENCE] MQTT presence error:', err.message);
                }
            };

            const runPresenceCheck = async () => {
                if (stopped) return;
                
                try {
                    if (session) {
                        await simulateHumanActivity(session);
                        console.log('[PRESENCE] ✓ HTTP activity simulation completed');
                    }
                    
                    await sendMqttPresence();
                } catch (err) {
                    console.error('[PRESENCE] Presence check failed:', err.message);
                }
            };

            mqttPingInterval = setInterval(() => {
                if (stopped) {
                    clearInterval(mqttPingInterval);
                    return;
                }
                sendMqttPresence();
            }, 20000);

            runPresenceCheck();

            mainInterval = setInterval(() => {
                if (stopped) {
                    clearInterval(mainInterval);
                    return;
                }
                runPresenceCheck();
            }, intervalTime);

        }, 3000);

        return {
            stop: () => {
                stopped = true;
                if (mainInterval) {
                    clearInterval(mainInterval);
                }
                if (mqttPingInterval) {
                    clearInterval(mqttPingInterval);
                }
                console.log('[PRESENCE] 🔴 Online presence stopped');
            }
        };
    };
};
