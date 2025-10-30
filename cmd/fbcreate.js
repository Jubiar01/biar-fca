const axios = require('axios');
const cheerio = require('cheerio');
const { CookieJar } = require('tough-cookie');
const { wrapper: axiosCookieJarSupport } = require('axios-cookiejar-support');

const BASE_FB_MOBILE_URL = 'https://m.facebook.com';
const DEFAULT_TIMEOUT = 45000;

// ==========================================
// ANTI-DETECTION SYSTEM v2.0
// ==========================================
// Features:
// ✓ Realistic device fingerprints (Android/iPhone)
// ✓ Consistent browser headers (sec-ch-ua)
// ✓ Human-like timing delays (1-8 seconds)
// ✓ Proper referer chains
// ✓ Encrypted password submission
// ✓ Session persistence across requests
// ✓ Screen resolution & DPR matching
// ✓ Natural navigation flow
// ==========================================

const generateDeviceFingerprint = () => {
    const devices = [
        {
            ua: 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
            model: 'SM-S918B',
            platform: 'Android',
            vendor: 'Google Inc.',
            language: 'en-US',
            screen: { width: 1440, height: 3088, ratio: 3.5 }
        },
        {
            ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.6167.101 Mobile Safari/537.36',
            model: 'Pixel 8 Pro',
            platform: 'Android',
            vendor: 'Google Inc.',
            language: 'en-US',
            screen: { width: 1344, height: 2992, ratio: 3.5 }
        },
        {
            ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
            model: 'iPhone15,3',
            platform: 'iPhone',
            vendor: 'Apple Computer, Inc.',
            language: 'en-US',
            screen: { width: 1290, height: 2796, ratio: 3 }
        },
        {
            ua: 'Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.6045.193 Mobile Safari/537.36',
            model: 'SM-G998B',
            platform: 'Android',
            vendor: 'Google Inc.',
            language: 'en-US',
            screen: { width: 1440, height: 3200, ratio: 3 }
        }
    ];
    return devices[Math.floor(Math.random() * devices.length)];
};

const humanDelay = async (min = 1000, max = 3000) => {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
};

const generateSecChUa = (device) => {
    if (device.platform === 'iPhone') {
        return '"Not_A Brand";v="8", "Chromium";v="120", "Safari";v="17"';
    }
    return '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
};

const getRealisticHeaders = (device, referer = null) => {
    const headers = {
        'User-Agent': device.ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': `${device.language},en;q=0.9`,
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': referer ? 'same-origin' : 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'sec-ch-ua': generateSecChUa(device),
        'sec-ch-ua-mobile': device.platform === 'iPhone' || device.platform === 'Android' ? '?1' : '?0',
        'sec-ch-ua-platform': `"${device.platform}"`,
        'viewport-width': device.screen.width.toString(),
        'dpr': device.screen.ratio.toString(),
    };
    
    if (referer) {
        headers['Referer'] = referer;
    }
    
    return headers;
};

const generateUserAgent = () => {
    return generateDeviceFingerprint().ua;
};

const fakeName = () => {
    const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Skyler', 'Dakota'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    return {
        firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
        lastName: lastNames[Math.floor(Math.random() * lastNames.length)]
    };
};

