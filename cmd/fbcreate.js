const axios = require('axios');
const cheerio = require('cheerio');
const { CookieJar } = require('tough-cookie');
const { wrapper: axiosCookieJarSupport } = require('axios-cookiejar-support');

const BASE_FB_MOBILE_URL = 'https://m.facebook.com';
const DEFAULT_TIMEOUT = 45000;

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const generateUserAgent = () => {
    const agents = [
        'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 12; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
    ];
    return agents[Math.floor(Math.random() * agents.length)];
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

const createAxiosSession = (userAgentString, proxyString = null) => {
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
            'User-Agent': userAgentString,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
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
        usage: "fbcreate <email> [proxy_ip:port:user:pass]",
        author: "Bot Admin"
    },
    
    run: async function({ api, message, args, threadID, senderID }) {
        if (args.length < 1) {
            return api.sendMessage(
                '❌ Usage: fbcreate <email> [proxy]\n\n' +
                'Example: fbcreate myemail@example.com\n' +
                'With proxy: fbcreate myemail@example.com 1.2.3.4:8080:user:pass',
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
                `⏳ Creating Facebook account${proxyString ? ' with proxy' : ''}...\n` +
                `📧 Email: ${email}\n` +
                `👤 Name: ${genName.firstName} ${genName.lastName}`,
                threadID
            );
            statusMsgID = statusMsg.messageID;

            const userAgentString = generateUserAgent();
            const session = createAxiosSession(userAgentString, proxyString);

            // Navigate to consent page with retry
            let homepageSuccess = false;
            for (let i = 0; i < 3; i++) {
                try {
                    await session.get(BASE_FB_MOBILE_URL + '/');
                    homepageSuccess = true;
                    break;
                } catch (err) {
                    console.log(`Homepage attempt ${i+1} failed:`, err.message);
                    if (i === 2) throw new Error('Cannot connect to Facebook');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));

            // Try multiple registration URLs
            const regUrls = [
                BASE_FB_MOBILE_URL + '/reg/',
                BASE_FB_MOBILE_URL + '/r.php',
                BASE_FB_MOBILE_URL + '/reg/index.php',
                'https://www.facebook.com/reg/',
            ];

            let regPageResponse = null;
            let responseData = null;

            for (const regUrl of regUrls) {
                try {
                    console.log(`Trying registration URL: ${regUrl}`);
                    const response = await session.get(regUrl, {
                        headers: { 
                            'Referer': BASE_FB_MOBILE_URL + '/',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                        }
                    });

                    if (response && response.status === 200 && response.data) {
                        regPageResponse = response;
                        responseData = response.data;
                        console.log(`Success with: ${regUrl}`);
                        break;
                    }
                } catch (err) {
                    console.log(`Failed ${regUrl}:`, err.message);
                    continue;
                }
            }

            if (!regPageResponse || !responseData) {
                throw new Error('All registration URLs failed. Facebook may be blocking access. Try using a proxy or VPN.');
            }

            const formData = extractFormDataV2(responseData);

            if (!formData.fb_dtsg || !formData.jazoest) {
                throw new Error('Failed to extract form data');
            }

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

            // Add encrypted password
            const timestamp = Math.floor(Date.now() / 1000);
            payload.append('encpass', `#PWD_BROWSER:0:${timestamp}:${genPassword}`);

            // Submit registration with multiple endpoints
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
            
            const submitEndpoints = [
                BASE_FB_MOBILE_URL + '/reg/submit/',
                BASE_FB_MOBILE_URL + '/ajax/register.php',
                'https://www.facebook.com/ajax/register.php',
            ];

            let submitResponse = null;
            let responseText = '';
            let finalUrl = '';

            for (const endpoint of submitEndpoints) {
                try {
                    console.log(`Submitting to: ${endpoint}`);
                    submitResponse = await session.post(endpoint, payload.toString(), {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Referer': BASE_FB_MOBILE_URL + '/reg/',
                            'Origin': BASE_FB_MOBILE_URL,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        timeout: 60000
                    });

                    if (submitResponse && submitResponse.data) {
                        responseText = (typeof submitResponse.data === 'string') ? submitResponse.data : JSON.stringify(submitResponse.data);
                        finalUrl = submitResponse.request?.res?.responseUrl || endpoint;
                        console.log(`Submit success with: ${endpoint}`);
                        break;
                    }
                } catch (err) {
                    console.log(`Submit failed ${endpoint}:`, err.message);
                    if (endpoint === submitEndpoints[submitEndpoints.length - 1]) {
                        throw new Error('Failed to submit registration to all endpoints: ' + err.message);
                    }
                    continue;
                }
            }

            if (!submitResponse) {
                throw new Error('Registration submission failed - no response from Facebook');
            }

            const currentCookies = await session.defaults.jar.getCookieString(finalUrl);
            const { uid, profileUrl } = await extractUidAndProfile(session.defaults.jar, responseText, finalUrl);

            // Determine outcome
            let success = false;
            let checkpoint = false;

            if (currentCookies.includes('c_user=') && !currentCookies.includes('c_user=0')) {
                success = true;
            }
            if (responseText.toLowerCase().includes('checkpoint') ||
                responseText.includes('confirmation_code') ||
                responseText.includes('verify your email')) {
                checkpoint = true;
                success = true;
            }

            // Send result
            let resultMessage = '';
            
            if (success && uid !== "Not available" && !checkpoint) {
                resultMessage = `✅ ACCOUNT CREATED SUCCESSFULLY!\n\n` +
                    `👤 Name: ${genName.firstName} ${genName.lastName}\n` +
                    `📧 Email: ${email}\n` +
                    `🔑 Password: ${genPassword}\n` +
                    `🆔 User ID: ${uid}\n` +
                    `🔗 Profile: ${profileUrl}\n\n` +
                    `✨ Your account is ready to use!`;
            } else if (checkpoint || success) {
                resultMessage = `📬 ACCOUNT NEEDS CONFIRMATION!\n\n` +
                    `👤 Name: ${genName.firstName} ${genName.lastName}\n` +
                    `📧 Email: ${email}\n` +
                    `🔑 Password: ${genPassword}\n` +
                    `🆔 User ID: ${uid !== "Not available" ? uid : "Check email"}\n\n` +
                    `⚠️ Please check your email for confirmation code from Facebook!`;
            } else {
                const $ = cheerio.load(responseText);
                const errorDetail = $('#reg_error_inner').text().trim() || 
                                  $('div[role="alert"]').text().trim() ||
                                  "Facebook rejected the registration";
                resultMessage = `❌ ACCOUNT CREATION FAILED!\n\n` +
                    `📧 Email: ${email}\n` +
                    `⚠️ Reason: ${errorDetail}`;
            }

            api.sendMessage(resultMessage, threadID);

        } catch (error) {
            console.error('FB Account Creation Error:', error);
            
            let errorMessage = `💥 CRITICAL ERROR!\n\n` +
                `📧 Email: ${email}\n` +
                `👤 Name: ${genName.firstName} ${genName.lastName}\n` +
                `🔑 Password: ${genPassword}\n\n` +
                `❌ Error: ${error.message}\n\n`;
            
            // Add helpful suggestions based on error type
            if (error.message.includes('blocking') || error.message.includes('failed')) {
                errorMessage += `💡 Suggestions:\n` +
                    `• Try using a proxy (add proxy after email)\n` +
                    `• Facebook may be blocking automated requests\n` +
                    `• Try again in a few minutes\n` +
                    `• Use a VPN or different network`;
            } else if (error.message.includes('timeout')) {
                errorMessage += `💡 Suggestion: Network timeout - try again with a faster connection`;
            } else if (error.message.includes('connect')) {
                errorMessage += `💡 Suggestion: Cannot reach Facebook - check your internet connection`;
            }
            
            api.sendMessage(errorMessage, threadID);
        }
    }
};

