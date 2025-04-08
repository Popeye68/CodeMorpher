const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { execSync } = require('child_process');
const beautify = require('js-beautify').js;
const { exec } = require('child_process');
const atob = str => Buffer.from(str, 'base64').toString();
const { v4: uuidv4 } = require('uuid');
const { Buffer } = require('buffer');
const fetch = require('node-fetch');
require('dotenv').config();
const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });


// Obfuscate & Deobfuscate logic
function obfuscate(text) {
  return text
    .split(/\s+/)
    .map(word => '_' + Buffer.from(word).toString('base64'))
    .join(' ');
}

function deobfuscate(text) {
  return text
    .split(/\s+/)
    .map(word => {
      if (word.startsWith('_')) {
        try {
          return Buffer.from(word.slice(1), 'base64').toString();
        } catch {
          return word;
        }
      }
      return word;
    })
    .join(' ');
}

// Instructions
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  const startText = `
*👋 Welcome to CodeMorpher Bot!*

Transform, protect, and decode your source code with style.
Whether you're an ethical hacker, developer, or just exploring — this bot has your back.

*What can it do?*
• Obfuscate JavaScript, Python, PHP, HTML, CSS, JSON, XML
• Deobfuscate complex patterns (base64, eval, etc.)
• Protect source code using real obfuscation techniques
• Beautify minified or encoded JavaScript
• And more!

Use /help to explore all features.

_Developed with love for the dev & hacking community._
`;

  const buttons = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📜 View All Commands', callback_data: 'main_help' }],
        [{ text: '⭐ GitHub Repo', url: 'https://github.com/popeye68/CodeMorpher' }]
      ]
    },
    parse_mode: 'Markdown',
  };

  bot.sendMessage(chatId, startText, buttons);
});



// File handler
async function processFile(fileId, commandType, chatId, ext = '.txt', msgId) {
  const raw = `raw_${Date.now()}${ext}`;
  const out = `${commandType}d_by_CodeMorpher${ext}`;

  try {
    const file = await bot.getFile(fileId);
    const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
    const response = await axios.get(url, { responseType: 'stream' });

    const writer = fs.createWriteStream(raw);
    response.data.pipe(writer);

    writer.on('finish', () => {
      const content = fs.readFileSync(raw, 'utf8');
      const result = commandType === 'obfuscate' ? obfuscate(content) : deobfuscate(content);
      fs.writeFileSync(out, result);

      bot.sendDocument(chatId, out).then(() => {
        fs.unlinkSync(raw);
        fs.unlinkSync(out);
        if (msgId) bot.deleteMessage(chatId, msgId); // delete old command
      });
    });

    writer.on('error', () => {
      bot.sendMessage(chatId, '❌ Error processing the file.');
    });
  } catch (err) {
    bot.sendMessage(chatId, '❌ Could not fetch the file.');
  }
}

// /obfuscate and /deobfuscate
['obfuscate', 'deobfuscate'].forEach(cmd => {
  bot.onText(new RegExp(`/${cmd}(?:\\s+(.+))?`), async (msg, match) => {
    const chatId = msg.chat.id;
    const text = match[1];
    const reply = msg.reply_to_message;

    const processText = t => {
      const result = cmd === 'obfuscate' ? obfuscate(t) : deobfuscate(t);
      bot.sendMessage(chatId, `<b>${cmd === 'obfuscate' ? 'Obfuscated' : 'Deobfuscated'}:</b>\n<pre>${result}</pre>`, {
        parse_mode: 'HTML'
      }).then(() => {
        bot.deleteMessage(chatId, msg.message_id);
      });
    };

    if (text) return processText(text);
    if (reply && reply.text) return processText(reply.text);

    if (reply?.document) {
      const fileId = reply.document.file_id;
      const ext = path.extname(reply.document.file_name || '.txt');
      return processFile(fileId, cmd, chatId, ext, msg.message_id);
    }

    bot.sendMessage(chatId, '⚠️ Please send some text or reply to a file/text to use this command.');
  });
});

const JavaScriptObfuscator = require('javascript-obfuscator');


function obfuscateJavaScript(code) {
  const obfuscated = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: true
  });
  return obfuscated.getObfuscatedCode();
}

