const axios = require('axios');
const { config } = require('../config/config');

const API_TIMEOUT = config.translation.apiTimeout || 5000;

class TranslationService {
  constructor() {
    // The actual API functions are called directly in translateWithApi
    // this.translationApis array was not used.
    console.log(`Translation service initialized. API priority: ${config.translation.apiPriority.join(', ')}`);
  }

  /**
   * Basic heuristic to detect if text contains Chinese characters.
   * @param {string} text - Text to check.
   * @returns {Promise<boolean>} - True if text likely contains Chinese.
   */
  async isChinese(text) {
    if (!text || typeof text !== 'string') return false;
    const chineseRegex = /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/; // Common CJK Unified Ideographs + Compatibility
    return chineseRegex.test(text.trim());
  }

  /**
   * Detect the language of a text using simple heuristics.
   * Primarily distinguishes between Chinese and English for this bot's purpose.
   * @param {string} text - Text to detect language for.
   * @returns {Promise<string>} - Language code ('zh-CN' or 'en').
   */
  async detectLanguage(text) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return 'en'; // Default to English for empty or invalid text
    }
    if (await this.isChinese(text)) {
      console.log('Detected Chinese characters - classifying as zh-CN');
      return 'zh-CN';
    }
    console.log('No Chinese characters detected - classifying as English');
    return 'en';
  }

  async libretranslateApi(text, targetLanguage, sourceLanguage) {
    try {
      const from = sourceLanguage.split('-')[0];
      const to = targetLanguage.split('-')[0];
      console.log(`LibreTranslate: Translating from ${from} to ${to}`);
      const response = await axios.post('https://libretranslate.de/translate', {
        q: text,
        source: from,
        target: to,
        format: 'text'
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: API_TIMEOUT
      });
      return response.data?.translatedText || null;
    } catch (error) {
      console.error('LibreTranslate API error:', error.message);
      return null;
    }
  }

  async lingvaApi(text, targetLanguage, sourceLanguage) {
    try {
      const from = sourceLanguage.split('-')[0];
      const to = targetLanguage.split('-')[0];
      console.log(`Lingva API: Translating from ${from} to ${to}`);
      // Note: lingva.ml can be unreliable. Consider self-hosting or alternatives.
      const response = await axios.get(`https://lingva.ml/api/v1/${from}/${to}/${encodeURIComponent(text)}`, {
        timeout: API_TIMEOUT
      });
      return response.data?.translation || null;
    } catch (error) {
      console.error('Lingva API error:', error.message);
      return null;
    }
  }

  async googleTranslateScraperApi(text, targetLanguage, sourceLanguage) {
    try {
      const from = sourceLanguage.split('-')[0];
      const to = targetLanguage.split('-')[0];
      console.log(`Google Scraper: Translating from ${from} to ${to}`);
      const response = await axios.get('https://translate.googleapis.com/translate_a/single', {
        params: {
          client: 'gtx', // or 't' or 'at'
          sl: from,      // source language
          tl: to,        // target language
          dt: 't',       // return translation
          q: text
        },
        timeout: API_TIMEOUT
      });
      if (response.data && Array.isArray(response.data[0])) {
        return response.data[0].map(chunk => chunk[0]).join('');
      }
      return null;
    } catch (error) {
      console.error('Google Translate scraper API error:', error.message);
      return null;
    }
  }
  
  /**
   * Translate text using a specific API.
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language code (e.g., 'en', 'zh-CN')
   * @param {string} sourceLanguage - Source language code (e.g., 'en', 'zh-CN')
   * @param {string} api - API to use ('google', 'libre', or 'lingva')
   * @returns {Promise<string|null>} - Translated text or null
   */
  async translateWithApi(text, targetLanguage, sourceLanguage, api) {
    if (!text || !targetLanguage || !sourceLanguage) {
        console.error('translateWithApi: Missing required parameters (text, targetLanguage, or sourceLanguage).');
        return null;
    }
    try {
      console.log(`Attempting translation with ${api} API: ${sourceLanguage} → ${targetLanguage}`);
      let translatedText = null;
      
      switch (api.trim().toLowerCase()) {
        case 'google':
          translatedText = await this.googleTranslateScraperApi(text, targetLanguage, sourceLanguage);
          break;
        case 'libre':
          translatedText = await this.libretranslateApi(text, targetLanguage, sourceLanguage);
          break;
        case 'lingva':
          translatedText = await this.lingvaApi(text, targetLanguage, sourceLanguage);
          break;
        default:
          console.error(`Unknown translation API specified: ${api}`);
          return null; // Or throw new Error(`Unknown translation API: ${api}`);
      }
      
      if (translatedText) {
        console.log(`Translation successful with ${api}: "${text.substring(0,30)}..." → "${translatedText.substring(0,30)}..."`);
      } else {
        console.log(`Translation failed or returned null with ${api} for: "${text.substring(0,30)}..."`);
      }
      return translatedText;

    } catch (error) {
      console.error(`Error during translation with ${api} API:`, error.message);
      return null; // Ensure null is returned on error to allow fallback
    }
  }

  /**
   * Translate text using available free translation APIs based on priority.
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language code (e.g., 'en', 'zh-CN')
   * @param {string} sourceLanguage - Source language code (e.g., 'en', 'zh-CN'). If null, it will attempt to detect.
   * @returns {Promise<string|null>} - Translated text or null if all fail
   */
  async translateText(text, targetLanguage, sourceLanguage = null) {
    if (!text) return null;

    let currentSourceLanguage = sourceLanguage;
    if (!currentSourceLanguage) {
      currentSourceLanguage = await this.detectLanguage(text);
      console.log(`Auto-detected source language as: ${currentSourceLanguage}`);
    }
    
    // Prevent translating if source and target are the same
    if (currentSourceLanguage.split('-')[0] === targetLanguage.split('-')[0]) {
        console.log(`Source (${currentSourceLanguage}) and target (${targetLanguage}) languages are the same. Skipping translation.`);
        return text; // Return original text
    }

    const apiPriority = config.translation.apiPriority;
    let lastError = null;
    
    for (const api of apiPriority) {
      try {
        const translatedText = await this.translateWithApi(text, targetLanguage, currentSourceLanguage, api);
        if (translatedText) {
          return translatedText; // Return on first successful translation
        }
      } catch (error) {
        // This catch is mostly for unexpected errors from translateWithApi itself,
        // as individual API errors are caught and logged within translateWithApi, returning null.
        console.error(`Critical error while attempting translation with ${api}: ${error.message}`);
        lastError = error; // Keep track of the last critical error
      }
    }
    
    console.error('All translation APIs failed for text:', text.substring(0, 50) + "...");
    if (lastError) throw lastError; // Rethrow last critical error if any
    return null; // Return null if all attempts (including null returns from APIs) failed
  }


  /**
   * Smart translate: Detects if text is Chinese (translate to English) or English (translate to Chinese).
   * This function seems less used now that bot.js handles directionality more explicitly.
   * Kept for potential future use or direct API testing.
   * @param {string} text - Text to translate
   * @returns {Promise<Object|null>} - Object containing translated text and languages, or null on failure
   */
  async smartTranslate(text) {
    try {
      const detectedSourceLanguage = await this.detectLanguage(text);
      let targetLanguage;
      
      if (detectedSourceLanguage === 'zh-CN') {
        targetLanguage = 'en';
      } else { // Assuming 'en' or other to be translated to Chinese
        targetLanguage = 'zh-CN';
      }
      
      const translatedText = await this.translateText(text, targetLanguage, detectedSourceLanguage);
      
      if (translatedText) {
        return {
          originalText: text,
          translatedText,
          sourceLanguage: detectedSourceLanguage,
          targetLanguage
        };
      }
      return null;
    } catch (error) {
      console.error('Error in smart translation:', error);
      throw error; // Or return null based on desired error handling
    }
  }
  // Removed duplicate smartTranslate method
}

module.exports = new TranslationService();