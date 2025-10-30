import TelegramBot from 'node-telegram-bot-api';
import { Pool } from 'pg';

interface TelegramSettings {
  bot_token: string;
  chat_id: string;
  bot_enabled: boolean;
}

export class TelegramService {
  private pool: Pool;
  private bot: TelegramBot | null = null;
  private settings: TelegramSettings | null = null;

  constructor(pool: Pool) {
    this.pool = pool;
    this.initializeBot();
  }

  private async initializeBot() {
    try {
      const settings = await this.getSettings();
      if (settings && settings.bot_enabled && settings.bot_token) {
        this.bot = new TelegramBot(settings.bot_token, { polling: false });
        this.settings = settings;
        console.log('✅ Telegram bot initialized successfully');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Telegram bot:', error);
    }
  }

  async getSettings(): Promise<TelegramSettings | null> {
    try {
      const result = await this.pool.query('SELECT * FROM telegram_settings ORDER BY id DESC LIMIT 1');
      if (result.rows.length > 0) {
        return result.rows[0];
      }
      return null;
    } catch (error) {
      console.error('Error fetching Telegram settings:', error);
      return null;
    }
  }

  async updateSettings(botToken: string, chatId: string, botEnabled: boolean): Promise<boolean> {
    try {
      // Upsert: Insert if no record exists, otherwise update
      const result = await this.pool.query(
        `INSERT INTO telegram_settings (id, bot_token, chat_id, bot_enabled, created_at, updated_at)
         VALUES (1, $1, $2, $3, NOW(), NOW())
         ON CONFLICT (id) 
         DO UPDATE SET 
           bot_token = EXCLUDED.bot_token, 
           chat_id = EXCLUDED.chat_id, 
           bot_enabled = EXCLUDED.bot_enabled, 
           updated_at = NOW()
         RETURNING *`,
        [botToken, chatId, botEnabled]
      );

      if (result.rows.length === 0) {
        console.error('⚠️ Telegram settings save failed: No rows returned');
        return false;
      }

      if (botEnabled && botToken) {
        this.bot = new TelegramBot(botToken, { polling: false });
        this.settings = { bot_token: botToken, chat_id: chatId, bot_enabled: botEnabled };
        console.log('✅ Telegram bot settings updated and bot reinitialized');
      } else {
        this.bot = null;
        this.settings = null;
        console.log('ℹ️ Telegram bot disabled');
      }

      return true;
    } catch (error) {
      console.error('Error updating Telegram settings:', error);
      return false;
    }
  }

  async sendNotification(message: string): Promise<boolean> {
    try {
      if (!this.bot || !this.settings || !this.settings.chat_id) {
        console.log('⚠️ Telegram notification skipped: Bot not configured');
        return false;
      }

      await this.bot.sendMessage(this.settings.chat_id, message, { parse_mode: 'HTML' });
      console.log('✅ Telegram notification sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to send Telegram notification:', error);
      return false;
    }
  }

  async sendUserAuthNotification(username: string, twitterId: string, followersCount: number) {
    const message = `
🆕 <b>New User Authenticated</b>

👤 <b>Username:</b> @${username}
🆔 <b>Twitter ID:</b> ${twitterId}
👥 <b>Followers:</b> ${followersCount.toLocaleString()}
⏰ <b>Time:</b> ${new Date().toLocaleString()}

🤖 <i>Credential Task Bot</i>
    `.trim();

    return this.sendNotification(message);
  }
}