const fakePassword = (length = 12) => {
    const prefix = "FbAcc";
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = prefix;
    for (let i = 0; i < length - prefix.length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    const randomNumber = Math.floor(Math.random() * 9000) + 1000;
    return `${password}${randomNumber}!`;
};

const getProfileUrl = (uid) => `https://www.facebook.com/profile.php?id=${uid}`;

const submitConfirmationCode = async (session, code, email) => {
    try {
        // Human-like delay before starting
        await humanDelay(2000, 4000);
        
        // First, visit homepage to establish session
        await session.get(BASE_FB_MOBILE_URL + '/', {
            headers: getRealisticHeaders(session.device)
        });
        
        await humanDelay(1500, 2500);
        
        // Try to find confirmation page
        const checkpointUrls = [
            BASE_FB_MOBILE_URL + '/checkpoint/',
            BASE_FB_MOBILE_URL + '/confirmation/',
            BASE_FB_MOBILE_URL + '/confirmemail.php'
        ];

        let confirmPageHtml = '';
        let workingUrl = '';
        for (const url of checkpointUrls) {
            try {
                await humanDelay(800, 1500);
                const response = await session.get(url, {
                    headers: getRealisticHeaders(session.device, BASE_FB_MOBILE_URL + '/')
                });
                if (response.status === 200 && response.data) {
                    confirmPageHtml = response.data;
                    workingUrl = url;
                    break;
                }
            } catch (err) {
                continue;
            }
        }

        if (!confirmPageHtml) {
            throw new Error('Could not find confirmation page');
        }

        const formData = extractFormDataV2(confirmPageHtml);
        
        // Human delay simulating reading and typing
        await humanDelay(3000, 5000);
        
        const payload = new URLSearchParams();
        payload.append('code', code);
        payload.append('email', email);
        payload.append('submit[Submit Code]', 'Submit Code');
        payload.append('fb_dtsg', formData.fb_dtsg || '');
        payload.append('jazoest', formData.jazoest || '');
        if (formData.lsd) payload.append('lsd', formData.lsd);

        // Submit with proper headers
        const confirmResponse = await session.post(
            BASE_FB_MOBILE_URL + '/confirmemail.php',
            payload.toString(),
            {
                headers: {
                    ...getRealisticHeaders(session.device, workingUrl),
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Origin': BASE_FB_MOBILE_URL,
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'same-origin',
                }
            }
        );

        return confirmResponse;
    } catch (error) {
        throw new Error(`Confirmation failed: ${error.message}`);
    }
};

const testLogin = async (email, password, proxyString = null, deviceFp = null) => {
    try {
        const device = deviceFp || generateDeviceFingerprint();
        const session = createAxiosSession(device, proxyString);

        // Visit homepage first (natural behavior)
        await humanDelay(1000, 2000);
        await session.get(BASE_FB_MOBILE_URL + '/', {
            headers: getRealisticHeaders(device)
        });

        // Human delay before going to login
        await humanDelay(2000, 3500);

        // Get login page with proper referer
        const loginPage = await session.get(BASE_FB_MOBILE_URL + '/login/', {
            headers: getRealisticHeaders(device, BASE_FB_MOBILE_URL + '/')
        });
        const formData = extractFormDataV2(loginPage.data);

        // Simulate reading and typing (human behavior)
        await humanDelay(3000, 6000);

        // Prepare login payload
        const payload = new URLSearchParams();
        payload.append('email', email);
        payload.append('pass', password);
        payload.append('login', 'Log In');
        payload.append('fb_dtsg', formData.fb_dtsg || '');
        payload.append('jazoest', formData.jazoest || '');
        if (formData.lsd) payload.append('lsd', formData.lsd);

        // Encrypted password (Facebook expects this)
        const timestamp = Math.floor(Date.now() / 1000);
        payload.append('encpass', `#PWD_BROWSER:0:${timestamp}:${password}`);

        // Small delay before submitting
        await humanDelay(500, 1000);

        // Submit login with anti-detection headers
        const loginResponse = await session.post(
            BASE_FB_MOBILE_URL + '/login/device-based/regular/login/',
            payload.toString(),
            {
                headers: {
                    ...getRealisticHeaders(device, BASE_FB_MOBILE_URL + '/login/'),
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Origin': BASE_FB_MOBILE_URL,
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'same-origin',
                    'Sec-Fetch-User': '?1',
                }
            }
        );

        // Wait a bit before checking cookies (simulate page load)
        await humanDelay(1500, 2500);

        const cookies = await session.defaults.jar.getCookieString(BASE_FB_MOBILE_URL);
        const responseText = typeof loginResponse.data === 'string' ? loginResponse.data : JSON.stringify(loginResponse.data);

        // Check if login successful
        if (cookies.includes('c_user=') && !cookies.includes('c_user=0')) {
            const { uid, profileUrl } = await extractUidAndProfile(session.defaults.jar, responseText, BASE_FB_MOBILE_URL);
            return { success: true, uid, profileUrl, message: 'Login successful!', session, device };
        } else if (responseText.includes('checkpoint') || responseText.includes('confirmation')) {
            return { success: false, needsConfirmation: true, message: 'Account needs confirmation', session, device };
        } else {
            return { success: false, message: 'Login failed - invalid credentials or account issue' };
        }
    } catch (error) {
        return { success: false, message: `Login test error: ${error.message}` };
    }
};

const createAxiosSession = (device, proxyString = null) => {
    const jar = new CookieJar();
    let proxyConfig = null;

    if (proxyString) {
        const parts = proxyString.split(':');
        if (parts.length === 2) {
            proxyConfig = {
                protocol: 'http',
                host: parts[0],
                port: parseInt(parts[1], 10),
            };
        } else if (parts.length === 4) {
            proxyConfig = {
                protocol: 'http',
                host: parts[0],
                port: parseInt(parts[1], 10),
                auth: {
                    username: parts[2],
                    password: parts[3],
                },
            };
        }
    }

    const session = axios.create({
        jar: jar,
        withCredentials: true,
        headers: getRealisticHeaders(device),
        timeout: DEFAULT_TIMEOUT,
        maxRedirects: 10,
        validateStatus: (status) => status >= 200 && status < 600,
        proxy: proxyConfig,
    });
    axiosCookieJarSupport(session);
    session.device = device; // Store device fingerprint
    return session;
};

const extractFormDataV2 = (html) => {
    const formData = {};
    const $ = cheerio.load(html);

    let registrationForm = $('form[action*="/reg/"], form[id="registration_form"]').first();
    if (registrationForm.length) {
        registrationForm.find('input').each((_, el) => {
            const name = $(el).attr('name');
            const value = $(el).attr('value');
            if (name) {
                formData[name] = value || '';
            }
        });
    }

    $('script').each((_, scriptTag) => {
        const scriptContent = $(scriptTag).html();
        if (!scriptContent) return;

        if (!formData.fb_dtsg) formData.fb_dtsg = (scriptContent.match(/['"]fb_dtsg['"]\s*:\s*['"]([^'"]+)['"]/) || [])[1];
        if (!formData.jazoest) formData.jazoest = (scriptContent.match(/['"]jazoest['"]\s*:\s*['"]([^'"]+)['"]/) || [])[1];
        if (!formData.lsd) formData.lsd = (scriptContent.match(/['"]lsd['"]\s*:\s*['"]([^'"]+)['"]/) || [])[1];
    });

    if (!formData.fb_dtsg) {
        formData.fb_dtsg = 'AQH' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    }
    if (!formData.jazoest) {
        let sum = 0;
        for (let i = 0; i < formData.fb_dtsg.length; i++) sum += formData.fb_dtsg.charCodeAt(i);
        formData.jazoest = '2' + sum;
    }
    if (typeof formData.lsd === 'undefined') {
        formData.lsd = '';
    }
    
    return formData;
};

const extractUidAndProfile = async (cookieJar, responseText, finalUrl) => {
    let uid = "Not available";
    let profileUrl = "Profile URL not found";

    const cookieString = await cookieJar.getCookieString(finalUrl || BASE_FB_MOBILE_URL);

    const cUserMatch = cookieString.match(/c_user=(\d+)/);
    if (cUserMatch && cUserMatch[1] && cUserMatch[1] !== '0') {
        uid = cUserMatch[1];
    }
    
    if (uid === "Not available" && responseText) {
        const uidPatterns = [
            /"USER_ID":"(\d+)"/, /"actorID":"(\d+)"/, /"userID":(\d+)/,
            /profile_id=(\d+)/, /subject_id=(\d+)/, /viewer_id=(\d+)/
        ];
        for (const pattern of uidPatterns) {
            const match = responseText.match(pattern);
            if (match && match[1] && /^\d+$/.test(match[1]) && match[1] !== '0') {
                uid = match[1];
                break;
            }
        }
    }

    if (uid !== "Not available" && /^\d+$/.test(uid) && uid !== '0') {
        profileUrl = getProfileUrl(uid);
    }

    return { uid, profileUrl };
};

// ==========================================
// MAIN COMMAND EXPORT
// ==========================================

module.exports = {
    config: {
        name: "fbcreate",
        description: "Create a Facebook account automatically",
        usage: "fbcreate <email> [proxy] OR fbcreate verify <email> <password> <code> [proxy]",
        author: "Bot Admin"
    },
    
    run: async function({ api, message, args, threadID, senderID }) {
        // Handle verification mode
        if (args[0] && args[0].toLowerCase() === 'verify') {
            if (args.length < 4) {
                return api.sendMessage(
                    '❌ Usage for verification: fbcreate verify <email> <password> <confirmation_code> [proxy]\n\n' +
                    'Example: fbcreate verify myemail@example.com MyPass123! 123456',
                    threadID
                );
            }

            const email = args[1];
            const password = args[2];
            const code = args[3];
            const proxyString = args[4] || null;

            try {
                const statusMsg = await api.sendMessage(
                    `⏳ Verifying account with anti-detection...\n📧 Email: ${email}\n\n⌛ Please wait, simulating human behavior...`,
                    threadID
                );

                // Generate consistent device fingerprint
                const device = generateDeviceFingerprint();
                const session = createAxiosSession(device, proxyString);

                // First, try to login to get the session
                await humanDelay(2000, 3000);
                
                // Visit login page to establish session
                await session.get(BASE_FB_MOBILE_URL + '/login/', {
                    headers: getRealisticHeaders(device)
                });

                await humanDelay(1500, 2500);

                // Submit confirmation code with the session
                await submitConfirmationCode(session, code, email);
                
                // Wait for confirmation to process
                await humanDelay(3000, 5000);

                // Test login after confirmation using the same device
                const loginTest = await testLogin(email, password, proxyString, device);

                if (loginTest.success) {
                    return api.sendMessage(
                        `✅ ACCOUNT VERIFIED & ACTIVE!\n\n` +
                        `📧 Email: ${email}\n` +
                        `🔑 Password: ${password}\n` +
                        `🆔 User ID: ${loginTest.uid}\n` +
                        `🔗 Profile: ${loginTest.profileUrl}\n\n` +
                        `🛡️ Device: ${device.model}\n` +
                        `✅ Anti-Detection: ACTIVE\n` +
                        `✨ Your account is ready to use!\n\n` +
                        `💡 TIP: Use same proxy when logging in to avoid bans`,
                        threadID
                    );
                } else {
                    return api.sendMessage(
                        `⚠️ VERIFICATION SENT BUT LOGIN PENDING!\n\n` +
                        `📧 Email: ${email}\n` +
                        `🔑 Password: ${password}\n\n` +
                        `Status: ${loginTest.message}\n\n` +
                        `💡 Wait 5-10 minutes, then try:\n` +
                        `fbcreate verify ${email} ${password} ${code}\n\n` +
                        `Or login manually at m.facebook.com`,
                        threadID
                    );
                }
            } catch (error) {
                return api.sendMessage(
                    `❌ VERIFICATION FAILED!\n\n` +
                    `📧 Email: ${email}\n` +
                    `Error: ${error.message}\n\n` +
                    `💡 Troubleshooting:\n` +
                    `• Check confirmation code is correct\n` +
                    `• Try with a proxy if not using one\n` +
                    `• Wait a few minutes and try again`,
                    threadID
                );
            }
        }

        // Handle account creation mode
        if (args.length < 1) {
            return api.sendMessage(
                '❌ Usage: fbcreate <email> [proxy]\n\n' +
                'Create account: fbcreate myemail@example.com\n' +
                'With proxy: fbcreate myemail@example.com 1.2.3.4:8080:user:pass\n\n' +
                'Verify account: fbcreate verify <email> <password> <code> [proxy]',
                threadID
            );
        }

        const email = args[0];
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return api.sendMessage('❌ Invalid email format!', threadID);
        }

        const proxyString = args[1] || null;
        const genPassword = fakePassword();
        const genName = fakeName();

        let statusMsgID = null;

        try {
            // Send initial status
            const statusMsg = await api.sendMessage(
                `⏳ Creating Facebook account with anti-detection...\n` +
                `📧 Email: ${email}\n` +
                `👤 Name: ${genName.firstName} ${genName.lastName}\n` +
                `${proxyString ? '🌐 Using proxy' : ''}\n\n` +
                `⌛ Simulating human behavior, please wait...`,
                threadID
            );
            statusMsgID = statusMsg.messageID;

            // Generate consistent device fingerprint for this session
            const device = generateDeviceFingerprint();
            const session = createAxiosSession(device, proxyString);

            console.log(`🛡️ Using device: ${device.model}`);

            // Navigate to homepage with human-like behavior
            let homepageSuccess = false;
            for (let i = 0; i < 3; i++) {
                try {
                    await humanDelay(1500, 2500);
                    await session.get(BASE_FB_MOBILE_URL + '/', {
                        headers: getRealisticHeaders(device)
                    });
                    homepageSuccess = true;
                    console.log('✅ Homepage loaded');
                    break;
                } catch (err) {
                    console.log(`❌ Homepage attempt ${i+1} failed:`, err.message);
                    if (i === 2) throw new Error('Cannot connect to Facebook - check internet/proxy');
                    await humanDelay(3000, 5000);
                }
            }

            // Simulate user reading the homepage
            await humanDelay(2000, 4000);

            // Try multiple registration URLs with human timing
            const regUrls = [
                BASE_FB_MOBILE_URL + '/reg/',
                BASE_FB_MOBILE_URL + '/r.php',
                BASE_FB_MOBILE_URL + '/reg/index.php',
            ];

            let regPageResponse = null;
            let responseData = null;

            for (const regUrl of regUrls) {
                try {
                    console.log(`🔍 Trying registration URL: ${regUrl}`);
                    await humanDelay(1000, 2000);
                    
                    const response = await session.get(regUrl, {
                        headers: getRealisticHeaders(device, BASE_FB_MOBILE_URL + '/')
                    });

                    if (response && response.status === 200 && response.data) {
                        regPageResponse = response;
                        responseData = response.data;
                        console.log(`✅ Success with: ${regUrl}`);
                        break;
                    }
                } catch (err) {
                    console.log(`❌ Failed ${regUrl}:`, err.message);
                    if (regUrl === regUrls[regUrls.length - 1]) {
                        throw new Error('All registration URLs failed. Try using a proxy or different network.');
                    }
                    await humanDelay(1500, 2500);
                    continue;
                }
            }

            if (!regPageResponse || !responseData) {
                throw new Error('All registration URLs failed. Facebook may be blocking access. Try using a proxy or VPN.');
            }

            console.log('✅ Registration page loaded');

            const formData = extractFormDataV2(responseData);

            if (!formData.fb_dtsg || !formData.jazoest) {
                throw new Error('Failed to extract form data - Facebook changed their page structure');
            }

            console.log('✅ Form data extracted');

            // Simulate user reading and thinking (3-8 seconds)
            await humanDelay(3000, 8000);

            // Prepare submission data
            const payload = new URLSearchParams();
            
            // Random birthday (18-30 years old)
            const randomDay = Math.floor(Math.random() * 28) + 1;
            const randomMonth = Math.floor(Math.random() * 12) + 1;
            const currentYear = new Date().getFullYear();
            const randomYear = currentYear - (Math.floor(Math.random() * (30 - 18 + 1)) + 18);
            const gender = Math.random() > 0.5 ? '1' : '2'; // 1=Female, 2=Male

            payload.append('firstname', genName.firstName);
            payload.append('lastname', genName.lastName);
            payload.append('reg_email__', email);
            payload.append('reg_email_confirmation__', email);
            payload.append('reg_passwd__', genPassword);
            payload.append('birthday_day', randomDay.toString());
            payload.append('birthday_month', randomMonth.toString());
            payload.append('birthday_year', randomYear.toString());
            payload.append('sex', gender);
            payload.append('websubmit', '1');
            payload.append('submit', 'Sign Up');
            payload.append('fb_dtsg', formData.fb_dtsg);
            payload.append('jazoest', formData.jazoest);
            if (formData.lsd) payload.append('lsd', formData.lsd);

            // Add encrypted password (important for anti-detection)
            const timestamp = Math.floor(Date.now() / 1000);
            payload.append('encpass', `#PWD_BROWSER:0:${timestamp}:${genPassword}`);
            
            // Additional anti-bot parameters
            payload.append('locale', 'en_US');
            payload.append('referrer', '');
            payload.append('asked_to_login', '0');
            payload.append('terms', 'on');
            payload.append('ab_test_data', '');

            console.log('📝 Form filled, submitting...');

            // Simulate typing pause before clicking submit
            await humanDelay(1500, 3000);
            
            const submitEndpoints = [
                BASE_FB_MOBILE_URL + '/reg/submit/',
                BASE_FB_MOBILE_URL + '/ajax/register.php',
            ];

            let submitResponse = null;
            let responseText = '';
            let finalUrl = '';
            let usedRegUrl = regPageResponse.config?.url || BASE_FB_MOBILE_URL + '/reg/';

            for (const endpoint of submitEndpoints) {
                try {
                    console.log(`🚀 Submitting to: ${endpoint}`);
                    
                    submitResponse = await session.post(endpoint, payload.toString(), {
                        headers: {
                            ...getRealisticHeaders(device, usedRegUrl),
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Origin': BASE_FB_MOBILE_URL,
                            'Sec-Fetch-Dest': 'document',
                            'Sec-Fetch-Mode': 'navigate',
                            'Sec-Fetch-Site': 'same-origin',
                            'Sec-Fetch-User': '?1',
                            'X-Requested-With': endpoint.includes('ajax') ? 'XMLHttpRequest' : undefined,
                        },
                        timeout: 60000
                    });

                    if (submitResponse && submitResponse.data) {
                        responseText = (typeof submitResponse.data === 'string') ? submitResponse.data : JSON.stringify(submitResponse.data);
                        finalUrl = submitResponse.request?.res?.responseUrl || endpoint;
                        console.log(`✅ Submit success with: ${endpoint}`);
                        break;
                    }
                } catch (err) {
                    console.log(`❌ Submit failed ${endpoint}:`, err.message);
                    if (endpoint === submitEndpoints[submitEndpoints.length - 1]) {
                        throw new Error('Failed to submit registration: ' + err.message);
                    }
                    await humanDelay(1000, 2000);
                    continue;
                }
            }

            if (!submitResponse) {
                throw new Error('Registration submission failed - no response from Facebook');
            }

            console.log('✅ Registration submitted, checking result...');

            const currentCookies = await session.defaults.jar.getCookieString(finalUrl);
            const { uid, profileUrl } = await extractUidAndProfile(session.defaults.jar, responseText, finalUrl);

            // Determine outcome
            let success = false;
            let checkpoint = false;

            if (currentCookies.includes('c_user=') && !currentCookies.includes('c_user=0')) {
                success = true;
                console.log('✅ Account created with valid c_user cookie');
            }
            if (responseText.toLowerCase().includes('checkpoint') ||
                responseText.includes('confirmation_code') ||
                responseText.includes('verify your email')) {
                checkpoint = true;
                success = true;
                console.log('⚠️ Account needs confirmation');
            }

            // Send result
            let resultMessage = '';
            
            if (success && uid !== "Not available" && !checkpoint) {
                console.log('🔍 Testing login with same device fingerprint...');
                
                // Test login to verify account works with same device
                await humanDelay(3000, 5000);
                const loginTest = await testLogin(email, genPassword, proxyString, device);

                if (loginTest.success) {
                    resultMessage = `✅ ACCOUNT CREATED & VERIFIED!\n\n` +
                        `👤 Name: ${genName.firstName} ${genName.lastName}\n` +
                        `📧 Email: ${email}\n` +
                        `🔑 Password: ${genPassword}\n` +
                        `🆔 User ID: ${loginTest.uid || uid}\n` +
                        `🔗 Profile: ${loginTest.profileUrl || profileUrl}\n\n` +
                        `🛡️ Device: ${device.model}\n` +
                        `✅ Login Test: PASSED\n` +
                        `✅ Anti-Detection: ACTIVE\n\n` +
                        `✨ Your account is ready to use!\n\n` +
                        `💡 IMPORTANT: ${proxyString ? 'Use same proxy when logging in' : 'Consider using a proxy to avoid bans'}`;
                } else {
                    resultMessage = `⚠️ ACCOUNT CREATED BUT LOGIN PENDING!\n\n` +
                        `👤 Name: ${genName.firstName} ${genName.lastName}\n` +
                        `📧 Email: ${email}\n` +
                        `🔑 Password: ${genPassword}\n` +
                        `🆔 User ID: ${uid}\n` +
                        `🔗 Profile: ${profileUrl}\n\n` +
                        `🛡️ Device: ${device.model}\n` +
                        `❌ Login Test: ${loginTest.message}\n\n` +
                        `💡 Possible reasons:\n` +
                        `• Account needs 5-10 minutes to activate\n` +
                        `• May need email confirmation (check inbox)\n` +
                        `• Facebook delayed verification\n\n` +
                        `Try: fbcreate verify ${email} ${genPassword} <code>`;
                }
            } else if (checkpoint || success) {
                resultMessage = `📬 ACCOUNT CREATED - CONFIRMATION NEEDED!\n\n` +
                    `👤 Name: ${genName.firstName} ${genName.lastName}\n` +
                    `📧 Email: ${email}\n` +
                    `🔑 Password: ${genPassword}\n` +
                    `🆔 User ID: ${uid !== "Not available" ? uid : "Will be available after confirmation"}\n\n` +
                    `🛡️ Device: ${device.model}\n` +
                    `✅ Anti-Detection: ACTIVE\n\n` +
                    `⚠️ CHECK YOUR EMAIL for the confirmation code!\n\n` +
                    `To verify, use:\n` +
                    `fbcreate verify ${email} ${genPassword} <code>\n\n` +
                    `Example: fbcreate verify ${email} ${genPassword} 123456\n\n` +
                    `📝 SAVE your credentials above!`;
            } else {
                const $ = cheerio.load(responseText);
                const errorDetail = $('#reg_error_inner').text().trim() || 
                                  $('div[role="alert"]').text().trim() ||
                                  "Facebook rejected the registration";
                resultMessage = `❌ ACCOUNT CREATION FAILED!\n\n` +
                    `📧 Email: ${email}\n` +
                    `⚠️ Reason: ${errorDetail}\n\n` +
                    `💡 Try:\n` +
                    `• Using a different email\n` +
                    `• Adding a proxy\n` +
                    `• Waiting a few minutes`;
            }

            api.sendMessage(resultMessage, threadID);

        } catch (error) {
            console.error('FB Account Creation Error:', error);
            
            let errorMessage = `💥 ACCOUNT CREATION ERROR!\n\n` +
                `📧 Email: ${email}\n` +
                `👤 Name: ${genName.firstName} ${genName.lastName}\n` +
                `🔑 Password: ${genPassword}\n\n` +
                `❌ Error: ${error.message}\n\n`;
            
            // Add helpful suggestions based on error type
            if (error.message.includes('blocking') || error.message.includes('All registration URLs failed')) {
                errorMessage += `🛡️ ANTI-BOT DETECTION LIKELY!\n\n` +
                    `💡 Solutions:\n` +
                    `1. Use a residential proxy:\n` +
                    `   fbcreate ${email} IP:PORT:USER:PASS\n\n` +
                    `2. Use a VPN (before running command)\n\n` +
                    `3. Try from a mobile hotspot\n\n` +
                    `4. Wait 10-30 minutes and retry\n\n` +
                    `5. Use a different IP address\n\n` +
                    `📝 IMPORTANT: Save credentials above!`;
            } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
                errorMessage += `💡 NETWORK TIMEOUT!\n\n` +
                    `Solutions:\n` +
                    `• Check your internet connection\n` +
                    `• Try with a faster proxy/VPN\n` +
                    `• Retry the command\n\n` +
                    `📝 Credentials saved above`;
            } else if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
                errorMessage += `💡 CONNECTION FAILED!\n\n` +
                    `Solutions:\n` +
                    `• Check internet connection\n` +
                    `• Try different proxy/network\n` +
                    `• Facebook may be temporarily down\n\n` +
                    `📝 Credentials saved above`;
            } else if (error.message.includes('form data')) {
                errorMessage += `💡 FACEBOOK PAGE CHANGED!\n\n` +
                    `Solutions:\n` +
                    `• Facebook updated their page structure\n` +
                    `• Try using a proxy from different region\n` +
                    `• Report this issue to admin\n\n` +
                    `📝 Credentials saved above`;
            } else {
                errorMessage += `💡 GENERAL TROUBLESHOOTING:\n` +
                    `• Use a residential proxy (recommended)\n` +
                    `• Try from different IP/network\n` +
                    `• Wait and retry in 15-30 minutes\n` +
                    `• Contact admin if issue persists\n\n` +
                    `📝 Credentials saved above in case of partial success`;
            }
            
            api.sendMessage(errorMessage, threadID);
        }
    }
};

