import axios from "axios";
import FormData from "form-data";
import { PublishResult, PostContent, PlatformComment } from "./types";
import { decryptToken } from "../utils/encryption";

const TELEGRAM_API_URL = "https://api.telegram.org/bot";

export interface TelegramChannel {
  id: string;
  title: string;
  username?: string;
  type: string;
}

export interface TelegramMessage {
  messageId: number;
  chatId: string;
  date: number;
  text?: string;
}

export class TelegramService {
  /**
   * Build the API URL for a bot
   */
  private static getApiUrl(botToken: string): string {
    return `${TELEGRAM_API_URL}${botToken}`;
  }

  /**
   * Validate bot token and get bot info
   */
  static async validateBotToken(botToken: string): Promise<{
    id: number;
    username: string;
    firstName: string;
  } | null> {
    try {
      const response = await axios.get(`${this.getApiUrl(botToken)}/getMe`);

      if (response.data.ok) {
        return {
          id: response.data.result.id,
          username: response.data.result.username,
          firstName: response.data.result.first_name,
        };
      }
      return null;
    } catch (error: any) {
      console.error(
        "Error validating Telegram bot:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  /**
   * Get chat/channel info
   */
  static async getChatInfo(
    botToken: string,
    chatId: string
  ): Promise<TelegramChannel | null> {
    try {
      const response = await axios.get(`${this.getApiUrl(botToken)}/getChat`, {
        params: { chat_id: chatId },
      });

      if (response.data.ok) {
        const chat = response.data.result;
        return {
          id: chat.id.toString(),
          title: chat.title || chat.first_name || chat.username || "Unknown",
          username: chat.username,
          type: chat.type,
        };
      }
      return null;
    } catch (error: any) {
      console.error(
        "Error getting Telegram chat info:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  /**
   * Send a text message to a channel
   */
  static async sendMessage(
    encryptedBotToken: string,
    chatId: string,
    text: string,
    parseMode: "HTML" | "Markdown" | "MarkdownV2" = "HTML"
  ): Promise<PublishResult> {
    try {
      const botToken = decryptToken(encryptedBotToken);

      const response = await axios.post(
        `${this.getApiUrl(botToken)}/sendMessage`,
        {
          chat_id: chatId,
          text: text,
          parse_mode: parseMode,
        }
      );

      if (response.data.ok) {
        const message = response.data.result;
        return {
          success: true,
          postId: message.message_id.toString(),
          postUrl: this.getMessageUrl(chatId, message.message_id),
        };
      }

      return {
        success: false,
        error: "Failed to send message",
      };
    } catch (error: any) {
      console.error(
        "Error sending Telegram message:",
        error.response?.data || error.message
      );
      return {
        success: false,
        error:
          error.response?.data?.description ||
          "Failed to send message to Telegram",
        errorCode: error.response?.data?.error_code?.toString(),
      };
    }
  }

  /**
   * Download image from URL and return as Buffer
   */
  private static async downloadImage(imageUrl: string): Promise<Buffer> {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
    });
    return Buffer.from(response.data);
  }

  /**
   * Send a photo with optional caption
   */
  static async sendPhoto(
    encryptedBotToken: string,
    chatId: string,
    photoUrl: string,
    caption?: string
  ): Promise<PublishResult> {
    try {
      const botToken = decryptToken(encryptedBotToken);

      // First try sending by URL
      try {
        const response = await axios.post(
          `${this.getApiUrl(botToken)}/sendPhoto`,
          {
            chat_id: chatId,
            photo: photoUrl,
            caption: caption,
            parse_mode: "HTML",
          }
        );

        if (response.data.ok) {
          const message = response.data.result;
          return {
            success: true,
            postId: message.message_id.toString(),
            postUrl: this.getMessageUrl(chatId, message.message_id),
          };
        }
      } catch (urlError: any) {
        // If URL method fails, try downloading and uploading as file
        console.log(
          "URL method failed, trying file upload...",
          urlError.response?.data?.description
        );

        const imageBuffer = await this.downloadImage(photoUrl);

        const formData = new FormData();
        formData.append("chat_id", chatId);
        formData.append("photo", imageBuffer, {
          filename: "image.jpg",
          contentType: "image/jpeg",
        });
        if (caption) {
          formData.append("caption", caption);
          formData.append("parse_mode", "HTML");
        }

        const response = await axios.post(
          `${this.getApiUrl(botToken)}/sendPhoto`,
          formData,
          {
            headers: formData.getHeaders(),
          }
        );

        if (response.data.ok) {
          const message = response.data.result;
          return {
            success: true,
            postId: message.message_id.toString(),
            postUrl: this.getMessageUrl(chatId, message.message_id),
          };
        }
      }

      return {
        success: false,
        error: "Failed to send photo",
      };
    } catch (error: any) {
      console.error(
        "Error sending Telegram photo:",
        error.response?.data || error.message
      );
      return {
        success: false,
        error:
          error.response?.data?.description ||
          "Failed to send photo to Telegram",
        errorCode: error.response?.data?.error_code?.toString(),
      };
    }
  }

  /**
   * Send a video with optional caption
   */
  static async sendVideo(
    encryptedBotToken: string,
    chatId: string,
    videoUrl: string,
    caption?: string
  ): Promise<PublishResult> {
    try {
      const botToken = decryptToken(encryptedBotToken);

      // First try sending by URL
      try {
        const response = await axios.post(
          `${this.getApiUrl(botToken)}/sendVideo`,
          {
            chat_id: chatId,
            video: videoUrl,
            caption: caption,
            parse_mode: "HTML",
          }
        );

        if (response.data.ok) {
          const message = response.data.result;
          return {
            success: true,
            postId: message.message_id.toString(),
            postUrl: this.getMessageUrl(chatId, message.message_id),
          };
        }
      } catch (urlError: any) {
        // If URL method fails, try downloading and uploading as file
        console.log(
          "URL method failed for video, trying file upload...",
          urlError.response?.data?.description
        );

        const videoBuffer = await this.downloadImage(videoUrl);

        const formData = new FormData();
        formData.append("chat_id", chatId);
        formData.append("video", videoBuffer, {
          filename: "video.mp4",
          contentType: "video/mp4",
        });
        if (caption) {
          formData.append("caption", caption);
          formData.append("parse_mode", "HTML");
        }

        const response = await axios.post(
          `${this.getApiUrl(botToken)}/sendVideo`,
          formData,
          {
            headers: formData.getHeaders(),
          }
        );

        if (response.data.ok) {
          const message = response.data.result;
          return {
            success: true,
            postId: message.message_id.toString(),
            postUrl: this.getMessageUrl(chatId, message.message_id),
          };
        }
      }

      return {
        success: false,
        error: "Failed to send video",
      };
    } catch (error: any) {
      console.error(
        "Error sending Telegram video:",
        error.response?.data || error.message
      );
      return {
        success: false,
        error:
          error.response?.data?.description ||
          "Failed to send video to Telegram",
        errorCode: error.response?.data?.error_code?.toString(),
      };
    }
  }

  /**
   * Post content to Telegram channel (auto-detects content type)
   */
  static async postToChannel(
    encryptedBotToken: string,
    chatId: string,
    content: PostContent
  ): Promise<PublishResult> {
    try {
      // If video is provided, send as video
      if (content.videoUrl) {
        return await this.sendVideo(
          encryptedBotToken,
          chatId,
          content.videoUrl,
          content.text
        );
      }

      // If image is provided, send as photo
      if (content.imageUrl) {
        return await this.sendPhoto(
          encryptedBotToken,
          chatId,
          content.imageUrl,
          content.text
        );
      }

      // Otherwise, send as text message
      return await this.sendMessage(encryptedBotToken, chatId, content.text);
    } catch (error: any) {
      console.error("Error posting to Telegram:", error.message);
      return {
        success: false,
        error: error.message || "Failed to post to Telegram",
      };
    }
  }

  /**
   * Get message URL (only works for public channels)
   */
  private static getMessageUrl(chatId: string, messageId: number): string {
    // For public channels with username
    if (chatId.startsWith("@")) {
      return `https://t.me/${chatId.slice(1)}/${messageId}`;
    }

    // For channels with numeric ID, try to construct URL
    // This only works if the channel is public
    const cleanId = chatId.replace("-100", "").replace("-", "");
    return `https://t.me/c/${cleanId}/${messageId}`;
  }

  /**
   * Delete a message
   */
  static async deleteMessage(
    encryptedBotToken: string,
    chatId: string,
    messageId: number
  ): Promise<boolean> {
    try {
      const botToken = decryptToken(encryptedBotToken);

      const response = await axios.post(
        `${this.getApiUrl(botToken)}/deleteMessage`,
        {
          chat_id: chatId,
          message_id: messageId,
        }
      );

      return response.data.ok;
    } catch (error: any) {
      console.error(
        "Error deleting Telegram message:",
        error.response?.data || error.message
      );
      return false;
    }
  }

  /**
   * Get channel member count
   */
  static async getMemberCount(
    encryptedBotToken: string,
    chatId: string
  ): Promise<number> {
    try {
      const botToken = decryptToken(encryptedBotToken);

      const response = await axios.get(
        `${this.getApiUrl(botToken)}/getChatMemberCount`,
        {
          params: { chat_id: chatId },
        }
      );

      if (response.data.ok) {
        return response.data.result;
      }
      return 0;
    } catch (error: any) {
      console.error(
        "Error getting member count:",
        error.response?.data || error.message
      );
      return 0;
    }
  }
}
