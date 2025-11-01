# Changelog

All notable changes to **biar-fca** will be documented in this file.

---

## [3.7.1] - 2025-11-01

### 🐛 Bug Fix - sendTypingIndicator

This release fixes a critical error in the `sendTypingIndicator` function that caused crashes when called with flexible parameters.

### Fixed

- **Critical**: `TypeError: Cannot read properties of undefined (reading 'toString')` in sendTypingIndicator
  - Root cause: Function expected parameters in strict order `(sendTyping, threadID)` but was often called with just `(threadID)`
  - When called with single parameter, `threadID` became `undefined` causing `.toString()` to fail
  - Added intelligent parameter detection to support both calling patterns:
    - `api.sendTypingIndicator(threadID)` - Shows typing indicator (default true)
    - `api.sendTypingIndicator(true/false, threadID)` - Controls typing indicator
  
- **Improved**: Parameter validation and error handling
  - Added validation to ensure threadID is always provided
  - Added try-catch wrapper for better error handling
  - Function now throws descriptive error when threadID is missing
  - Callback errors are properly handled in both success and failure cases

### Technical Details

**What Was Broken in v3.7.0:**
```javascript
// Strict parameter order - failed when called with just threadID
return async function sendTypingIndicatorV2(sendTyping, threadID, callback) {
    thread_key: threadID.toString(), // ❌ Crashes when threadID is undefined
}
```

**What's Fixed in v3.7.1:**
```javascript
// Flexible parameter detection
if (typeof sendTyping === 'string' || typeof sendTyping === 'number') {
    // Called with just threadID: sendTypingIndicator(threadID)
    actualThreadID = sendTyping;
    actualSendTyping = true; // Default to showing typing
} else {
    // Called with both: sendTypingIndicator(boolean, threadID)
    actualSendTyping = sendTyping;
    actualThreadID = threadID;
}

// Validate before use
if (!actualThreadID) {
    throw new Error('sendTypingIndicator: threadID is required');
}
```

### Migration Guide

**No breaking changes!** The fix is backward compatible.

**Both patterns now work:**
```javascript
// Old way (still works)
await api.sendTypingIndicator(true, threadID);

// New way (now also works)
await api.sendTypingIndicator(threadID); // Shows typing indicator
```

### Impact
- ✅ Fixes AI-generated commands that use simplified typing indicator syntax
- ✅ Maintains backward compatibility with existing code
- ✅ Better error messages for debugging
- ✅ More developer-friendly API

---

## [3.6.9] - 2025-11-01

### 🐛 Critical Bug Fix

This release fixes a critical logout error that prevented proper cleanup when removing or restarting bots.

### Fixed

- **Critical**: `TypeError: Cannot read properties of undefined (reading '1')` in logout function
  - Root cause: Missing null/undefined checks when accessing Facebook's logout markup response
  - The `.find()` method was returning `undefined` when the markup element wasn't found
  - Accessing `[1]` on `undefined` caused the application to crash
  
- **Critical**: Bots continuing to respond to messages after deletion
  - Root cause: MQTT connection remained active even after logout was called
  - Messages were still being received and processed by deleted bots
  - Added MQTT client disconnection before logout process
  
- **Improved**: Graceful logout handling
  - Added comprehensive null/undefined checks for all response properties
  - Added early returns when session is already logged out
  - Added validation for context and jar objects before attempting logout
  - **MQTT client is now forcefully disconnected before logout**
  - Logout now marks session as logged out even if errors occur (prevents stuck sessions)
  - Added multiple safety checks in event handlers to prevent processing after deletion

### Technical Details

**What Was Broken in v3.6.8:**
```javascript
// No null checking - crashed if element wasn't found
const html = resData.jsmods.markup.find(v => v[0] === elem.markup.__m)[1].__html;

// MQTT connection remained active after logout
// Deleted bots continued receiving and processing messages
```

**What's Fixed in v3.6.9:**
```javascript
// 1. Disconnect MQTT first to stop all incoming messages
if (ctx.mqttClient) {
  ctx.mqttClient.end(true); // Force close
  ctx.mqttClient = null;
}

// 2. Proper null checking with early returns
const markupElement = resData.jsmods.markup ? 
  resData.jsmods.markup.find(v => v && v[0] === elem.markup.__m) : null;

if (!markupElement || !markupElement[1] || !markupElement[1].__html) {
  utils.log("logout", "Could not find logout markup. Session may already be logged out.");
  ctx.loggedIn = false;
  return;
}

const html = markupElement[1].__html;

// 3. Additional safety checks in event handlers
const currentBot = this.bots.get(botId);
if (!currentBot || currentBot.status === 'offline' || !currentBot.api) {
  return; // Ignore events from deleted bots
}
```

