import { useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageType } from '../../types/chat';
import { ChatMessage } from './ChatMessage';

interface MessageListProps {
  messages: ChatMessageType[];
  onRetry: () => void;
}

export function MessageList({ messages, onRetry }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    // Use a timeout to ensure the content is rendered before scrolling
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }, 100);
  };

  useEffect(() => {
    // Only scroll to bottom after messages have been fully rendered
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Also scroll when the last message content changes (streaming case)
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.content) {
      scrollToBottom();
    }
  }, [messages[messages.length - 1]?.content]);

  return (
    <div className="chat-messages">
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          onRetry={message.status === 'error' ? onRetry : undefined}
        />
      ))}
      <div ref={messagesEndRef} style={{ height: '1px', width: '100%' }} />
    </div>
  );
}