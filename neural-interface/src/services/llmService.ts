import { ChatMessage, LLMResponse } from '../types/chat';
import { API_ENDPOINTS, UI_CONSTANTS } from '../utils/constants';

class LLMService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async sendMessage(message: string, conversationHistory: ChatMessage[] = []): Promise<LLMResponse> {
    try {
      const isOnline = await this.healthCheck();
      if (!isOnline) {
        return this.offlineFallback(message);
      }

      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CHAT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: UI_CONSTANTS.MODEL_NAME,
          messages: [
            ...conversationHistory,
            { role: 'user', content: message }
          ],
          max_tokens: 128
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        content: data.choices?.[0]?.message?.content ?? '[No response received]',
        model: data.model ?? UI_CONSTANTS.MODEL_NAME,
        timestamp: new Date().toISOString(),
        tokens: data.usage?.total_tokens ?? 0,
      };
    } catch (error) {
      console.error('Error communicating with LLM:', error);
      return this.offlineFallback(message);
    }
  }

  private offlineFallback(message: string): LLMResponse {
    return {
      content: `⚠️ LLM server is offline. Could not process: "${message}"`,
      model: 'offline-fallback',
      timestamp: new Date().toISOString(),
      tokens: 0,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.HEALTH}`, { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getStatus() {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.STATUS}`);
      return await response.json();
    } catch (error) {
      return {
        status: 'offline',
        model: 'unknown',
        uptime: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const llmService = new LLMService();