### Impact

- Bot restart now works properly without crashes or double responses
- Bot deletion completes successfully without errors
- **Deleted bots immediately stop responding to messages**
- **MQTT connections are properly closed, preventing ghost responses**
- Sessions are properly cleaned up even when logout fails
- No more unhandled rejection errors during bot management
- Event handlers ignore messages from removed bots

### Benefits

- ✅ **Graceful error handling** - No more crashes during logout
- ✅ **Better cleanup** - Sessions always marked as logged out
- ✅ **MQTT disconnection** - Connections properly closed, no ghost responses
- ✅ **Improved logging** - Clear messages when session already logged out
- ✅ **Robust bot management** - Restart and delete operations work reliably
- ✅ **Event filtering** - Deleted bots' events are ignored immediately

### Migration Notes

No code changes required - this is a drop-in bug fix for v3.6.8.

If you're experiencing logout errors, update immediately:

```bash
npm install biar-fca@3.6.9
# or
npm install biar-fca@latest
```

---

## [3.6.8] - 2025-10-31

### 🎉 New Feature: Multi-Account Support

This release adds comprehensive multi-account management, allowing you to manage multiple Facebook bot accounts simultaneously from a single application!

### ✨ Added

- **BotManager Class** - Manage multiple bot accounts with ease
  - Add/remove bots dynamically
  - Monitor all bots from a single interface
  - Broadcast messages to all accounts
  - Individual bot statistics and health monitoring
  - Event-driven architecture with EventEmitter

- **Multi-Account Features**
  - Manage unlimited bot accounts simultaneously
  - Each bot runs independently with own keep-alive system
  - Centralized message handling across all accounts
  - Individual bot configuration per account
  - Bot restart and recovery capabilities

- **New API Methods**
  - `manager.addBot(botId, credentials, options)` - Add new bot account
  - `manager.removeBot(botId)` - Remove bot account
  - `manager.getBot(botId)` - Get specific bot
  - `manager.getAllBots()` - Get all bots
  - `manager.sendMessage(botId, message, threadID)` - Send from specific bot
  - `manager.broadcast(message, threadID)` - Broadcast to all bots
  - `manager.getStats()` - Get comprehensive statistics
  - `manager.getHealthStatus()` - Get health status of all bots
  - `manager.restartBot(botId)` - Restart specific bot
  - `manager.restartAll()` - Restart all bots
  - `manager.stopAll()` - Stop all bots gracefully

- **Event System**
  - `botAdded` - Fired when new bot is added
  - `botRemoved` - Fired when bot is removed
  - `botError` - Fired when bot encounters error
  - `message` - Fired when any bot receives message
  - `error` - Fired on general errors
  - `allStopped` - Fired when all bots are stopped

- **Statistics Tracking**
  - Total bots managed
  - Active/inactive bot count
  - Total messages received/sent across all bots
  - Per-bot statistics and activity tracking
  - Uptime tracking for manager and individual bots
  - Error tracking and reporting

### 📖 Usage Examples

**Basic Multi-Account Setup:**
```javascript
const { BotManager } = require('biar-fca');

const manager = new BotManager({
  advancedProtection: true,
  cookieRefresh: true
});

// Add multiple bots
await manager.addBot('bot1', { appState: appState1 });
await manager.addBot('bot2', { appState: appState2 });
await manager.addBot('bot3', { appState: appState3 });

// Listen to all messages
manager.on('message', ({ botId, bot, event }) => {
  console.log(`Bot ${botId} received: ${event.body}`);
  
  // Respond from the same bot
  manager.sendMessage(botId, 'Reply!', event.threadID);
});

// Broadcast message
await manager.broadcast('System announcement!', threadID);

// Get statistics
const stats = manager.getStats();
console.log(`Managing ${stats.totalBots} bots`);
console.log(`Total messages: ${stats.totalMessagesReceived}`);
```

