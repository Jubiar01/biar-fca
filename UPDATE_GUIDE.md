# 🔄 Update & Republish Guide for biar-fca

Quick reference for updating your npm package.

---

## 🚀 Quick Update Process

```bash
# 1. Make your code changes

# 2. Update version
npm version patch    # Bug fixes: 3.5.2 → 3.5.3
npm version minor    # New features: 3.5.2 → 3.6.0
npm version major    # Breaking changes: 3.5.2 → 4.0.0

# 3. Publish
npm publish

# 4. Push to GitHub
git push
git push --tags
```

---

## 📝 Detailed Workflow

### **Before Making Changes**

1. Pull latest changes from GitHub:
```bash
git pull origin main
```

2. Create a new branch (optional but recommended):
```bash
git checkout -b feature/my-update
```

### **After Making Changes**

#### **Step 1: Test Your Changes**

```bash
# Test locally
node login.js

# Or test the module
npm test
```

#### **Step 2: Update README Changelog**

Edit `README.md` and add your changes to the changelog:

```markdown
### Version 3.5.3 - November 1, 2025

#### 🐛 Bug Fixes
- Fixed login timeout issue
- Resolved proxy connection error

#### ✨ New Features
- Added support for custom user agents
```

#### **Step 3: Commit Your Changes**

```bash
git add .
git commit -m "Fix: Resolved login timeout and proxy issues"
```

#### **Step 4: Bump Version**

```bash
# Choose based on your changes:
npm version patch    # For bug fixes
npm version minor    # For new features
npm version major    # For breaking changes
```

This automatically:
- Updates `package.json` version
- Creates a git commit
- Creates a git tag

#### **Step 5: Publish to NPM**

```bash
npm publish
```

**Expected Output:**
```
+ biar-fca@3.5.3
```

#### **Step 6: Push to GitHub**

```bash
git push origin main
git push --tags
```

If you created a branch, merge it first:
```bash
git checkout main
git merge feature/my-update
git push origin main
git push --tags
```

---

## 🎯 Version Number Decision Guide

### **Patch (3.5.2 → 3.5.3)**
Use for:
- ✅ Bug fixes
- ✅ Security patches
- ✅ Documentation updates
- ✅ Minor performance improvements
- ✅ Typo corrections

```bash
npm version patch
```

### **Minor (3.5.2 → 3.6.0)**
Use for:
- ✅ New features (backward compatible)
- ✅ New API methods
- ✅ Deprecating features (but still working)
- ✅ Significant improvements
- ✅ New options/configurations

```bash
npm version minor
```

### **Major (3.5.2 → 4.0.0)**
Use for:
- ✅ Breaking changes
- ✅ Removing deprecated features
- ✅ Changing API signatures
- ✅ Major architectural changes
- ✅ Incompatible with previous versions

```bash
npm version major
```

---

## 🔍 Before Publishing Checklist

- [ ] Code changes tested locally
- [ ] `login.js` works correctly
- [ ] README.md changelog updated
- [ ] No console.log debugging statements left
- [ ] Version number appropriate for changes
- [ ] Git committed all changes

---

## 📦 Test Package Before Publishing

### **Option 1: Test with npm pack**

```bash
# Create a tarball
npm pack

# Install in test directory
cd /path/to/test/dir
npm install /path/to/biar-fca/biar-fca-3.5.3.tgz

# Test it
node test.js
```

### **Option 2: Test with npm link**

```bash
# In your biar-fca directory
npm link

# In your test project
npm link biar-fca

# Test it
const { login } = require("biar-fca");
```

---

## 🐛 Common Issues & Solutions

### **Issue: "Version already published"**

```bash
# You need to bump the version first
npm version patch
npm publish
```

### **Issue: "Need to login"**

```bash
npm login
# Enter credentials
npm publish
```

### **Issue: "Git working directory not clean"**

```bash
# Commit or stash changes first
git add .
git commit -m "Your changes"
# Then bump version
npm version patch
```

### **Issue: "No git repository"**

```bash
# Initialize git first
git init
git add .
git commit -m "Initial commit"
# Then use npm version
```

