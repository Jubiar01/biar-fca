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

const getRandomAction = () => ACTIONS[Math.floor(Math.random() * ACTIONS.length)];

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

function createSession(jar) {
    try {
        if (!jar) {
            throw new Error('Cookie jar is required');
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
                utils.error('Error setting cookie:', err.message);
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
        utils.error('Session creation failed:', error.message);
        return null;
    }
}

async function simulateHumanActivity(session) {
    if (!session) return false;

    try {
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
                    }
                });

                if (response.status === 200) {
                    utils.log(`Activity: ${action}`);
                    
                    if (Math.random() > 0.7) {
                        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 5000));
                        await session.get('https://www.facebook.com/', {
                            headers: {
                                ...facebookHeaders,
                                'referer': action
                            }
                        });
                        utils.log('Swiping action completed');
                    }
                }
            } catch (err) {
                utils.error(`Failed to access ${action}:`, err.message);
            }
        }
        
        return true;
    } catch (error) {
        utils.error(`Activity simulation error:`, error.message);
        return false;
    }
}

async function simulateOnlineUser(session) {
    if (!session) return false;

    try {
        const response = await session.get('https://www.facebook.com/', {
            headers: {
                ...facebookHeaders,
                'referer': 'https://www.facebook.com/'
            },
            validateStatus: () => true
        });
        
        return response.status === 200;
    } catch (error) {
        return false;
    }
}

module.exports = function (defaultFuncs, api, ctx) {
    return function startOnlinePresence(duration = 30000) {
        setTimeout(() => {
            const session = createSession(ctx.jar);
            
            if (!session) {
                utils.log('⚠️  Online presence: Cookie jar not ready, skipping simulation');
                return;
            }

            utils.log('Starting human-like online presence simulation...');
            utils.log(`Duration: ${duration / 1000} seconds`);
            utils.log('┌────────────────────────────────────────────┐');
            utils.log('│ Credits: Jonell Huthin Magallanes         │');
            utils.log('└────────────────────────────────────────────┘');
            
            let activityCount = 0;
            let stopped = false;
            
            const interval = setInterval(async () => {
                if (stopped) return;
                
                await simulateHumanActivity(session);
                activityCount++;
                
                if (activityCount % 3 === 0) {
                    await simulateOnlineUser(session);
                }
            }, 60000 + Math.random() * 90000);

            const onlineInterval = setInterval(async () => {
                if (stopped) return;
                await simulateOnlineUser(session);
            }, 300000 + Math.random() * 300000);

            const durationTimeout = setTimeout(() => {
                stopped = true;
                clearInterval(interval);
                clearInterval(onlineInterval);
                utils.log('Online presence duration completed');
            }, duration);

            simulateHumanActivity(session).catch(err => {
                utils.error('Initial activity simulation failed:', err.message);
            });
            
            simulateOnlineUser(session).catch(err => {
                utils.error('Initial online user simulation failed:', err.message);
            });

            this._intervals = { interval, onlineInterval, durationTimeout };
        }, 3000);

        return {
            stop: () => {
                if (this._intervals) {
                    clearInterval(this._intervals.interval);
                    clearInterval(this._intervals.onlineInterval);
                    clearTimeout(this._intervals.durationTimeout);
                    utils.log('Online presence stopped');
                }
            },
            _intervals: null
        };
    };
};