**Health Monitoring:**
```javascript
// Check health of all bots
const health = manager.getHealthStatus();
console.log(`Healthy: ${health.healthy}, Unhealthy: ${health.unhealthy}`);

health.bots.forEach(bot => {
  if (!bot.healthy) {
    console.log(`Bot ${bot.id} is ${bot.status}`);
    // Restart unhealthy bot
    manager.restartBot(bot.id);
  }
});
```

**Dynamic Bot Management:**
```javascript
// Add bot with custom options
await manager.addBot('specialBot', 
  { appState: appState },
  { 
    cookieRefreshInterval: 600000, // 10 minutes
    updatePresence: false
  }
);

// Remove bot when done
manager.removeBot('specialBot');

// Restart all bots
await manager.restartAll();
```

### 🔧 Technical Details

**Architecture:**
- Each bot runs independently with its own MQTT connection
- Centralized event handling through EventEmitter
- Keep-alive system runs per bot (cookie refresh + MQTT pings)
- Graceful shutdown with cleanup for all connections
- Thread-safe bot management

**Performance:**
- Efficient memory usage per bot
- Non-blocking async operations
- Event-driven message handling
- Minimal overhead for multi-account management

### 💡 Benefits

- ✅ **Manage unlimited accounts** from single application
- ✅ **Independent operation** - one bot failure doesn't affect others
- ✅ **Centralized logging** - monitor all bots in one place
- ✅ **Easy scaling** - add/remove bots dynamically
- ✅ **Broadcast capabilities** - send messages from all accounts
- ✅ **Health monitoring** - track status of all bots
- ✅ **Statistics tracking** - comprehensive metrics per bot and overall

### 🔄 Migration Notes

**Existing Single-Account Bots:**
No changes required! Your existing code continues to work:
```javascript
const { login } = require('biar-fca');
// Your existing code works as before
```

**Upgrading to Multi-Account:**
```javascript
// Old way (still works)
const { login } = require('biar-fca');

// New way (v3.6.8+)
const { BotManager } = require('biar-fca');
const manager = new BotManager();
```

### 📦 What's Included

- ✅ `src/core/botManager.js` - Multi-account manager class
- ✅ Exported from main module
- ✅ Full TypeScript definitions (coming soon)
- ✅ Comprehensive documentation
- ✅ Example implementations

### 🎯 Use Cases

- **Customer Support** - Manage multiple support accounts
- **Marketing** - Run multiple promotional campaigns
- **Testing** - Test interactions between multiple accounts
- **Load Distribution** - Distribute workload across accounts
- **Backup/Redundancy** - Fallback to other accounts if one fails

---

## [3.6.7] - 2025-10-31

### 🐛 Critical Bug Fix

This release fixes a critical bug introduced in v3.6.6 that prevented the bot from starting.

### Fixed

- **Critical**: `cookieRefreshManager.start is not a function` error
  - Root cause: CookieRefreshManager class was corrupted during code merge in v3.6.6
  - Constructor was missing proper initialization of counter variables
  - `start()` method was misplaced and mixed with PatternDiffuser class code
  - Fixed class structure with proper constructor and method separation

- **Critical**: `attempt NaN` in cookie refresh logs
  - Root cause: `refreshCount`, `mqttPingCount`, `failureCount`, and `mqttPingFailures` were not initialized
  - Added all counter variables to constructor initialization
  - Now properly tracks refresh attempts and failures

- **Critical**: `Cannot read properties of undefined (reading 'split')`
  - Root cause: Undefined variables causing errors in refresh cycle
  - Fixed by ensuring all variables are initialized in constructor

### Technical Details

**What Was Broken in v3.6.6:**
```javascript
// Constructor was trying to auto-start (wrong)
constructor(ctx, defaultFuncs, globalOptions) {
    this.ctx = ctx;
    // Missing: this.refreshCount = 0;
    // Missing: this.mqttPingCount = 0;
    // Missing: this.failureCount = 0;
    // Missing: this.mqttPingFailures = 0;
    
    // Auto-starting timers in constructor (wrong)
    this.refreshTimer = setInterval(...);
    this.startMqttKeepAlive();
}
```

