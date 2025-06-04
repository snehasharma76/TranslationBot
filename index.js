/**
 * TranslationBot - Main Entry Point
 * 
 * This file serves as the entry point for the TranslationBot application.
 * It initializes the Telegram bot and sets up error handling.
 */

// Import required modules
require('dotenv').config();
const bot = require('./src/bot');
const { validateConfig } = require('./config/config');

// Validate configuration
validateConfig();

// Global error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Keep the process running
console.log('TranslationBot started successfully!');
console.log('Press Ctrl+C to stop the bot.');
