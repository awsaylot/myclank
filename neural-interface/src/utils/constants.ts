// API endpoints for Neural MCP server
export const API_ENDPOINTS = {
  CHAT: '/v1/chat/completions',
  STATUS: '/status',
  HEALTH: '/health',
} as const;

// Backend configuration
export const BACKEND_CONFIG = {
  BASE_URL: 'http://localhost:3001',
} as const;

export const UI_CONSTANTS = {
  MAX_INPUT_LENGTH: 2048,
  INTERFACE_VERSION: 'v2.1',
  MODEL_NAME: 'CodeLlama-7b-Instruct-hf.Q6_K.gguf',
  UPDATE_INTERVAL: 1000,
  CONNECTION_TIMEOUT: 2000,
} as const;

export const SYSTEM_MESSAGES = {
  INIT: 'NEURAL INTERFACE v2.1 INITIALIZED...',
  READY: 'DEEPSEEK NEURAL NETWORK STATUS: READY',
  AWAITING: 'AWAITING USER INPUT...',
  CONNECTING: 'ESTABLISHING NEURAL LINK...',
  ERROR: 'NEURAL PATHWAY ERROR DETECTED',
} as const;

export const STATUS_MESSAGES = {
  QUANTUM_CORE: '> QUANTUM AI CORE: ONLINE',
  NEURAL_PATHWAYS: '> NEURAL PATHWAYS: ESTABLISHED',
  SECURITY: '> SECURITY PROTOCOLS: ACTIVE',
  ENCRYPTION: '> ENCRYPTION LAYER: ENABLED',
} as const;

export const THEME = {
  PRIMARY: '#00ff41',
  BACKGROUND: '#000000',
  ACCENT: '#001100',
} as const;