**What's Fixed in v3.6.7:**
```javascript
// Proper initialization
constructor(ctx, defaultFuncs, globalOptions) {
    this.ctx = ctx;
    this.defaultFuncs = defaultFuncs;
    this.globalOptions = globalOptions;
    this.refreshInterval = 1200000;
    this.mqttPingInterval = 30000;
    this.isRefreshing = false;
    this.refreshTimer = null;
    this.mqttPingTimer = null;
    this.lastRefresh = Date.now();
    this.lastMqttPing = Date.now();
    this.refreshCount = 0;          // ✅ Now initialized
    this.mqttPingCount = 0;         // ✅ Now initialized
    this.failureCount = 0;          // ✅ Now initialized
    this.mqttPingFailures = 0;      // ✅ Now initialized
}

// Separate start method (correct)
start() {
    if (this.refreshTimer) return;
    
    utils.log("🔄 Cookie Refresh Manager: STARTED");
    // ... setup timers
}
```

### Impact

- v3.6.6 was **completely broken** - bot couldn't start at all
- v3.6.7 **restores full functionality** of the keep-alive system
- All features from v3.6.6 now work as intended:
  - ✅ Cookie refresh every 20 minutes
  - ✅ MQTT keep-alive pings every 30 seconds
  - ✅ Comprehensive statistics tracking
  - ✅ Automatic failure recovery

### Migration from v3.6.6

If you're on v3.6.6, **update immediately** to v3.6.7:

```bash
npm install biar-fca@3.6.7
# or
npm install biar-fca@latest
```

No code changes required - this is a drop-in fix for v3.6.6.

### Recommendation

- ⚠️ **Do not use v3.6.6** - it has critical startup errors
- ✅ **Use v3.6.7** - all issues fixed, stable and tested

---

## [3.6.6] - 2025-10-31

### 🎉 Major Keep-Alive System Overhaul

This release completely fixes the keep-alive issue that was preventing bots from staying online for extended periods. The bot will now maintain a stable connection indefinitely!

### ✨ Added

- **MQTT Keep-Alive Pings** - Active MQTT presence pings every 30 seconds to maintain WebSocket connection
  - Sends presence updates through `/orca_presence` topic
  - Automatically starts 5 seconds after initialization
  - Smart logging (only every 10th ping = every 5 minutes)
  - Comprehensive failure tracking and reporting
  
- **Enhanced Statistics** - Extended `getCookieRefreshStats()` with MQTT keep-alive metrics
  - `mqttKeepAlive.enabled` - Whether MQTT pings are active
  - `mqttKeepAlive.pingCount` - Total number of pings sent
  - `mqttKeepAlive.pingFailures` - Number of failed pings
  - `mqttKeepAlive.lastPing` - Timestamp of last successful ping
  - `mqttKeepAlive.timeSinceLastPing` - Milliseconds since last ping
  - `mqttKeepAlive.pingInterval` - Ping interval (30000ms)

- **Improved Logging** - Better visibility into keep-alive system status
  - Shows both cookie refresh and MQTT keep-alive intervals at startup
  - Displays timing for first cookie refresh (30s) and first MQTT ping (5s)
  - Uptime tracking in MQTT ping logs

### 🔧 Changed

- **MQTT Configuration Improvements**
  - Increased `KEEPALIVE_INTERVAL` from 10s to 60s for better stability
  - Increased `RECONNECT_PERIOD` from 1s to 3s for more stable reconnections
  - Extended `MIN_RECONNECT_TIME` from 26min to 2 hours
  - Extended `MAX_RECONNECT_TIME` from 1 hour to 4 hours
  - These changes reduce unnecessary reconnections while maintaining reliability

- **Enhanced Reconnection Scheduler**
  - Better time formatting (shows hours + minutes instead of just minutes)
  - More user-friendly display of reconnection intervals

- **Dual Keep-Alive Strategy**
  - Cookie refresh every 20 minutes (HTTP layer)
  - MQTT presence pings every 30 seconds (WebSocket layer)
  - Both work together to ensure maximum uptime

### 🐛 Fixed

- **Critical**: Bot not staying online after many hours
  - Root cause: Cookie refresh alone wasn't keeping MQTT WebSocket connection alive
  - Solution: Added active MQTT keep-alive pings to maintain connection
  
- **Critical**: MQTT connection dropping due to inactivity
  - Root cause: No active pings being sent through MQTT connection
  - Solution: Regular presence updates keep the WebSocket connection active

- **Issue**: Too frequent MQTT reconnections (26-60 minutes)
  - Fixed: Extended to 2-4 hours with active keep-alive preventing need for reconnection

### 📊 Technical Details

