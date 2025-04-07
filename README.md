<p align="center">
  <img src="https://raw.githubusercontent.com/popeye68/CodeMorpher/main/botpic.png" alt="Bot Logo" width="180" height="180" style="border-radius: 50%;" />
</p>

<h1 align="center">𝗖𝗼𝗱𝗲𝗠𝗼𝗿𝗽𝗵𝗲𝗿</h1>
<p align="center">Your all-in-one Telegram bot for secure code obfuscation and deobfuscation in multiple languages.</p>

<p align="center">
  <a href="https://t.me/CodeMorpherbot"><strong>Try Bot</strong></a> • 
  <a href="#commands">Commands</a> • 
  <a href="#features">Features</a> • 
  <a href="#installation">Install</a> • 
  <a href="#deployment">Deploy</a>
</p>

---

## 🔧 Features

- Obfuscates & deobfuscates code in multiple formats
- Supports: JavaScript, Node.js, Python, PHP, HTML, CSS, JSON, XML
- Base64-style custom obfuscation & deobfuscation
- File + message support
- Intelligent language detection
- Clean & minimal interface
- Ready for production (Koyeb, Railway, etc.)

---

## 🤖 Bot Link

**[𝗖𝗼𝗱𝗲𝗠𝗼𝗿𝗽𝗵𝗲𝗿](https://t.me/CodeMorpherbot)**
---

## 📜 Commands

```bash
/start         → Welcome message + info
/help          → Command usage guide
/javascript    → Obfuscate JavaScript code
/py            → Obfuscate Python code
/php           → Obfuscate PHP code
/html or /web  → Obfuscate HTML or web-based code
/css           → Obfuscate CSS code
/json          → Obfuscate JSON in base64 style
/xml           → Obfuscate XML in base64 style

/decryptjs     → Deobfuscate JavaScript code
/depy          → Deobfuscate Python base64/eval
/dephp         → Deobfuscate PHP base64/eval
/deweb or /dehtml → Deobfuscate HTML
/decss         → Deobfuscate CSS
/dejson        → Deobfuscate JSON
/dexml         → Deobfuscate XML

/obfuscate     → Base64-style obfuscation for text or file
/deobfuscate   → Deobfuscate base64-style
```

---

## ⚙️ Installation (Manual)

```bash
git clone https://github.com/yourusername/CodeMorpher.git
cd CodeMorpher
npm install
touch .env
# Add your bot token in .env like:
# TOKEN=your_bot_token_here
node index.js
```
---

---

## 🚀 Deploy Now

Deploy the bot easily on your favorite platform:

### ▶️ Koyeb

[![Deploy to Koyeb](https://www.koyeb.com/static/images/deploy/button.svg)](https://app.koyeb.com/deploy?type=git&repository=github.com/yourusername/CodeMorpher)

### ▶️ Railway

[![Deploy on Railway](https://img.shields.io/badge/Deploy-Railway-000?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app/new)

### ▶️ Heroku

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/yourusername/CodeMorpher)

### ▶️ Replit

[![Run on Replit](https://replit.com/badge/github/yourusername/CodeMorpher)](https://replit.com/github/yourusername/CodeMorpher)

---


## ⚙️ Vercel Object Storage (VOS) Setup (Optional)

1. Go to [Vercel Storage](https://vercel.com/storage)
2. Create a new Blob or KV instance.
3. Store user files or logs (if required) with signed URLs.
4. Integrate with your `.env`:
   ```
   VERCEL_TOKEN=your_token
   VOS_BUCKET=your_bucket
   ```

---

## ✨ Features

- Supports multiple programming languages.
- Obfuscates and deobfuscates code.
- Handles both text and file inputs.
- Shows processing percentage.
- Sends result as downloadable files.
- Stylish UI with custom bot image.
- Supports replying to messages for seamless obfuscation.
- No file storage on disk – memory-efficient and deploy-ready.
- All features built using **Node.js**.

---

## 📁 Folder Structure

```bash
.
├── index.js
├── .env
├── package.json
├── package-lock.json
├── procfile
```

---

## 🛠️ Tech Stack

- Node.js
- node-telegram-bot-api
- javascript-obfuscator
- pyarmor
- fetch / base64 / custom utils

---

## 🤝 Contributing

Contributions, issues and feature requests are welcome!
Feel free to check [issues page](../../issues) or open a PR.

---

## ⭐ Star This Repo

If you liked this project, please consider starring the repo!

[![Star this repo](https://img.shields.io/github/stars/popeye68/CodeMorpher.svg?style=social)](https://github.com/yourusername/CodeMorpher)

---

## 📜 License

This project is licensed under [MIT](LICENSE).

---
