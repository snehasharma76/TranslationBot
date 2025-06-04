# TranslationBot: Telegram Translation Assistant

## Overview
TranslationBot is an automated solution for real-time translation in multilingual Telegram groups. This project specifically addresses the challenge of communicating with Chinese-speaking developers in a "30 Days of Solidity" educational program when the instructor doesn't speak Chinese.

## Problem Statement
As a co-founder and senior developer running a global educational platform with a "30 Days of Solidity" cohort in China, there's a significant language barrier:
- Chinese participants communicate in their native language on Telegram
- The instructor (you) doesn't speak Chinese
- Currently using manual copy-paste between Google Translate and Telegram is inefficient and time-consuming

## Solution
TranslationBot is a Telegram bot that:
1. Automatically detects and translates Chinese messages to English
2. Translates your English responses to Chinese
3. Integrates seamlessly with your existing Telegram group
4. Provides a simple command interface for translations

## Setup Guide

### Prerequisites

1. Node.js (version 14 or higher)
2. A Telegram account

### Step 1: Create a Telegram Bot

1. Open Telegram and search for "BotFather" (@BotFather)
2. Start a chat with BotFather and send the command `/newbot`
3. Follow the prompts to name your bot:
   - First, provide a display name (e.g., "Chinese Translator Bot")
   - Then, provide a username that must end with "bot" (e.g., "chinese_translator_bot")
4. BotFather will provide you with a token. This is your `TELEGRAM_BOT_TOKEN` - save it securely!

### Step 2: Configure the Bot

1. Create a `.env` file in the root directory of the project
2. Add the following configuration to your `.env` file:

```
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Translation Configuration
DEFAULT_SOURCE_LANGUAGE=zh-CN
DEFAULT_TARGET_LANGUAGE=en

# API Priority (comma-separated, options: google,libre,lingva)
API_PRIORITY=google,libre,lingva

# API Timeout in milliseconds
API_TIMEOUT=5000

# Bot Configuration
AUTO_TRANSLATE=true

# Cache Settings
ENABLE_CACHE=true
CACHE_TTL=86400000
```

3. Replace `your_telegram_bot_token_here` with the token you received from BotFather

### Step 3: Install Dependencies

Run the following command in the project directory:

```
npm install
```

### Step 4: Start the Bot

For production:
```
npm start
```

For development (with auto-restart on file changes):
```
npm run dev
```

### Step 5: Add the Bot to Your Group

1. Open your Telegram group
2. Click on the group name at the top
3. Select "Add members"
4. Search for your bot by its username
5. Add the bot to the group

### Step 6: Grant Admin Privileges (Optional)

For the best experience, you may want to grant admin privileges to your bot:

1. In your group, click on the group name
2. Select "Administrators"
3. Click "Add Admin"
4. Select your bot
5. Choose appropriate permissions (at minimum, "Read Messages")

## Using the Bot

Once the bot is running and added to your group, it will:

1. Automatically translate Chinese messages to English
2. Allow you to translate your messages to Chinese using the `/translate` command

### Commands

- `/translate [text]` - Translate text between Chinese and English
- `/help` - Show help message with available commands
- `/start` - Display welcome message

### Troubleshooting

- If the bot doesn't respond, check that it's running and that you've provided the correct token
- If translations fail, the bot will try multiple free translation APIs as fallbacks
- Check the console logs for any error messages

### Advanced Configuration

You can modify the `.env` file to change the bot's behavior:

- Change `AUTO_TRANSLATE=false` to disable automatic translation
- Adjust `API_PRIORITY` to change which translation services are tried first
- Modify `API_TIMEOUT` to change how long the bot waits for translation services to respond

## Implementation Roadmap

### Phase 1: Setup and Configuration
1. **Create Telegram Bot**
   - Register a new bot with BotFather on Telegram
   - Obtain the API token
   - Configure basic bot settings (name, description, commands)

2. **Set Up Project Structure**
   - Initialize a Node.js project
   - Install necessary dependencies (Telegram Bot API, translation API client)
   - Create configuration files for API keys and settings

3. **Choose Translation Service**
   - Select and register for a translation API (Google Cloud Translation, DeepL, etc.)
   - Obtain API credentials
   - Set up authentication

### Phase 2: Core Functionality
1. **Message Listening**
   - Configure the bot to join and listen to messages in the target Telegram group
   - Set up event handlers for incoming messages

2. **Language Detection**
   - Implement automatic language detection for incoming messages
   - Focus on identifying Chinese text

3. **Translation Pipeline**
   - Create functions to translate text between Chinese and English
   - Implement error handling for translation failures
   - Set up caching to avoid redundant translations

4. **Response Mechanism**
   - Develop a system to translate and send responses
   - Create commands for manual translation requests

### Phase 3: User Experience and Deployment
1. **Command Interface**
   - Implement `/translate` command for on-demand translations
   - Add `/help` command for instructions
   - Create `/stats` command to track usage

2. **User Settings**
   - Allow users to set preferred languages
   - Implement opt-in/opt-out functionality

3. **Deployment**
   - Set up hosting (cloud service or dedicated server)
   - Configure environment for 24/7 operation
   - Implement monitoring and logging

4. **Testing and Optimization**
   - Test with real conversations
   - Optimize translation quality and response time
   - Handle edge cases and special characters

## Technical Components

### 1. Bot Framework
- Node.js with `node-telegram-bot-api` library
- Event-driven architecture for message handling
- Webhook or polling mechanism for receiving updates

### 2. Translation Engine
- Integration with a translation API
- Language detection module
- Translation cache to improve performance

### 3. Database (Optional)
- Store user preferences
- Cache translations for frequently used phrases
- Track usage statistics

### 4. Deployment Infrastructure
- Cloud hosting (AWS, Google Cloud, or similar)
- Process management with PM2
- Monitoring and error reporting

## Usage Instructions

### For Administrators
1. Add the bot to your Telegram group
2. Grant necessary permissions
3. Configure default languages and behavior

### For Users
1. Send messages in their native language (Chinese)
2. Receive automatic translations of instructor responses
3. Use `/translate [text]` for manual translation requests

## Benefits
- **Efficiency**: Eliminates manual copy-paste between translation tools
- **Accessibility**: Makes educational content accessible to Chinese speakers
- **Engagement**: Encourages participation from non-English speakers
- **Scalability**: Can be extended to support additional languages for future cohorts

## Future Enhancements
- Support for additional languages beyond Chinese
- Integration with code snippet formatting for Solidity examples
- AI-powered context-aware translations for technical terminology
- Voice message translation capabilities
- Web dashboard for analytics and management

---

This project aims to bridge the language gap in educational settings, making technical knowledge more accessible across language barriers.