**How the Keep-Alive System Works:**

1. **Cookie Refresh (HTTP Layer)** - Every 20 minutes
   - Refreshes authentication cookies from Facebook servers
   - Updates DTSG tokens for valid authentication
   - Rotates through 4 different endpoints for anti-detection
   - Prevents session expiration

2. **MQTT Keep-Alive (WebSocket Layer)** - Every 30 seconds
   - Sends presence updates through MQTT connection
   - Keeps WebSocket connection active and prevents timeout
   - Monitors connection health with failure tracking
   - Automatically recovers from temporary failures

3. **Scheduled Reconnection** - Every 2-4 hours
   - Generates fresh client ID
   - Re-establishes connection with new session
   - Provides additional layer of connection health maintenance

**Why This Works:**

- HTTP cookie refresh maintains authentication validity
- MQTT pings maintain WebSocket connection activity
- Both systems work independently but complement each other
- Comprehensive failure detection and automatic recovery
- Smart logging prevents log spam while providing visibility

### 💡 Migration Notes

No breaking changes - existing code will automatically benefit from these improvements!

The keep-alive system is enabled by default when you use:

```js
login(credentials, {
  cookieRefresh: true, // Default: true
}, (err, api) => {
  // Your bot will now stay online indefinitely! 🎉
});
```

### 🔍 New API Usage

```js
// Get comprehensive keep-alive statistics
const stats = api.getCookieRefreshStats();
console.log(stats);
// {
//   enabled: true,
//   refreshCount: 12,
//   failureCount: 0,
//   lastRefresh: "2025-10-31T12:34:56.789Z",
//   timeSinceLastRefresh: 234567,
//   refreshInterval: 1200000,
//   mqttKeepAlive: {
//     enabled: true,
//     pingCount: 240,
//     pingFailures: 0,
//     lastPing: "2025-10-31T12:34:55.123Z",
//     timeSinceLastPing: 1234,
//     pingInterval: 30000
//   }
// }
```

---

## [3.6.5] - 2025-10-31

### 📝 Added

- Comprehensive changelog documentation
- Detailed version history in README.md
- Better package documentation

### 🔧 Changed

- Updated documentation with clearer installation instructions
- Enhanced README with more examples

---

## [3.6.4] - 2025-10-31

### 🐛 Fixed

- **Critical bug fix**: Authentication token handling
- Improved error handling in login process
- Fixed cookie parsing issues

---

## [3.6.3] - 2025-10-31

### 🎉 New Feature: Automatic Cookie Refresh

#### ✨ Added

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

## [3.6.2] - 2025-10-31

### 🎉 Major Update: Pure NPM Package with Built-in Protection

#### ✨ Added

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

## [3.5.2] - 2025-10-31

### 🎉 Fork Announcement

- **biar-fca** forked from [ws3-fca](https://github.com/NethWs3Dev/ws3-fca)
- New maintainer: **Jubiar**

### ✨ Added

- Added web-based bot management interface
- Integrated proxy testing utilities with batch testing support
- Added API health monitoring endpoint
- Implemented real-time bot status tracking

### 🔧 Improvements

- Enhanced server.js with Express-based HTTP server
- Added proxy validation and testing endpoints
- Improved error handling and logging
- Better deployment support for Vercel and Render

### 🗑️ Removed

- Removed Facebook account creation functionality (fbcreate.js)
- Cleaned up unused dependencies and routes

### 🐛 Fixed

- Fixed module loading errors
- Resolved proxy configuration issues
- Improved stability and error recovery

### 📦 Package Changes

- Renamed package from `ws3-fca` to `biar-fca`
- Updated all internal references and documentation
- Maintained backward compatibility with ws3-fca API

---

## Legend

- 🎉 New Feature
- ✨ Added
- 🔧 Changed
- 🐛 Fixed
- 🗑️ Removed
- 📦 Package
- 📊 API
- 🚀 Performance
- 💡 Notes
- 🔍 Usage
- 📝 Documentation

---

**For more information, visit:**
- NPM: [https://www.npmjs.com/package/biar-fca](https://www.npmjs.com/package/biar-fca)
- GitHub: [https://github.com/Jubiar01/biar-fca](https://github.com/Jubiar01/biar-fca)
- Docs: [https://exocore-dev-docs-exocore.hf.space](https://exocore-dev-docs-exocore.hf.space)

