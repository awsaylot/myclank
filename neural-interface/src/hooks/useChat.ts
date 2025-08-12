import { useState, useCallback } from 'react';
import { ChatMessage, ChatState } from '../types/chat';
import { llmService } from '../services/llmService';

export function useChat(): ChatState & {
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  retryLastMessage: () => Promise<void>;
} {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connected');

  const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      content: content.trim(),
      timestamp: new Date(),
      role: 'user',
      status: 'sent',
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Create placeholder assistant message
      const assistantMessageId = generateMessageId();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        content: '',
        timestamp: new Date(),
        role: 'assistant',
        status: 'sending',
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Get response from LLM service
      const response = await llmService.sendMessage(content, messages);

      // Update assistant message with response
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: response.content,
                status: 'sent' as const,
                timestamp: new Date(response.timestamp),
              }
            : msg
        )
      );

      setConnectionStatus('connected');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setConnectionStatus('error');
      
      // Update the assistant message to show error
      setMessages(prev =>
        prev.map(msg =>
          msg.role === 'assistant' && msg.status === 'sending'
            ? {
                ...msg,
                content: 'Neural pathway error detected. Please retry transmission.',
                status: 'error' as const,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const retryLastMessage = useCallback(async () => {
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
    if (lastUserMessage) {
      // Remove failed assistant messages
      setMessages(prev => prev.filter(msg => !(msg.role === 'assistant' && msg.status === 'error')));
      await sendMessage(lastUserMessage.content);
    }
  }, [messages, sendMessage]);

  return {
    messages,
    isLoading,
    error,
    connectionStatus,
    sendMessage,
    clearMessages,
    retryLastMessage,
  };
}