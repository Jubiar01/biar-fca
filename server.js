const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');

// Track bot status
let botStatus = {
    running: false,
    loginError: false,
    lastError: null
};

// Track working proxies
let workingProxies = [];
let proxyTestResults = [];

// Proxy testing function with faster timeout
// Enhanced proxy testing function with better diagnostics
async function testProxy(proxyString, timeout = 12000) {
    const testUrls = [
        'https://www.facebook.com',
        'https://m.facebook.com',
        'https://www.google.com'
    ];

    try {
        const parts = proxyString.split(':');
        let proxyConfig = null;

        if (parts.length === 4) {
            // IP:PORT:USER:PASS format
            proxyConfig = {
                protocol: 'http',
                host: parts[0],
                port: parseInt(parts[1], 10),
                auth: {
                    username: parts[2],
                    password: parts[3],
                },
            };
        } else if (parts.length === 2) {
            // IP:PORT format
            proxyConfig = {
                protocol: 'http',
                host: parts[0],
                port: parseInt(parts[1], 10),
            };
        } else if (parts.length === 5) {
            // IP:PORT:USER:PASS:PROTOCOL format
            proxyConfig = {
                protocol: parts[4] || 'http',
                host: parts[0],
                port: parseInt(parts[1], 10),
                auth: {
                    username: parts[2],
                    password: parts[3],
                },
            };
        } else {
            return {
                proxy: proxyString,
                working: false,
                error: 'Invalid proxy format',
                speed: null,
                successRate: '0/3'
            };
        }

        const startTime = Date.now();
        let successCount = 0;
        let lastError = '';

        // Test against multiple URLs in parallel for speed
        const testPromises = testUrls.map(async (testUrl) => {
            try {
                const response = await axios.get(testUrl, {
                    proxy: proxyConfig,
                    timeout: timeout,
                    maxRedirects: 3,
                    validateStatus: (status) => status >= 200 && status < 500,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                if (response.status === 200 || response.status === 302) {
                    return true;
                }
                return false;
            } catch (err) {
                lastError = err.code || err.message;
                return false;
            }
        });

        const results = await Promise.all(testPromises);
        successCount = results.filter(r => r === true).length;

        const endTime = Date.now();
        const speed = endTime - startTime;

        // Proxy is working if it successfully connected to at least 2 out of 3 URLs
        const working = successCount >= 2;

        return {
            proxy: proxyString,
            working: working,
            speed: working ? speed : null,
            successRate: `${successCount}/${testUrls.length}`,
            error: working ? null : (lastError || 'Failed to connect to test URLs')
        };

    } catch (error) {
        return {
            proxy: proxyString,
            working: false,
            error: error.code || error.message,
            speed: null,
            successRate: '0/3'
        };
    }
}

// Health check server for Render + Web UI
const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'online',
            server: 'biarfca-instant',
            uptime: process.uptime(),
            timestamp: Date.now(),
            webInterface: 'available',
            bot: {
                running: botStatus.running,
                loginError: botStatus.loginError,
                lastError: botStatus.lastError
            },
            message: botStatus.running 
                ? '⚡ Server and bot are running' 
                : '⚡ Server is running (bot offline - web interface available)'
        }));
    } else if (req.url === '/' || req.url === '/index.html') {
        // Serve the Geist UI
        const filePath = path.join(__dirname, 'public', 'index.html');
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else if (req.url === '/test' || req.url === '/test-api.html') {
        // Serve the API tester
        const filePath = path.join(__dirname, 'public', 'test-api.html');
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else if (req.url === '/proxy-tester' || req.url === '/proxy-tester.html') {
        // Serve the Geist proxy tester UI
        const filePath = path.join(__dirname, 'public', 'proxy-tester.html');
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else if (req.url === '/api/test-proxy' && req.method === 'POST') {
        // Test a single proxy
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const { proxy } = JSON.parse(body);

                if (!proxy) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: 'Proxy string is required'
                    }));
                    return;
                }

                console.log(`\n🔍 Testing proxy: ${proxy}`);

                const result = await testProxy(proxy, 15000);

                console.log(`   ${result.working ? '✅' : '❌'} ${proxy} - ${result.working ? `${result.speed}ms` : result.error}`);

                // If proxy is working, add to working proxies list
                if (result.working && !workingProxies.includes(proxy)) {
                    workingProxies.push(proxy);
                    console.log(`   💾 Added to working proxies (${workingProxies.length} total)`);
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    result: result
                }));

            } catch (error) {
                console.error('Proxy test error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: 'Server error: ' + error.message
                }));
            }
        });
    } else if (req.url === '/api/test-proxies-batch' && req.method === 'POST') {
        // Test multiple proxies from uploaded file
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const { proxies } = JSON.parse(body);

                if (!Array.isArray(proxies) || proxies.length === 0) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: 'Proxies array is required'
                    }));
                    return;
                }

                console.log(`\n📋 Testing ${proxies.length} proxies...`);

                // Clear previous results
                proxyTestResults = [];
                
                // Test proxies one by one (to avoid overwhelming the system)
                for (let i = 0; i < proxies.length; i++) {
                    const proxy = proxies[i].trim();
                    if (!proxy) continue;

                    console.log(`   [${i + 1}/${proxies.length}] Testing: ${proxy}`);
                    
                    const result = await testProxy(proxy, 15000);
                    proxyTestResults.push(result);

                    if (result.working && !workingProxies.includes(proxy)) {
                        workingProxies.push(proxy);
                        console.log(`      ✅ Working! Speed: ${result.speed}ms`);
                    } else {
                        console.log(`      ❌ Failed: ${result.error}`);
                    }

                    // Small delay between tests to avoid overwhelming the system
                    await new Promise(resolve => setTimeout(resolve, 500));
                }

                // Save working proxies to file
                if (workingProxies.length > 0) {
                    const proxiesFilePath = path.join(__dirname, 'working-proxies.txt');
                    fs.writeFileSync(proxiesFilePath, workingProxies.join('\n'), 'utf8');
                    console.log(`\n💾 Saved ${workingProxies.length} working proxies to working-proxies.txt`);
                }

                const workingCount = proxyTestResults.filter(r => r.working).length;
                console.log(`\n✅ Batch test complete: ${workingCount}/${proxies.length} working`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    results: proxyTestResults,
                    workingCount: workingCount,
                    totalCount: proxies.length,
                    savedToFile: workingProxies.length > 0
                }));

            } catch (error) {
                console.error('Batch proxy test error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: 'Server error: ' + error.message
                }));
            }
        });
    } else if (req.url === '/api/working-proxies' && req.method === 'GET') {
        // Get list of working proxies
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            proxies: workingProxies,
            count: workingProxies.length
        }));
    } else if (req.url === '/api/clear-proxies' && req.method === 'POST') {
        // Clear working proxies list
        workingProxies = [];
        proxyTestResults = [];
        
        // Also delete the file
        const proxiesFilePath = path.join(__dirname, 'working-proxies.txt');
        if (fs.existsSync(proxiesFilePath)) {
            fs.unlinkSync(proxiesFilePath);
        }

        console.log('\n🗑️ Cleared all working proxies');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: 'Working proxies cleared'
        }));
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Web Interface: http://localhost:${PORT}/`);
    console.log(`🧪 API Tester: http://localhost:${PORT}/test`);
    console.log(`🔍 Proxy Tester: http://localhost:${PORT}/proxy-tester`);
    console.log(`📊 Health Check: http://localhost:${PORT}/health`);
    console.log(`🔌 API Endpoints:`);
    console.log(`   - POST /api/create-account (Create FB account)`);
    console.log(`   - POST /api/test-proxy (Test single proxy)`);
    console.log(`   - POST /api/test-proxies-batch (Test multiple proxies)`);
    console.log(`   - GET  /api/working-proxies (Get working proxies list)`);
    console.log(`   - POST /api/clear-proxies (Clear proxies)`);
    console.log('='.repeat(60));
    
    // Check if appstate.json exists before starting bot
    const appstatePath = path.join(__dirname, 'appstate.json');
    
    if (fs.existsSync(appstatePath)) {
        console.log('\n🤖 Starting Facebook Messenger bot...\n');
        
        const bot = spawn('node', ['login.js'], {
            stdio: 'inherit'
        });
        
        // Assume bot is starting
        botStatus.running = true;
        
        bot.on('error', (error) => {
            console.error('\n❌ Bot error:', error.message);
            console.log('⚠️  Web interface will continue to work without the bot');
            botStatus.running = false;
            botStatus.loginError = true;
            botStatus.lastError = error.message;
        });
        
        bot.on('exit', (code) => {
            botStatus.running = false;
            
            if (code !== 0) {
                console.log(`\n⚠️  Bot exited with code ${code}`);
                console.log('💡 Bot login failed - your appstate.json may be expired');
                console.log('📝 To fix: Login to Facebook in a browser and export new cookies');
                console.log('✅ Web interface is still available for account creation!\n');
                
                botStatus.loginError = true;
                botStatus.lastError = 'Bot exited with code ' + code + ' (likely expired appstate.json)';
            }
        });
    } else {
        console.log('\n⚠️  No appstate.json found - bot will not start');
        console.log('✅ Web interface is available for account creation');
        console.log('💡 To enable bot: Add appstate.json with valid Facebook session\n');
        
        botStatus.running = false;
        botStatus.loginError = false;
        botStatus.lastError = 'No appstate.json file found';
    }
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

