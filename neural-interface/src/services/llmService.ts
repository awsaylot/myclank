import { ChatMessage, LLMResponse } from '../types/chat';
import { API_ENDPOINTS, UI_CONSTANTS, BACKEND_CONFIG } from '../utils/constants';

class LLMService {
  private baseUrl: string;

  constructor(baseUrl: string = BACKEND_CONFIG.BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async sendMessage(message: string, conversationHistory: ChatMessage[] = []): Promise<LLMResponse> {
    try {
      const isOnline = await this.healthCheck();
      if (!isOnline) {
        return this.offlineFallback(message);
      }

      // Convert conversation history to the format expected by the backend
      const messages = [
        ...conversationHistory
          .filter(msg => msg.role !== 'system') // Filter out system messages for now
          .map(msg => ({
            role: msg.role,
            content: msg.content
          })),
        { role: 'user', content: message }
      ];

      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CHAT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: UI_CONSTANTS.MODEL_NAME,
          messages,
          max_tokens: 128 // Match your curl example
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Handle potential error response from backend
      if (data.error) {
        throw new Error(data.error.message || 'Unknown error from server');
      }

      return {
        content: data.choices?.[0]?.message?.content ?? '[No response received]',
        model: data.model ?? UI_CONSTANTS.MODEL_NAME,
        timestamp: new Date().toISOString(),
        tokens: data.usage?.total_tokens ?? 0,
      };
    } catch (error) {
      console.error('Error communicating with Neural MCP server:', error);
      return this.offlineFallback(message);
    }
  }

  private offlineFallback(message: string): LLMResponse {
    return {
      content: `⚠️ Neural MCP server is offline. Could not process: "${message}"`,
      model: 'offline-fallback',
      timestamp: new Date().toISOString(),
      tokens: 0,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.HEALTH}`, { 
        method: 'GET',
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  async getStatus() {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.STATUS}`);
      
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }
      
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