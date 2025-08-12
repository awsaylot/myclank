// UI Constants
export const UI_CONSTANTS = {
  MAX_INPUT_LENGTH: 2048,
  INTERFACE_VERSION: 'v2.1',
  MODEL_NAME: 'DEEPSEEK-NEURAL-7B',
  UPDATE_INTERVAL: 1000,
  CONNECTION_TIMEOUT: 2000,
} as const;

// System messages
export const SYSTEM_MESSAGES = {
  INIT: 'NEURAL INTERFACE v2.1 INITIALIZED...',
  READY: 'DEEPSEEK NEURAL NETWORK STATUS: READY',
  AWAITING: 'AWAITING USER INPUT...',
  CONNECTING: 'ESTABLISHING NEURAL LINK...',
  ERROR: 'NEURAL PATHWAY ERROR DETECTED',
} as const;

// Status messages
export const STATUS_MESSAGES = {
  QUANTUM_CORE: '> QUANTUM AI CORE: ONLINE',
  NEURAL_PATHWAYS: '> NEURAL PATHWAYS: ESTABLISHED',
  SECURITY: '> SECURITY PROTOCOLS: ACTIVE',
  ENCRYPTION: '> ENCRYPTION LAYER: ENABLED',
} as const;

// API endpoints (placeholder for when server is built)
export const API_ENDPOINTS = {
  CHAT: '/api/chat',
  STATUS: '/api/status',
  HEALTH: '/api/health',
} as const;

// Colors and styling
export const THEME = {
  PRIMARY: '#00ff41',
  BACKGROUND: '#000000',
  ACCENT: '#001100',
} as const;