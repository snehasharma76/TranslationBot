require('dotenv').config();

const config = {
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
  },
  translation: {
    defaultSourceLanguage: process.env.DEFAULT_SOURCE_LANGUAGE || 'zh-CN',
    defaultTargetLanguage: process.env.DEFAULT_TARGET_LANGUAGE || 'en',
    apiPriority: (process.env.API_PRIORITY || 'google,libre,lingva').split(',').map(api => api.trim()),
    apiTimeout: parseInt(process.env.API_TIMEOUT || '5000', 10),
  },
  bot: {
    autoTranslate: process.env.AUTO_TRANSLATE === 'true', // Auto translate Chinese messages to English
    enableCache: process.env.ENABLE_CACHE !== 'false',    // Cache translations
    cacheTTL: parseInt(process.env.CACHE_TTL || (24 * 60 * 60 * 1000).toString(), 10), // 24 hours in ms
  }
};

const validateConfig = () => {
  if (!config.telegram.token) {
    console.error('CRITICAL ERROR: TELEGRAM_BOT_TOKEN is not defined in your .env file or environment variables.');
    process.exit(1);
  }
  if (config.translation.apiPriority.length === 0) {
    console.warn('Warning: API_PRIORITY is not set or empty. Defaulting to "google".');
    config.translation.apiPriority = ['google'];
  }
  console.log('Configuration loaded successfully.');
  if (config.bot.autoTranslate) {
    console.log('Auto-translation of Chinese messages is ENABLED.');
  } else {
    console.log('Auto-translation of Chinese messages is DISABLED.');
  }
  if (config.bot.enableCache) {
    console.log(`Translation caching is ENABLED with TTL: ${config.bot.cacheTTL / 1000}s.`);
  } else {
    console.log('Translation caching is DISABLED.');
  }
};

module.exports = {
  config,
  validateConfig,
};