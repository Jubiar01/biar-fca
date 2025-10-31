# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 3.5.x   | :white_check_mark: |
| < 3.5   | :x:                |

## Reporting a Vulnerability

The biar-fca team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings.

### How to Report a Security Vulnerability?

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **Email**: Contact the maintainers directly on Facebook:
   - [@Kenneth Aceberos](https://www.facebook.com/Neth.Ace.7/)
   - [@Johnsteve Costaños](https://www.facebook.com/johnstevecostanos2025/)
   - [@Jonell Magallanes](https://www.facebook.com/ccprojectsjonell10/)

2. **GitHub Security Advisories**: Use the [GitHub Security Advisory](https://github.com/NethWs3Dev/ws3-fca/security/advisories) feature

### What to Include in Your Report

Please include the following information:

- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability, including how an attacker might exploit it

### What to Expect

- **Acknowledgment**: We'll acknowledge receipt of your vulnerability report within 48 hours
- **Updates**: We'll send you regular updates about our progress
- **Disclosure**: We'll notify you when the vulnerability is fixed
- **Credit**: If you wish, we'll publicly credit you for the discovery

### Security Best Practices for Users

When using biar-fca, follow these security best practices:

#### 1. Protect Your Credentials

```javascript
// ❌ DON'T commit credentials to version control
const appState = require('./appstate.json');

// ✅ DO use environment variables or secure storage
const appState = JSON.parse(process.env.APPSTATE);
```

#### 2. Use .gitignore

Ensure your `.gitignore` includes:

```
appstate.json
*.env
.env.*
fb_dtsg_data.json
```

#### 3. Rotate Credentials Regularly

- Change your Facebook password periodically
- Regenerate appstate.json after password changes
- Don't share appstate.json files

#### 4. Keep Dependencies Updated

```bash
# Check for outdated packages
npm outdated

# Update packages
npm update

# Audit for vulnerabilities
npm audit
npm audit fix
```

#### 5. Use HTTPS and Proxies Carefully

```javascript
// If using a proxy, ensure it's trusted
login(credentials, {
  proxy: 'https://trusted-proxy.com:8080'
}, callback);
```

#### 6. Validate User Input

Always validate and sanitize user input before sending messages:

```javascript
function sanitizeMessage(msg) {
  // Remove potentially harmful content
  return msg.trim().slice(0, 1000);
}

api.sendMessageMqtt(sanitizeMessage(userInput), threadID);
```

#### 7. Rate Limiting

Implement rate limiting to avoid triggering Facebook's security measures:

```javascript
const rateLimit = require('p-ratelimit');
const limit = rateLimit({
  interval: 1000,  // 1 second
  rate: 1          // 1 request per interval
});

async function sendWithRateLimit(msg, threadID) {
  await limit();
  return api.sendMessageMqtt(msg, threadID);
}
```

#### 8. Error Handling

Don't expose sensitive information in error messages:

```javascript
api.sendMessageMqtt(msg, threadID, (err, info) => {
  if (err) {
    console.error('Failed to send message'); // Generic message
    // Log detailed error securely, not to users
    logger.error(err);
  }
});
```

## Known Security Considerations

### Facebook's Terms of Service

- This library automates interactions with Facebook
- Using automation may violate Facebook's Terms of Service
- Your account may be restricted or banned
- Use at your own risk

### Cookie Security

- `appstate.json` contains sensitive session cookies
- Treat it like a password
- Never share or commit it to version control
- Store it securely with appropriate file permissions

### Network Security

- All communication with Facebook uses HTTPS
- Consider using a VPN for additional privacy
- Be cautious with public WiFi networks

## Vulnerability Disclosure Policy

- We follow a coordinated disclosure approach
- Security issues will be patched within 30 days of verification
- CVEs will be requested for significant vulnerabilities
- Public disclosure will occur after patches are released

## Security Updates

Security updates will be released as patch versions (e.g., 3.5.3) and announced:

- In the [CHANGELOG.md](CHANGELOG.md)
- Via GitHub releases
- In the project README

## Attribution

We appreciate security researchers who help keep biar-fca and our users safe:

<!-- Contributors who report security issues will be listed here -->

---

**Thank you for helping keep biar-fca secure!** 🔒