bot.onText(/^\/javascript(?:\s+([\s\S]+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  let code = match[1];
  const reply = msg.reply_to_message;

  // 1. Reply to a document (.js file or similar)
  if (!code && reply?.document) {
    try {
      const file = await bot.getFile(reply.document.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
      const res = await axios.get(fileUrl);
      code = res.data;
    } catch (err) {
      return bot.sendMessage(chatId, '❌ Failed to read the file.');
    }
  }

  // 2. Reply to a text message
  if (!code && reply?.text) {
    code = reply.text;
  }

  // 3. No input fallback
  if (!code) {
    return bot.sendMessage(chatId, '⚠️ Please provide or reply with JavaScript code to obfuscate.');
  }

  try {
    const obfuscatedCode = obfuscateJavaScript(code);
    const fileName = 'obfuscated_by_CodeMorpher.js';
    fs.writeFileSync(fileName, obfuscatedCode);

    await bot.sendDocument(chatId, fileName, {
      caption: '✅ Here is your obfuscated JavaScript (runnable) code.',
    });

    fs.unlinkSync(fileName); // Delete after sending
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, '❌ An error occurred while obfuscating the code.');
  }
});


bot.onText(/^\/decryptjs(?:\s+([\s\S]+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  let code = match[1];

  if (!code && msg.reply_to_message?.document) {
    const fileId = msg.reply_to_message.document.file_id;
    const fileLink = await bot.getFileLink(fileId);
    const res = await fetch(fileLink);
    code = await res.text();
  }

  if (!code && msg.reply_to_message?.text) {
    code = msg.reply_to_message.text;
  }

  if (!code) {
    return bot.sendMessage(chatId, 'Please provide or reply to obfuscated JavaScript code.');
  }

  try {
    const beautified = beautify(code, {
      indent_size: 2,
      space_in_empty_paren: true
    });

    const fileName = 'deobfuscated_by_CodeMorpher.js';
    fs.writeFileSync(fileName, beautified);

    await bot.sendDocument(chatId, fileName, {
      caption: 'Here is your beautified (partially deobfuscated) JavaScript code.',
    });

    fs.unlinkSync(fileName);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, '❌ Failed to beautify the code.');
  }
});

function obfuscatePython(code) {
  const encoded = Buffer.from(code).toString('base64');
  return `import base64\nexec(base64.b64decode("${encoded}").decode())`;
}

bot.onText(/^\/py(?:\s+([\s\S]+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  let code = match[1];

  if (!code && msg.reply_to_message?.text) {
    code = msg.reply_to_message.text;
  }

  if (!code && msg.reply_to_message?.document) {
    const fileId = msg.reply_to_message.document.file_id;
    const fileLink = await bot.getFileLink(fileId);
    const res = await fetch(fileLink);
    code = await res.text();
  }

  if (!code) return bot.sendMessage(chatId, 'Please provide or reply to some Python code to obfuscate.');

  try {
    const obfuscated = obfuscatePython(code);
    const fileName = `obfuscated_by_CodeMorpher.py`;
    fs.writeFileSync(fileName, obfuscated);

    await bot.sendDocument(chatId, fileName, {
      caption: 'Here is your obfuscated (runnable) Python code.',
    });

    fs.unlinkSync(fileName); 
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, '❌ Failed to obfuscate the Python code.');
  }
});


function advancedDeobfuscate(code) {
  try {
    let current = code;
    let changed = true;
    let limit = 10;

    while (changed && limit-- > 0) {
      changed = false;

      const base64Matches = current.match(/base64\.b64decode\((?:b?r?['"])([A-Za-z0-9+/=]+)(?:['"])\)/g);
      if (base64Matches) {
        for (const match of base64Matches) {
          const b64 = match.match(/['"]([A-Za-z0-9+/=]+)['"]/)[1];
          try {
            const decoded = Buffer.from(b64, 'base64').toString('utf8');
            current = current.replace(match, `"${decoded}"`);
            changed = true;
          } catch {}
        }
      }
      
      current = current
        .replace(/exec\((.*?)\)/g, '$1')
        .replace(/eval\((.*?)\)/g, '$1')
        .replace(/compile\((.*?)\)/g, '$1');
    }

    return current;
  } catch (err) {
    return code;
  }
}

bot.onText(/^\/depy(?:\s+([\s\S]+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  let code = match[1];

  // If user replies to a file
  if (!code && msg.reply_to_message?.document) {
    const fileId = msg.reply_to_message.document.file_id;
    const fileLink = await bot.getFileLink(fileId);
    const res = await fetch(fileLink);
    code = await res.text();
  }

  // If user replies to text
  if (!code && msg.reply_to_message?.text) {
    code = msg.reply_to_message.text;
  }

  if (!code) return bot.sendMessage(chatId, '⚠️ Please reply to or send obfuscated Python code.');

  try {
    const cleanCode = advancedDeobfuscate(code);
    const filename = `deobfuscated_by_CodeMorpher.py`;

    fs.writeFileSync(filename, cleanCode);
    await bot.sendDocument(chatId, filename, {
      caption: '✅ Python code deobfuscated.',
    });
    fs.unlinkSync(filename);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, '❌ Failed to deobfuscate the code.');
  }
});


function obfuscatePHP(code) {
  const base64 = Buffer.from(code).toString('base64');
  return `<?php eval(base64_decode('${base64}')); ?>`;
}

bot.onText(/^\/php(?:\s+([\s\S]+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const inputText = match[1];
  let code = inputText;

  try {
    // Handle file reply
    if (!code && msg.reply_to_message?.document) {
      const fileId = msg.reply_to_message.document.file_id;
      const fileLink = await bot.getFileLink(fileId);
      const res = await fetch(fileLink);
      code = await res.text();
    }

    // Handle text reply
    if (!code && msg.reply_to_message?.text) {
      code = msg.reply_to_message.text;
    }

    if (!code) {
      return bot.sendMessage(chatId, 'Please provide some PHP code or reply to a PHP file/text.');
    }

    const obfuscated = obfuscatePHP(code);
    const filename = `obfuscated_by_CodeMorpher.php`;
    fs.writeFileSync(filename, obfuscated);

    await bot.sendDocument(chatId, filename, {
      caption: 'Here is your obfuscated PHP code.',
    });

    fs.unlinkSync(filename);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, '❌ Failed to obfuscate the PHP code.');
  }
});



function deobfuscatePHP(code) {
  const base64Match = code.match(/base64_decode\s*\(\s*['"]([^'"]+)['"]\s*\)/);
  if (!base64Match) return null;

  const base64 = base64Match[1];
  const decoded = Buffer.from(base64, 'base64').toString();
  return decoded;
}

bot.onText(/^\/dephp(?:\s+([\s\S]+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const inputText = match[1];
  let code = inputText;

  try {
    // If replying to a file
    if (!code && msg.reply_to_message?.document) {
      const fileId = msg.reply_to_message.document.file_id;
      const fileLink = await bot.getFileLink(fileId);
      const res = await fetch(fileLink);
      code = await res.text();
    }

    if (!code && msg.reply_to_message?.text) {
      code = msg.reply_to_message.text;
    }

    if (!code) {
      return bot.sendMessage(chatId, 'Please provide or reply to obfuscated PHP code.');
    }

    const deobfuscated = deobfuscatePHP(code);
    if (!deobfuscated) {
      return bot.sendMessage(chatId, '❌ Failed to detect base64 obfuscated PHP code.');
    }

    const filename = `deobfuscated_by_CodeMorpher.php`;
    fs.writeFileSync(filename, deobfuscated);

    await bot.sendDocument(chatId, filename, {
      caption: 'Here is your deobfuscated PHP code.',
    });

    fs.unlinkSync(filename);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, '❌ An error occurred while deobfuscating the PHP code.');
  }
});


bot.onText(/^\/(web|html)(?:\s+([\s\S]+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const inputText = match[2];
  const reply = msg.reply_to_message;
  const cmd = match[1];

  let content = inputText;

  if (!content && reply?.text) {
    content = reply.text;
  }

  if (!content && reply?.document) {
    const fileId = reply.document.file_id;
    const fileLink = await bot.getFileLink(fileId);
    const res = await fetch(fileLink);
    content = await res.text();
  }

  if (!content || content.trim() === '') {
    return bot.sendMessage(chatId, `❌ Please provide or reply to some HTML/JS code.`);
  }

  try {
    const base64 = Buffer.from(content, 'utf-8').toString('base64');
    const wrappedHTML = `
<!DOCTYPE html>
<html>
  <head><meta charset="UTF-8"><title>Obfuscated Web</title></head>
  <body>
    <script>
      document.write(decodeURIComponent(escape(atob("${base64}"))));
    </script>
  </body>
</html>`.trim();

    const fileName = `obfuscated_by_CodeMorpher.html`;
    fs.writeFileSync(fileName, wrappedHTML);

    await bot.sendDocument(chatId, fileName, {
      caption: `✅ Obfuscated HTML/JS file.`,
    });

    fs.unlinkSync(fileName);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, '❌ Failed to process the HTML/JS content.');
  }
});


// Function to deobfuscate HTML (beautify)
function deobfuscateHTML(code) {
  return beautify(code, {
    indent_size: 2,
    space_in_empty_paren: true
  });
}

bot.onText(/^\/(deweb|dehtml)(?:\s+([\s\S]+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const inputText = match[2];
  let code = inputText;

  if (!code && msg.reply_to_message?.document) {
    const fileId = msg.reply_to_message.document.file_id;
    const fileLink = await bot.getFileLink(fileId);
    const response = await fetch(fileLink);
    code = await response.text();
  }

  // If command is a reply to text
  if (!code && msg.reply_to_message?.text) {
    code = msg.reply_to_message.text;
  }

  if (!code) {
    return bot.sendMessage(chatId, '⚠️ Please provide or reply to obfuscated HTML code.');
  }

  try {
    const deobfuscated = deobfuscateHTML(code);
    const fileName = `deobfuscated_by_CodeMorpher.html`;
    fs.writeFileSync(fileName, deobfuscated);

    await bot.sendDocument(chatId, fileName, {
      caption: 'Here is your deobfuscated HTML code.',
    });

    fs.unlinkSync(fileName); 
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, '❌ Failed to deobfuscate the HTML code.');
  }
});


function obfuscateCSS(code) {
  return code
    .replace(/\s+/g, ' ')
    .replace(/\/\*.*?\*\//g, '')
    .replace(/\s*([:;{}])\s*/g, '$1')
    .replace(/;}/g, '}');
}



function obfuscateCSS(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove comments
    .replace(/\s+/g, ' ') // collapse spaces
    .replace(/\s*([{}:;,])\s*/g, '$1') // remove spaces around symbols
    .replace(/;}/g, '}') // remove last semicolon
    .replace(/([\s:])0(px|em|rem|%|vh|vw)/g, '$10') // 0px to 0
    .replace(/#([a-f0-9])\1([a-f0-9])\2([a-f0-9])\3/gi, '#$1$2$3') // shorten hex
    .trim();
}

bot.onText(/^\/css(?:\s+([\s\S]+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const inputText = match[1];
  let code = inputText;

  try {
    if (!code && msg.reply_to_message?.text) {
      code = msg.reply_to_message.text;
    }

    if (!code && msg.reply_to_message?.document) {
      const fileId = msg.reply_to_message.document.file_id;
      const fileLink = await bot.getFileLink(fileId);
      const response = await fetch(fileLink);
      code = await response.text();
    }

    if (!code) {
      return bot.sendMessage(chatId, 'Please provide or reply to some CSS code.');
    }

    const obfuscated = obfuscateCSS(code);
    const fileName = `obfuscated_by_CodeMorpher.css`;
    fs.writeFileSync(fileName, obfuscated);

    await bot.sendDocument(chatId, fileName, {
      caption: 'Here is your obfuscated CSS code.',
    });

    fs.unlinkSync(fileName);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, '❌ Failed to obfuscate the CSS code.');
  }
});



bot.onText(/^\/decss(?:\s+([\s\S]+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const inputText = match[1];
  let code = inputText;

  try {
    if (!code && msg.reply_to_message?.text) {
      code = msg.reply_to_message.text;
    }

    if (!code && msg.reply_to_message?.document) {
      const fileId = msg.reply_to_message.document.file_id;
      const fileLink = await bot.getFileLink(fileId);
      const response = await fetch(fileLink);
      code = await response.text();
    }

    if (!code) {
      return bot.sendMessage(chatId, 'Please provide or reply to some obfuscated CSS code.');
    }

    const beautified = beautify(code, {
      indent_size: 2,
      end_with_newline: true
    });

    const fileName = `deobfuscated_by_CodeMorpher.css`;
    fs.writeFileSync(fileName, beautified);

    await bot.sendDocument(chatId, fileName, {
      caption: 'Here is your deobfuscated CSS code.',
    });

    fs.unlinkSync(fileName);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, '❌ Failed to deobfuscate the CSS code.');
  }
});

bot.onText(/^\/json(?:\s+([\s\S]+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  let input = match[1];

  try {
    if (!input && msg.reply_to_message?.text) {
      input = msg.reply_to_message.text;
    }

    if (!input && msg.reply_to_message?.document) {
      const fileId = msg.reply_to_message.document.file_id;
      const fileLink = await bot.getFileLink(fileId);
      const res = await fetch(fileLink);
      input = await res.text();
    }

    if (!input) {
      return bot.sendMessage(chatId, 'Please provide or reply to a JSON string or file.');
    }

    try {
      JSON.parse(input);
    } catch (e) {
      return bot.sendMessage(chatId, '❌ Invalid JSON format. Please provide valid JSON.');
    }

    const encoded = Buffer.from(input).toString('base64');
    const finalOutput = `_obf_${encoded}`;
    const fileName = `obfuscated_by_CodeMorpher.json`;

    fs.writeFileSync(fileName, finalOutput);

    await bot.sendDocument(chatId, fileName, {
      caption: 'Here is your Base64-style obfuscated JSON.',
    });

    fs.unlinkSync(fileName);
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, '❌ Failed to process the JSON.');
  }
});

bot.onText(/^\/dejson(?:\s+([\s\S]+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  let input = match[1];

  try {
    if (!input && msg.reply_to_message?.text) {
      input = msg.reply_to_message.text;
    }

    if (!input && msg.reply_to_message?.document) {
      const fileId = msg.reply_to_message.document.file_id;
      const fileLink = await bot.getFileLink(fileId);
      const res = await fetch(fileLink);
      input = await res.text();
    }

    if (!input) {
      return bot.sendMessage(chatId, 'Please provide or reply to an obfuscated JSON string or file.');
    }

    if (!input.startsWith('_obf_')) {
      return bot.sendMessage(chatId, '❌ Input is not in valid obfuscated JSON format.');
    }

    const base64Part = input.replace(/^_obf_/, '');
    const decoded = Buffer.from(base64Part, 'base64').toString('utf-8');

  
    let prettyJSON = decoded;
    try {
      const parsed = JSON.parse(decoded);
      prettyJSON = JSON.stringify(parsed, null, 2);
    } catch {}

    const fileName = `deobfuscated_by_CodeMorpher.json`;
    fs.writeFileSync(fileName, prettyJSON);

    await bot.sendDocument(chatId, fileName, {
      caption: 'Here is your deobfuscated JSON.',
    });

    fs.unlinkSync(fileName);
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, '❌ Failed to deobfuscate the JSON.');
  }
});
bot.onText(/^\/xml(?:\s+([\s\S]+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  let input = match[1];

  try {
    
    if (!input && msg.reply_to_message?.text) {
      input = msg.reply_to_message.text;
    }

    
    if (!input && msg.reply_to_message?.document) {
      const fileId = msg.reply_to_message.document.file_id;
      const fileLink = await bot.getFileLink(fileId);
      const res = await fetch(fileLink);
      input = await res.text();
    }

    if (!input) {
      return bot.sendMessage(chatId, 'Please provide or reply to XML code.');
    }

    const encoded = `_obf_` + Buffer.from(input).toString('base64');
    const fileName = `obfuscated_by_CodeMorpher.xml`;

    fs.writeFileSync(fileName, encoded);

    await bot.sendDocument(chatId, fileName, {
      caption: 'Here is your obfuscated XML.',
    });

    fs.unlinkSync(fileName);
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, '❌ Failed to obfuscate XML.');
  }
});

bot.onText(/^\/dexml(?:\s+([\s\S]+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  let input = match[1];

  if (!input && msg.reply_to_message?.text) {
    input = msg.reply_to_message.text;
  }

  if (!input && msg.reply_to_message?.document) {
    const fileId = msg.reply_to_message.document.file_id;
    const fileLink = await bot.getFileLink(fileId);
    const response = await fetch(fileLink);
    input = await response.text();
  }

  if (!input) {
    return bot.sendMessage(chatId, 'Please provide or reply to obfuscated XML content.');
  }

  try {
    const decoded = Buffer.from(input.replace(/^_obf_/, ''), 'base64').toString('utf-8');

    const fileName = `deobfuscated_by_CodeMorpher.xml`;
    fs.writeFileSync(fileName, decoded);

    await bot.sendDocument(chatId, fileName, {
      caption: 'Here is your deobfuscated XML.',
    });

    fs.unlinkSync(fileName);
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, '❌ Failed to deobfuscate the XML.');
  }
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  const helpText = `
*🤖 CodeMorpher Bot — Help Menu*

Choose a category below to see available commands.
`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🛡️ Obfuscate Commands', callback_data: 'obfuscate_help' }],
        [{ text: '🔍 Deobfuscate Commands', callback_data: 'deobfuscate_help' }],
        [{ text: 'ℹ️ Info & Links', callback_data: 'info_help' }],
      ],
    },
    parse_mode: 'Markdown',
  };

  bot.sendMessage(chatId, helpText, keyboard);
});

bot.on('callback_query', async (query) => {
  const msg = query.message;
  const data = query.data;

  let text = '';
  let buttons = [
    [{ text: '◀️ Back to Help Menu', callback_data: 'main_help' }]
  ];

  if (data === 'obfuscate_help') {
    text = `
*🛡️ Obfuscation Commands*

- \`/javascript\` — Obfuscate JavaScript code
- \`/py\` — Obfuscate Python code
- \`/php\` — Obfuscate PHP code
- \`/html\` or \`/web\` — Obfuscate HTML
- \`/css\` — Obfuscate CSS
- \`/json\` — Base64 encode JSON
- \`/xml\` — Base64 encode XML
- \`/obfuscate\` — Base64-style for plain text
    `;
  } else if (data === 'deobfuscate_help') {
    text = `
*🔍 Deobfuscation Commands*

- \`/decryptjs\` — Beautify JavaScript code
- \`/depy\` — Deobfuscate Python (base64/eval)
- \`/dephp\` — Deobfuscate PHP (base64/eval)
- \`/dehtml\`, \`/deweb\` — Deobfuscate HTML
- \`/decss\` — Deobfuscate CSS
- \`/dejson\` — Decode Base64 JSON
- \`/dexml\` — Decode Base64 XML
- \`/deobfuscate\` — Decode Base64 text
    `;
  } else if (data === 'info_help') {
    text = `
*ℹ️ Info & Commands*

- \`/start\` — Intro and GitHub button
- \`/help\` — Show this help menu

🔗 GitHub: [CodeMorpher on GitHub](https://github.com/popeye68/CodeMorpher)
    `;
  } else if (data === 'main_help') {
    text = `
*🤖 CodeMorpher Bot — Help Menu*

Choose a category below to see available commands.
`;
    buttons = [
      [{ text: '🛡️ Obfuscate Commands', callback_data: 'obfuscate_help' }],
      [{ text: '🔍 Deobfuscate Commands', callback_data: 'deobfuscate_help' }],
      [{ text: 'ℹ️ Info & Links', callback_data: 'info_help' }],
    ];
  }

  await bot.editMessageText(text, {
    chat_id: msg.chat.id,
    message_id: msg.message_id,
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
    reply_markup: { inline_keyboard: buttons },
  });

  bot.answerCallbackQuery(query.id);
});

require('http').createServer((req, res) => res.end('Bot running')).listen(3000);


