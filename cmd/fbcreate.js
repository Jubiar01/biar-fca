const axios = require('axios');
const cheerio = require('cheerio');
const { CookieJar } = require('tough-cookie');
const { wrapper: axiosCookieJarSupport } = require('axios-cookiejar-support');

const BASE_FB_MOBILE_URL = 'https://m.facebook.com';
const DEFAULT_TIMEOUT = 45000;

// ==========================================
// ANTI-DETECTION v3.0 - Stealth Mode
// ==========================================
// Strategy: Use minimal, clean headers to avoid detection
// - No fake fingerprints (use your real device)
// - Simple, standard headers
// - Proper cookie/session handling
// - Focus on correct form data & encryption
// - Random User-Agent rotation
// ==========================================

const getRandomUserAgent = () => {
    const agents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    return agents[Math.floor(Math.random() * agents.length)];
};

const getCleanHeaders = (referer = null) => {
    const headers = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'DNT': '1',
    };
    
    if (referer) {
        headers['Referer'] = referer;
    }
    
    return headers;
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

const createAxiosSession = (proxyString = null) => {
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
        headers: {
            'User-Agent': getRandomUserAgent(),
            ...getCleanHeaders()
        },
        timeout: DEFAULT_TIMEOUT,
        maxRedirects: 10,
        validateStatus: (status) => status >= 200 && status < 600,
        proxy: proxyConfig,
    });
    axiosCookieJarSupport(session);
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
        usage: "fbcreate <email> [proxy]",
        author: "Bot Admin"
    },
    
    run: async function({ api, message, args, threadID, senderID }) {
        if (args.length < 1) {
            return api.sendMessage(
                '❌ Usage: fbcreate <email> [proxy]\n\n' +
                'Examples:\n' +
                '• fbcreate myemail@example.com\n' +
                '• fbcreate myemail@example.com 1.2.3.4:8080\n' +
                '• fbcreate myemail@example.com 1.2.3.4:8080:user:pass\n\n' +
                '💡 TIP: Using a residential proxy is highly recommended!',
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
                `⏳ Creating Facebook account...\n` +
                `📧 Email: ${email}\n` +
                `👤 Name: ${genName.firstName} ${genName.lastName}\n` +
                `${proxyString ? '🌐 Using proxy' : ''}`,
                threadID
            );
            statusMsgID = statusMsg.messageID;

            const session = createAxiosSession(proxyString);

            // Navigate to homepage
            let homepageSuccess = false;
            for (let i = 0; i < 3; i++) {
                try {
                    await session.get(BASE_FB_MOBILE_URL + '/', {
                        headers: getCleanHeaders()
                    });
                    homepageSuccess = true;
                    console.log('✅ Homepage loaded');
                    break;
                } catch (err) {
                    console.log(`❌ Homepage attempt ${i+1} failed:`, err.message);
                    if (i === 2) throw new Error('Cannot connect to Facebook - check internet/proxy');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

            await new Promise(resolve => setTimeout(resolve, 1000));

            // Try multiple registration URLs
            const regUrls = [
                BASE_FB_MOBILE_URL + '/reg/',
                BASE_FB_MOBILE_URL + '/r.php',
                BASE_FB_MOBILE_URL + '/reg/index.php',
            ];

            let regPageResponse = null;
            let responseData = null;

            for (const regUrl of regUrls) {
                try {
                    console.log(`🔍 Trying: ${regUrl}`);
                    
                    const response = await session.get(regUrl, {
                        headers: getCleanHeaders(BASE_FB_MOBILE_URL + '/')
                    });

                    if (response && response.status === 200 && response.data) {
                        regPageResponse = response;
                        responseData = response.data;
                        console.log(`✅ Success: ${regUrl}`);
                        break;
                    }
                } catch (err) {
                    console.log(`❌ Failed: ${regUrl} - ${err.message}`);
                    if (regUrl === regUrls[regUrls.length - 1]) {
                        throw new Error('All registration URLs failed. Try using a proxy.');
                    }
                    continue;
                }
            }

            if (!regPageResponse || !responseData) {
                throw new Error('Cannot access registration page. Use a proxy or VPN.');
            }

            console.log('✅ Registration page loaded');

            const formData = extractFormDataV2(responseData);

            if (!formData.fb_dtsg || !formData.jazoest) {
                throw new Error('Failed to extract form data - Facebook changed page structure');
            }

            console.log('✅ Form data extracted');
            await new Promise(resolve => setTimeout(resolve, 1500));

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

            console.log('📝 Submitting registration...');

            await new Promise(resolve => setTimeout(resolve, 1000));
            
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
                            ...getCleanHeaders(usedRegUrl),
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Origin': BASE_FB_MOBILE_URL,
                        },
                        timeout: 60000
                    });

                    if (submitResponse && submitResponse.data) {
                        responseText = (typeof submitResponse.data === 'string') ? submitResponse.data : JSON.stringify(submitResponse.data);
                        finalUrl = submitResponse.request?.res?.responseUrl || endpoint;
                        console.log(`✅ Success: ${endpoint}`);
                        break;
                    }
                } catch (err) {
                    console.log(`❌ Failed: ${endpoint} - ${err.message}`);
                    if (endpoint === submitEndpoints[submitEndpoints.length - 1]) {
                        throw new Error('Registration submission failed: ' + err.message);
                    }
                    continue;
                }
            }

            if (!submitResponse) {
                throw new Error('No response from Facebook - registration failed');
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
                console.log('✅ Account created successfully');
                
                resultMessage = `✅ ACCOUNT CREATED SUCCESSFULLY!\n\n` +
                    `👤 Name: ${genName.firstName} ${genName.lastName}\n` +
                    `📧 Email: ${email}\n` +
                    `🔑 Password: ${genPassword}\n` +
                    `🆔 User ID: ${uid}\n` +
                    `🔗 Profile: ${profileUrl}\n\n` +
                    `✨ Account is ready to use!\n\n` +
                    `📝 Next Steps:\n` +
                    `1. Go to m.facebook.com or facebook.com\n` +
                    `2. Login with email and password above\n` +
                    `3. Complete any verification if asked\n\n` +
                    `💡 IMPORTANT:\n` +
                    `${proxyString ? '• Use same proxy when logging in\n' : '• Use a proxy when logging in\n'}` +
                    `• Don't spam activities immediately\n` +
                    `• Wait a few hours before heavy usage`;
            } else if (checkpoint || success) {
                console.log('⚠️ Account needs email confirmation');
                
                resultMessage = `📬 ACCOUNT CREATED - CONFIRMATION NEEDED!\n\n` +
                    `👤 Name: ${genName.firstName} ${genName.lastName}\n` +
                    `📧 Email: ${email}\n` +
                    `🔑 Password: ${genPassword}\n` +
                    `🆔 User ID: ${uid !== "Not available" ? uid : "Will appear after confirmation"}\n\n` +
                    `⚠️ CHECK YOUR EMAIL for confirmation code!\n\n` +
                    `📝 Next Steps:\n` +
                    `1. Check your email inbox for Facebook confirmation code\n` +
                    `2. Go to m.facebook.com or facebook.com\n` +
                    `3. Login with email and password above\n` +
                    `4. Enter the confirmation code when prompted\n\n` +
                    `💡 TIPS:\n` +
                    `${proxyString ? '• Use same proxy when logging in\n' : '• Use a proxy when logging in\n'}` +
                    `• Save your credentials above!\n` +
                    `• Code usually arrives within 1-5 minutes`;
            } else {
                console.log('❌ Account creation failed');
                
                const $ = cheerio.load(responseText);
                const errorDetail = $('#reg_error_inner').text().trim() || 
                                  $('div[role="alert"]').text().trim() ||
                                  "Facebook rejected the registration";
                resultMessage = `❌ ACCOUNT CREATION FAILED!\n\n` +
                    `📧 Email: ${email}\n` +
                    `⚠️ Reason: ${errorDetail}\n\n` +
                    `💡 Solutions:\n` +
                    `• Use a different email address\n` +
                    `• Use a residential proxy (highly recommended)\n` +
                    `• Try from different IP/network\n` +
                    `• Wait 10-30 minutes and retry`;
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
            if (error.message.includes('blocking') || error.message.includes('registration URLs failed') || error.message.includes('Cannot access')) {
                errorMessage += `🛡️ FACEBOOK IS BLOCKING ACCESS!\n\n` +
                    `💡 Solutions (in order of effectiveness):\n` +
                    `1. USE A RESIDENTIAL PROXY:\n` +
                    `   fbcreate ${email} IP:PORT:USER:PASS\n\n` +
                    `2. Use a quality VPN (NordVPN, ExpressVPN)\n\n` +
                    `3. Try from mobile hotspot/different network\n\n` +
                    `4. Wait 30-60 minutes and retry\n\n` +
                    `📝 Credentials saved above - account may have been partially created`;
            } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
                errorMessage += `💡 NETWORK TIMEOUT!\n\n` +
                    `Solutions:\n` +
                    `• Check your internet connection speed\n` +
                    `• Try with a faster/different proxy\n` +
                    `• Retry the command\n\n` +
                    `📝 Credentials saved above`;
            } else if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
                errorMessage += `💡 CONNECTION FAILED!\n\n` +
                    `Solutions:\n` +
                    `• Check internet connection\n` +
                    `• Verify proxy is working (if using one)\n` +
                    `• Try different network/proxy\n` +
                    `• Facebook may be temporarily down\n\n` +
                    `📝 Credentials saved above`;
            } else if (error.message.includes('form data') || error.message.includes('page structure')) {
                errorMessage += `💡 FACEBOOK UPDATED THEIR SYSTEM!\n\n` +
                    `Solutions:\n` +
                    `• Try using a proxy from different region\n` +
                    `• Wait a few hours and retry\n` +
                    `• Report this to bot admin for update\n\n` +
                    `📝 Credentials saved above`;
            } else {
                errorMessage += `💡 GENERAL TROUBLESHOOTING:\n` +
                    `• Use a residential proxy (HIGHLY recommended)\n` +
                    `• Try from different IP/network/location\n` +
                    `• Wait 15-30 minutes and retry\n` +
                    `• Use a different email address\n\n` +
                    `📝 Credentials saved above`;
            }
            
            api.sendMessage(errorMessage, threadID);
        }
    }
};

