const http = require('http');
const { spawn } = require('child_process');

// Health check server for Render
const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'online',
            bot: 'ws3fca-instant',
            uptime: process.uptime(),
            timestamp: Date.now(),
            message: '⚡ Bot is running with advanced anti-detection'
        }));
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`✅ Health check server running on port ${PORT}`);
    console.log(`🔗 Access at: http://localhost:${PORT}/health`);
    
    // Start the actual bot
    console.log('\n🤖 Starting bot...\n');
    const bot = spawn('node', ['login_instant.js'], {
        stdio: 'inherit'
    });
    
    bot.on('error', (error) => {
        console.error('❌ Bot error:', error);
    });
    
    bot.on('exit', (code) => {
        console.log(`⚠️  Bot exited with code ${code}`);
        if (code !== 0) {
            console.log('🔄 Restarting bot in 5 seconds...');
            setTimeout(() => {
                const restartBot = spawn('node', ['login_instant.js'], {
                    stdio: 'inherit'
                });
            }, 5000);
        }
    });
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