### **Issue: Want to skip git operations**

```bash
# Use --no-git-tag-version flag
npm version patch --no-git-tag-version
# But then you need to manually commit and tag
```

---

## 📊 Check Your Package After Publishing

### **View on NPM**

```bash
npm view biar-fca
```

### **Check Latest Version**

```bash
npm view biar-fca version
```

### **Check All Versions**

```bash
npm view biar-fca versions
```

### **Check Download Stats**

```bash
npm view biar-fca dist-tags
```

Or visit:
- Package page: https://www.npmjs.com/package/biar-fca
- Download stats: https://npmtrends.com/biar-fca

---

## 🔄 Example Update Scenarios

### **Scenario 1: Fixed a Bug**

```bash
# 1. Fixed the bug in src/core/client.js
# 2. Test it
node login.js

# 3. Update README changelog
# Add: "Fixed login timeout issue"

# 4. Commit
git add .
git commit -m "Fix: Resolved login timeout issue"

# 5. Bump patch version
npm version patch
# Output: v3.5.3

# 6. Publish
npm publish

# 7. Push
git push && git push --tags
```

### **Scenario 2: Added New Feature**

```bash
# 1. Added new feature in src/deltas/apis/
# 2. Test it

# 3. Update README changelog
# Add: "Added support for group polls"

# 4. Commit
git add .
git commit -m "Feature: Add group poll support"

# 5. Bump minor version
npm version minor
# Output: v3.6.0

# 6. Publish
npm publish

# 7. Push
git push && git push --tags
```

### **Scenario 3: Breaking Change**

```bash
# 1. Made breaking changes to API
# 2. Update README with migration guide

# 3. Commit
git add .
git commit -m "Breaking: Changed login method signature"

# 4. Bump major version
npm version major
# Output: v4.0.0

# 5. Publish
npm publish

# 6. Push
git push && git push --tags
```

---

## 📢 Announcing Updates

After publishing, consider:

1. **Update GitHub Release Notes**
   - Go to: https://github.com/Jubiar01/biar-fca/releases
   - Create new release with tag (e.g., v3.5.3)
   - Add changelog

2. **Social Media** (Optional)
   - Tweet about the update
   - Post in relevant communities

3. **Notify Users** (Optional)
   - If you have a Discord/Telegram
   - Email list

---

## 🔐 Beta/Alpha Versions (Advanced)

### **Publish a Beta Version**

```bash
# Update version to beta
npm version prerelease --preid=beta
# Output: v3.5.3-beta.0

# Publish with beta tag
npm publish --tag beta

# Users install with:
npm install biar-fca@beta
```

### **Publish an Alpha Version**

```bash
npm version prerelease --preid=alpha
npm publish --tag alpha
```

### **Promote Beta to Stable**

```bash
# Remove -beta suffix
npm version patch
npm publish
```

---

## 💾 Rollback (If Something Goes Wrong)

### **Option 1: Deprecate Bad Version**

```bash
npm deprecate biar-fca@3.5.3 "Please upgrade to 3.5.4 - fixes critical bug"
```

### **Option 2: Unpublish (within 72 hours)**

```bash
# Only works within 72 hours!
npm unpublish biar-fca@3.5.3
```

### **Option 3: Publish Fixed Version**

```bash
# Fix the issue
npm version patch
npm publish
```

---

## 📝 Best Practices

1. ✅ **Always test before publishing**
2. ✅ **Update changelog with every release**
3. ✅ **Use semantic versioning correctly**
4. ✅ **Write clear commit messages**
5. ✅ **Tag releases on GitHub**
6. ✅ **Keep README updated**
7. ✅ **Respond to issues quickly**
8. ✅ **Document breaking changes clearly**

---

## 🆘 Need Help?

- NPM Docs: https://docs.npmjs.com/cli/v8/commands/npm-version
- Semantic Versioning: https://semver.org/
- GitHub Releases: https://docs.github.com/en/repositories/releasing-projects-on-github

---

**Happy Publishing! 🚀**

