const TelegramBot = require('node-telegram-bot-api');
const { config, validateConfig } = require('../config/config');
const translationService = require('./translationService');

// Validate configuration before starting
validateConfig();

// Create a new bot instance
const bot = new TelegramBot(config.telegram.token, { polling: true });

// Simple in-memory cache for translations to avoid redundant API calls
const translationCache = new Map();
const CACHE_TTL = config.bot.cacheTTL || 24 * 60 * 60 * 1000; // 24 hours default

function getCachedTranslation(key) {
  if (config.bot.enableCache && translationCache.has(key)) {
    const { translation, timestamp } = translationCache.get(key);
    if (Date.now() - timestamp < CACHE_TTL) {
      console.log(`Cache hit for key: ${key}`);
      return translation;
    }
    translationCache.delete(key);
    console.log(`Cache expired for key: ${key}`);
  }
  return null;
}

function cacheTranslation(key, translation) {
  if (config.bot.enableCache) {
    translationCache.set(key, {
      translation,
      timestamp: Date.now()
    });
    console.log(`Cached translation for key: ${key}`);
  }
}

/**
 * Handle incoming messages for auto-translation
 */
bot.on('message', async (msg) => {
  try {
    if (!msg.text || msg.text.startsWith('/')) {
      return;
    }
    
    if (config.bot.autoTranslate) {
      const isChinese = await translationService.isChinese(msg.text);
      if (isChinese) {
        console.log(`Detected Chinese message from ${msg.from.username || msg.from.id} in chat ${msg.chat.id}${msg.message_thread_id ? ` (topic ${msg.message_thread_id})` : ''}: "${msg.text}"`);
        const cacheKey = `${msg.text}:en`;
        let translation = getCachedTranslation(cacheKey);
        
        if (!translation) {
          translation = await translationService.translateText(msg.text, 'en', 'zh-CN');
          if (translation) {
            cacheTranslation(cacheKey, translation);
          } else {
            console.error('Auto-translation returned null for:', msg.text);
            return;
          }
        }
        
        const replyOptions = { 
            reply_to_message_id: msg.message_id 
        };
        // If the original message is in a topic, reply in the same topic
        if (msg.message_thread_id) {
            replyOptions.message_thread_id = msg.message_thread_id;
        }
        
        await bot.sendMessage(
          msg.chat.id,
          `Original: ${msg.text}\n\n🔄 Translated (ZH → EN):\n${translation}`,
          replyOptions
        );
      }
    }
  } catch (error) {
    console.error('Error handling incoming message for auto-translation:', error);
  }
});

/**
 * Handle /tc command (Translate to Chinese)
 */
bot.onText(/\/tc(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  try {
    let textToTranslate = match ? match[1] : null;
    
    if (!textToTranslate && msg.reply_to_message && msg.reply_to_message.text) {
      textToTranslate = msg.reply_to_message.text;
    }
    
    const commandUsage = '📝 Usage:\n/tc [English text to translate to Chinese]\nOr reply to an English message with /tc';
    if (!textToTranslate) {
      const usageOptions = {};
      if (msg.message_thread_id) {
        usageOptions.message_thread_id = msg.message_thread_id;
      }
      return bot.sendMessage(chatId, commandUsage, usageOptions);
    }
    
    console.log(`Processing /tc command in chat ${chatId}${msg.message_thread_id ? ` (topic ${msg.message_thread_id})` : ''}: EN → ZH for text: "${textToTranslate}" by ${msg.from.username || msg.from.id}`);
    
    const cacheKey = `${textToTranslate}:zh-CN`;
    let translatedText = getCachedTranslation(cacheKey);

    if (!translatedText) {
      translatedText = await translationService.translateText(textToTranslate, 'zh-CN', 'en');
      if (translatedText) {
        cacheTranslation(cacheKey, translatedText);
      } else {
        throw new Error('Translation service returned null for /tc');
      }
    }
    
    const replyOptions = {};
    // If the command was sent in a topic, reply in the same topic
    if (msg.message_thread_id) {
        replyOptions.message_thread_id = msg.message_thread_id;
    }
    // You might also want to reply to the command message itself, or the message it replied to.
    // If replying to the command: replyOptions.reply_to_message_id = msg.message_id;

    await bot.sendMessage(
      chatId,
      `🤖 Bot (EN → ZH):\n\n${translatedText}`,
      replyOptions
    );

  } catch (error) {
    console.error('Error handling /tc command:', error);
    const errorOptions = {};
    if (msg.message_thread_id) {
        errorOptions.message_thread_id = msg.message_thread_id;
    }
    bot.sendMessage(chatId, '❌ Error translating your message to Chinese. Please try again.', errorOptions);
  }
});

