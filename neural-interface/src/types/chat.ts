// Chat message types
export interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  role: 'user' | 'assistant' | 'system';
  status?: 'sending' | 'sent' | 'error';
}

// Connection status types
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// System status types
export interface SystemStatus {
  cpuUsage: number;
  memoryUsage: number;
  neuralCore: boolean;
  encryptionActive: boolean;
  sessionActive: boolean;
}

// Chat hook return type
export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;
}

// API response types
export interface LLMResponse {
  content: string;
  model: string;
  timestamp: string;
  tokens?: number;
}