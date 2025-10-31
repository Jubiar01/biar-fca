# 🚘 biar-fca

![Image](wiegine.png)

💁 **biar-fca** is a fully refactored Facebook Chat API (FCA) client built for **reliable**, **real-time**, and **modular** interaction with Facebook Messenger. Designed with modern bot development in mind, it offers full control over Messenger automation through a clean, stable interface.

> 🔀 **Forked from [ws3-fca](https://github.com/Irfan430/ws3fca)** - Enhanced and maintained by Jubiar

---

## 📚 Documentation & Feedback

Full documentation and advanced examples:
[https://exocore-dev-docs-exocore.hf.space](https://exocore-dev-docs-exocore.hf.space)

If you encounter issues or want to give feedback, feel free to message us via Facebook:

* [@Kenneth Aceberos](https://www.facebook.com/Neth.Ace.7/)
* [@Johnsteve Costaños](https://www.facebook.com/johnstevecostanos2025/)
* [@Jonell Magallanes 󱢏](https://www.facebook.com/ccprojectsjonell10/)

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

## 🛡️ Anti-Detection Bots

This repository includes **TWO advanced bot implementations** with different anti-detection strategies:

### 🐌 `login_safe.js` - Human Behavior Simulation
**Strategy**: Mimics human typing and reading patterns
- ✅ Typing delays (200-300 chars/min)
- ✅ Reading time simulation
- ✅ Sleep hours (11PM-7AM)
- ✅ Random typos (3% chance)
- ✅ Activity scheduling (peak/slow hours)
- ⏱️ Response time: 2-10 seconds

**Use when**: Maximum safety is priority, you can tolerate delays

```bash
node login_safe.js
```

### ⚡ `login.js` - Technical Obfuscation
**Strategy**: Advanced cryptographic and traffic obfuscation
- 🔐 Session fingerprint management (6hr rotation)
- 🎭 Multi-layer request obfuscation
- 🔀 Adaptive pattern diffusion
- 🛡️ Traffic analysis resistance
- 📊 Real-time account health monitoring
- 🔒 MQTT traffic obfuscation
- ⏱️ Response time: 50-200ms (instant)

**Use when**: You need speed + protection without human simulation

```bash
node login.js
```

📖 **Full comparison**: See [ANTI_DETECTION_GUIDE.md](ANTI_DETECTION_GUIDE.md)

---

## 🚀 Getting Started

### 1. Generate `appstate.json`

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

### 2. Basic Usage Example

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
  randomUserAgent: false
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

### Version 3.5.2 (biar-fca fork) - October 31, 2025

#### 🎉 Fork Announcement
- **biar-fca** forked from [ws3-fca](https://github.com/Irfan430/ws3fca)
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

## 🔗 Related Projects

- **Original ws3-fca**: [https://github.com/Irfan430/ws3fca](https://github.com/Irfan430/ws3fca)
- **Documentation**: [https://exocore-dev-docs-exocore.hf.space](https://exocore-dev-docs-exocore.hf.space)

---

## 📊 License

**MIT** – Free to use, modify, and distribute. Attribution appreciated.

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

**Made with ❤️ by the biar-fca team**
