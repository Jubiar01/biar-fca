# 🚘 biar-fca

[![npm version](https://img.shields.io/npm/v/biar-fca.svg)](https://www.npmjs.com/package/biar-fca)
[![npm downloads](https://img.shields.io/npm/dm/biar-fca.svg)](https://www.npmjs.com/package/biar-fca)

💁 **biar-fca** is a fully refactored Facebook Chat API (FCA) client built for **reliable**, **real-time**, and **modular** interaction with Facebook Messenger. Designed with modern bot development in mind, it offers full control over Messenger automation through a clean, stable interface.

**Pure NPM Package** - Just `npm install biar-fca` and start building with built-in advanced anti-detection!

> 🔀 **Forked from [ws3-fca](https://github.com/NethWs3Dev/ws3-fca)** - Enhanced and maintained by Jubiar

---

## 📚 Documentation & Feedback

Full documentation and advanced examples:
[https://exocore-dev-docs-exocore.hf.space](https://exocore-dev-docs-exocore.hf.space)

If you encounter issues or want to give feedback, feel free to message us via Facebook:

* [@Kenneth Aceberos](https://www.facebook.com/Neth.Ace.7/)
* [@Johnsteve Costaños](https://www.facebook.com/johnstevecostanos2025/)
* [@Jonell Magallanes 󱢏](https://www.facebook.com/ccprojectsjonell10/)

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes and version history.

**Latest:** v3.6.4 - Fixed critical sendMessage wrapper bug

---

## ✨ Features

* 🔐 **Precise Login Mechanism**
  Dynamically scrapes Facebook's login form and submits tokens for secure authentication.

* 💬 **Real-time Messaging**
  Send and receive messages (text, attachments, stickers, replies).

* 📝 **Message Editing**
  Edit your bot's messages in-place.

* ✍️ **Typing Indicators**
  Detect and send typing status.

* ✅ **Message Status Handling**
  Mark messages as delivered, read, or seen.

* 📂 **Thread Management**

  * Retrieve thread details
  * Load thread message history
  * Get lists with filtering
  * Pin/unpin messages

* 👤 **User Info Retrieval**
  Access name, ID, profile picture, and mutual context.

* 🖼️ **Sticker API**
  Search stickers, list packs, fetch store data, AI-stickers.

* 💬 **Post Interaction**
  Comment and reply to public Facebook posts.

* ➕ **Follow/Unfollow Users**
  Automate social interactions.

* 🌐 **Proxy Support**
  Full support for custom proxies with testing utilities.

* 🧱 **Modular Architecture**
  Organized into pluggable models for maintainability.

* 🛡️ **Robust Error Handling**
  Retry logic, consistent logging, and graceful failovers.

---

## ⚙️ Installation

> Requires **Node.js v20+**

```bash
npm i biar-fca@latest
```

---

## 🛡️ Advanced Anti-Detection Protection

**biar-fca** includes built-in advanced anti-detection protection in the core library!

### ⚡ Protection Features (Automatically Enabled)

When you use `biar-fca`, you automatically get:

- 🔐 **Session Fingerprint Management** - Realistic browser fingerprints with 6hr auto-rotation
- 🎭 **Request Obfuscation** - Multi-layer obfuscation with entropy injection
- 🔀 **Pattern Diffusion** - Adaptive delays to prevent detectable patterns
- 🛡️ **Traffic Analysis Resistance** - Timing jitter and variability
- 📊 **Smart Rate Limiting** - Intelligent message pacing
- 🔒 **MQTT Protection** - Obfuscated MQTT traffic
- ⏱️ **Response Time** - 50-200ms with protection layers
- 🆔 **Realistic Device IDs** - Generated from system hardware
- 🌍 **Random User Agents** - Latest Chrome/Edge configurations
- 🔄 **Auto Cookie Refresh** - Fresh cookies every 20min to maintain bot online

### 📖 Using Advanced Protection

```js
const { login } = require("biar-fca");

login(credentials, {
  advancedProtection: true,      // Default: true (always enabled)
  autoRotateSession: true,       // Default: true (6hr rotation)
  randomUserAgent: true,         // Default: true (realistic UAs)
  cookieRefresh: true,           // Default: true (auto-refresh every 20min)
  cookieRefreshInterval: 1200000,// Default: 1200000ms (20 minutes)
  updatePresence: true,          // Maintain realistic presence
  autoMarkDelivery: true,        // Realistic delivery receipts
  autoMarkRead: true             // Realistic read receipts
}, (err, api) => {
  // Your bot code here
  
  // Check protection stats (includes cookie refresh stats)
  const stats = api.getProtectionStats();
  console.log('Protection Status:', stats);
  
  // Get cookie refresh stats
  const cookieStats = api.getCookieRefreshStats();
  console.log('Cookie Refresh:', cookieStats);
});
```

### 🚀 Building Your Bot

Create your bot file (e.g., `bot.js`):

```js
const { login } = require("biar-fca");
const fs = require("fs");

const credentials = {
  appState: JSON.parse(fs.readFileSync("appstate.json", "utf8"))
};

login(credentials, {
  advancedProtection: true,  // Automatic protection
  updatePresence: true,
  autoMarkRead: true
}, (err, api) => {
  if (err) return console.error(err);
  
  console.log("✅ Bot online with protection!");
  
  api.listenMqtt((err, event) => {
    if (err) return console.error(err);
    if (event.type !== "message") return;
    
    // Handle messages
    console.log("Message:", event.body);
    api.sendMessage("Hello!", event.threadID);
  });
});
```

Then run: `node bot.js`

---

## 🔄 Cookie Refresh Feature

**NEW!** Automatic cookie refresh to keep your bot online with fresh cookies every 20 minutes.

### How It Works

The Cookie Refresh Manager automatically makes requests to Facebook every 20 minutes to:
- Refresh authentication cookies with fresh values
- Update session tokens (DTSG) for valid authentication
- Maintain online presence and active session
- Prevent session expiration and disconnections

### Configuration

```js
login(credentials, {
  cookieRefresh: true,               // Enable/disable (default: true)
  cookieRefreshInterval: 1200000,    // Interval in ms (default: 1200000 = 20min)
}, (err, api) => {
  // Your bot is now maintaining fresh cookies automatically every 20 minutes!
});
```

### API Methods

```js
// Get cookie refresh statistics
const stats = api.getCookieRefreshStats();
console.log(stats);
// {
//   enabled: true,
//   refreshCount: 12,
//   failureCount: 0,
//   lastRefresh: "2025-10-31T12:34:56.789Z",
//   timeSinceLastRefresh: 234567,
//   refreshInterval: 1200000
// }

// Control cookie refresh
api.stopCookieRefresh();                  // Stop auto-refresh
api.startCookieRefresh();                 // Start auto-refresh
api.setCookieRefreshInterval(1800000);    // Change to 30 minutes
api.setCookieRefreshInterval(600000);     // Change to 10 minutes
```

### Benefits

✅ **Maintains Online Status** - Bot stays active and responsive 24/7  
✅ **Prevents Session Expiration** - Fresh cookies keep session alive  
✅ **Automatic & Silent** - Works in background without interruption  
✅ **Configurable** - Adjust interval from 1min to any duration (default 20min)  
✅ **Statistics** - Track refresh count and success rate with detailed logs  
✅ **Anti-Detection** - Rotates through 4 different Facebook endpoints  
✅ **Token Updates** - Automatically refreshes DTSG tokens for valid auth  
✅ **Smart Logging** - Detailed logs show cookies updated and tokens refreshed  

### Why 20 Minutes?

20 minutes is the optimal interval because:
- ✅ Frequent enough to keep session alive
- ✅ Not too frequent to trigger rate limits
- ✅ Mimics natural human browsing patterns
- ✅ Reduces network overhead
- ✅ Best balance for long-running bots

---

## 🚀 Getting Started

### 1. Install via NPM

```bash
npm install biar-fca
```

### 2. Generate `appstate.json`

This file contains your Facebook session cookies.
Use a browser extension (e.g. "C3C FbState", "CookieEditor") to export cookies after logging in, and save them in this format:

```json
[
  {
    "key": "c_user",
    "value": "your-id"
  }
]
```

If you don't know how to get cookie, you can follow this tutorial **[here](https://appstate-tutorial-ws3.pages.dev)**.

Place this file in the root directory as `appstate.json`.

---

### 3. Basic Usage Example

```js
const fs = require("fs");
const path = require("path");
const { login } = require("biar-fca");

let credentials;
try {
  credentials = { appState: JSON.parse(fs.readFileSync("appstate.json", "utf8")) };
} catch (err) {
  console.error("❌ appstate.json is missing or malformed.", err);
  process.exit(1);
}

console.log("Logging in...");

login(credentials, {
  online: true,
  updatePresence: true,
  selfListen: false,
  // Advanced Protection Features (enabled by default)
  advancedProtection: true,      // Enable anti-detection features
  autoRotateSession: true,       // Auto-rotate session fingerprints
  randomUserAgent: true,         // Use realistic random user agents
  cookieRefresh: true,           // Auto-refresh cookies every 20min (NEW!)
  cookieRefreshInterval: 1200000,// Refresh interval: 20 minutes (default)
  autoMarkDelivery: true,        // Realistic message behavior
  autoMarkRead: true             // Realistic read behavior
}, async (err, api) => {
  if (err) return console.error("LOGIN ERROR:", err);

  console.log(`✅ Logged in as: ${api.getCurrentUserID()}`);

  const commandsDir = path.join(__dirname, "modules", "commands");
  const commands = new Map();

  if (!fs.existsSync(commandsDir)) fs.mkdirSync(commandsDir, { recursive: true });

  for (const file of fs.readdirSync(commandsDir).filter(f => f.endsWith(".js"))) {
    const command = require(path.join(commandsDir, file));
    if (command.name && typeof command.execute === "function") {
      commands.set(command.name, command);
      console.log(`🔧 Loaded command: ${command.name}`);
    }
  }

  api.listenMqtt(async (err, event) => {
    if (err || !event.body || event.type !== "message") return;

    const prefix = "/";
    if (!event.body.startsWith(prefix)) return;

    const args = event.body.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = commands.get(commandName);
    if (!command) return;

    try {
      await command.execute({ api, event, args });
    } catch (error) {
      console.error(`Error executing ${commandName}:`, error);
      api.sendMessageMqtt("❌ An error occurred while executing the command.", event.threadID, event.messageID);
    }
  });
});
```

---

## 📝 Changelog

### Version 3.6.3 - October 31, 2025

#### 🎉 New Feature: Automatic Cookie Refresh

#### ✨ New Features
- **Auto Cookie Refresh** - Fresh cookies every 20 minutes to maintain bot online! 🔄
- **Cookie Refresh Manager** - Intelligent background refresh system with comprehensive logging
- **Configurable Interval** - Adjust refresh rate from 1min to any duration (default: 20min)
- **Refresh Statistics** - Track refresh count, failures, and detailed timing
- **Multiple Endpoints** - Rotates through 4 Facebook endpoints for anti-detection
- **Token Updates** - Automatically refreshes DTSG tokens with dual pattern matching
- **API Controls** - Start, stop, and configure refresh on-demand
- **Smart Logging** - Detailed logs show cookies updated, tokens refreshed, and next refresh time

#### 📊 New API Methods
- `api.getCookieRefreshStats()` - Get refresh statistics
- `api.stopCookieRefresh()` - Stop automatic refresh
- `api.startCookieRefresh()` - Start automatic refresh
- `api.setCookieRefreshInterval(ms)` - Change refresh interval

#### 🔧 Improvements
- Enhanced cookie management for longer sessions (20min refresh cycle)
- Better session persistence and stability with comprehensive token updates
- Reduced disconnection rate with intelligent endpoint rotation
- Improved online status maintenance with detailed refresh logging
- Optimized refresh interval (20 minutes) for best balance between keeping alive and avoiding rate limits
- Dual DTSG token pattern matching for higher success rate
- Smart logging with detailed information per refresh cycle

---

### Version 3.6.2 - October 31, 2025

#### 🎉 Major Update: Pure NPM Package with Built-in Protection

#### ✨ New Features
- **Pure NPM Package** - Now exclusively distributed via npm for cleaner installation
- **Integrated Anti-Detection System** - Advanced protection built directly into core library!
- **Session Fingerprint Management** - Automatic 6-hour session rotation with realistic browser fingerprints
- **Request Obfuscation Layer** - Multi-layer obfuscation with cryptographic entropy injection
- **Pattern Diffusion System** - Adaptive delays prevent detectable bot patterns
- **Traffic Analysis Resistance** - Timing jitter and variability to resist detection
- **Smart Rate Limiting** - Intelligent message pacing based on activity
- **MQTT Protection** - Obfuscated MQTT traffic with random metadata
- **Realistic Device IDs** - Hardware-based device ID generation
- **Random User Agents** - Latest Chrome/Edge user agent configurations
- **Protection Stats API** - New `api.getProtectionStats()` method

#### 🔧 Improvements
- Enhanced `login()` function with `advancedProtection` option (enabled by default)
- Improved default options for realistic behavior (auto-mark delivery/read)
- Better MQTT client configuration with jitter
- Cleaner package structure - only essential files included

#### 🚀 Performance
- Ultra-fast responses (50-200ms) with protection layers
- No overhead from anti-detection features
- Intelligent batching prevents spam detection

#### 📦 Package Structure
- **Removed**: Standalone bot files, web server, deployment configs
- **Added**: Built-in protection in core library
- **Result**: Clean, focused npm package
- Simply: `npm install biar-fca` and start building!

---

### Version 3.5.2 (biar-fca fork) - October 31, 2025

#### 🎉 Fork Announcement
- **biar-fca** forked from [ws3-fca](https://github.com/NethWs3Dev/ws3-fca)
- New maintainer: **Jubiar**

#### ✨ New Features
- Added web-based bot management interface
- Integrated proxy testing utilities with batch testing support
- Added API health monitoring endpoint
- Implemented real-time bot status tracking

#### 🔧 Improvements
- Enhanced server.js with Express-based HTTP server
- Added proxy validation and testing endpoints
- Improved error handling and logging
- Better deployment support for Vercel and Render

#### 🗑️ Removed Features
- Removed Facebook account creation functionality (fbcreate.js)
- Cleaned up unused dependencies and routes

#### 🐛 Bug Fixes
- Fixed module loading errors
- Resolved proxy configuration issues
- Improved stability and error recovery

#### 📦 Package Changes
- Renamed package from `ws3-fca` to `biar-fca`
- Updated all internal references and documentation
- Maintained backward compatibility with ws3-fca API

---

## 🙌 Credits

### Original Authors (ws3-fca)
* 🔧 **[@NethWs3Dev](https://github.com/NethWs3Dev) (Kenneth Aceberos)** – Main developer, equal maintainer, feature and patch contributions.
* 💧 **@ChoruOfficial (Johnsteve Costaños)** – Lead developer, refactor of original FCA code, Fully Setup MQTT.
* 🔮 **@CommunityExocore (Jonell Magallanes)** – Foundational core design and architecture.

### Current Maintainer (biar-fca)
* 🚀 **Jubiar** – Fork maintainer, enhancements, and ongoing development.

### Original FCA (2015)
> Copyright (c) 2015
> Avery, Benjamin, David, Maude

---

## 🔗 Related Resources

- **Original ws3-fca**: [https://github.com/NethWs3Dev/ws3-fca](https://github.com/NethWs3Dev/ws3-fca)
- **Documentation**: [https://exocore-dev-docs-exocore.hf.space](https://exocore-dev-docs-exocore.hf.space)
- **NPM Package**: [https://www.npmjs.com/package/biar-fca](https://www.npmjs.com/package/biar-fca)

---

## 📊 License

**MIT** – Free to use, modify, and distribute. Attribution appreciated.

---

## 🔄 Updating & Publishing

For maintainers: To update and republish the package:

```bash
# 1. Make your changes
# 2. Update version
npm version patch   # For bug fixes (3.5.2 → 3.5.3)
npm version minor   # For new features (3.5.2 → 3.6.2)
npm version major   # For breaking changes (3.5.2 → 4.0.0)

# 3. Publish
npm publish

# 4. Push to GitHub
git push && git push --tags
```

📖 **Detailed guide**: See [UPDATE_GUIDE.md](UPDATE_GUIDE.md)

---

## 🤝 Contributing

We welcome contributions! Whether it's bug fixes, new features, or documentation improvements:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## ⚠️ Disclaimer

This project is not affiliated with, authorized, maintained, sponsored, or endorsed by Facebook or any of its affiliates. Use this library at your own risk. Automating Facebook accounts may violate Facebook's Terms of Service and could result in account restrictions or bans.

---

**Made with ❤️ by the biar-fca**