/**
 * Handle /translatezh command (Translate to English)
 */
bot.onText(/\/translatezh(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  try {
    let textToTranslate = match ? match[1] : null;
    
    if (!textToTranslate && msg.reply_to_message && msg.reply_to_message.text) {
      textToTranslate = msg.reply_to_message.text;
    }
    
    const commandUsage = '📝 Usage:\n/translatezh [Chinese text to translate to English]\nOr reply to a Chinese message with /translatezh';
    if (!textToTranslate) {
      const usageOptions = {};
      if (msg.message_thread_id) {
        usageOptions.message_thread_id = msg.message_thread_id;
      }
      return bot.sendMessage(chatId, commandUsage, usageOptions);
    }
    
    console.log(`Processing /translatezh command in chat ${chatId}${msg.message_thread_id ? ` (topic ${msg.message_thread_id})` : ''}: ZH → EN for text: "${textToTranslate}" by ${msg.from.username || msg.from.id}`);
    
    const cacheKey = `${textToTranslate}:en`;
    let translatedText = getCachedTranslation(cacheKey);

    if (!translatedText) {
      translatedText = await translationService.translateText(textToTranslate, 'en', 'zh-CN');
      if (translatedText) {
        cacheTranslation(cacheKey, translatedText);
      } else {
        throw new Error('Translation service returned null for /translatezh');
      }
    }
      
    const replyOptions = {};
    // If the command was sent in a topic, reply in the same topic
    if (msg.message_thread_id) {
        replyOptions.message_thread_id = msg.message_thread_id;
    }
    // If you want to reply to the original Chinese message (if this command was a reply itself):
    // if (msg.reply_to_message) {
    //   replyOptions.reply_to_message_id = msg.reply_to_message.message_id;
    // } else {
    //   replyOptions.reply_to_message_id = msg.message_id; // Reply to the command itself
    // }


    await bot.sendMessage(
      chatId,
      `Original: ${textToTranslate}\n\n🔄 Translated (ZH → EN):\n${translatedText}`,
      replyOptions
    );

  } catch (error) {
    console.error('Error handling /translatezh command:', error);
    const errorOptions = {};
    if (msg.message_thread_id) {
        errorOptions.message_thread_id = msg.message_thread_id;
    }
    bot.sendMessage(chatId, '❌ Error translating your message to English. Please try again.', errorOptions);
  }
});


/**
 * Handle /help command
 */
bot.onText(/\/help/, (msg) => {
  const helpText = `
🤖 *TranslationBot Help*

This bot helps bridge language barriers by translating between Chinese and English.

*Automatic Translation (if enabled):*
Chinese messages posted in the group (or a topic) will be automatically translated to English and shown as a reply in the same location.

*Commands:*
\`/tc [English text]\` - Translates your English text to Chinese and posts it in the current location (group or topic). You can also reply to an English message with just \`/tc\`.
\`/translatezh [Chinese text]\` - Manually translates Chinese text to English and posts it in the current location. You can also reply to a Chinese message with just \`/translatezh\`.
\`/help\` - Shows this help message.
\`/start\` - Shows a welcome message.

*Example Usage for Replying:*
You: \`/tc This is a test message.\`
Bot: \`🤖 Bot (EN → ZH):\n\n这是一个测试消息。\`

*Note:* Ensure the bot has permissions to read and send messages in the group.
`;
  const helpOptions = {};
  if (msg.message_thread_id) {
      helpOptions.message_thread_id = msg.message_thread_id;
  }
  bot.sendMessage(msg.chat.id, helpText, { ...helpOptions, parse_mode: 'Markdown' });
});

/**
 * Handle /start command
 */
bot.onText(/\/start/, (msg) => {
  const welcomeText = `
👋 Welcome to TranslationBot!

I'm here to help you communicate across language barriers, specifically between Chinese and English.

➡️ Type \`/help\` to see available commands and how I work.
➡️ If I'm in a group with topics, I'll try to reply within the correct topic.
➡️ If I'm in a group, I can automatically translate Chinese messages to English (if this feature is enabled by the admin).
`;
  const startOptions = {};
  if (msg.message_thread_id) {
      startOptions.message_thread_id = msg.message_thread_id;
  }
  bot.sendMessage(msg.chat.id, welcomeText, { ...startOptions, parse_mode: 'Markdown'});
});

// Log when the bot is started
console.log('TranslationBot (bot.js) is running and listening for messages (with topic support)...');

module.exports = bot;