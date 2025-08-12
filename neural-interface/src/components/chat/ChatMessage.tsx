import { ChatMessage as ChatMessageType } from '../../types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
  onRetry?: () => void;
}

export function ChatMessage({ message, onRetry }: ChatMessageProps) {
  const getMessagePrefix = () => {
    switch (message.role) {
      case 'user':
        return '> USER:';
      case 'assistant':
        return '> AI:';
      case 'system':
        return '> SYS:';
      default:
        return '>';
    }
  };

  const getMessageClass = () => {
    let baseClass = 'message';
    
    if (message.status === 'sending') {
      baseClass += ' message-sending';
    } else if (message.status === 'error') {
      baseClass += ' message-error';
    } else if (message.role === 'assistant') {
      baseClass += ' message-assistant';
    } else if (message.role === 'system') {
      baseClass += ' message-system';
    }
    
    return baseClass;
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className={getMessageClass()}>
      <span className="message-prefix">{getMessagePrefix()}</span>
      <span className="message-content">
        {message.status === 'sending' && message.content === '' ? (
          <span className="loading-dots">Processing neural patterns...</span>
        ) : (
          message.content
        )}
      </span>
      <span className="message-timestamp">
        [{formatTimestamp(message.timestamp)}]
      </span>
      {message.status === 'error' && onRetry && (
        <button 
          onClick={onRetry}
          className="retry-button"
          aria-label="Retry message"
        >
          ↻ RETRY
        </button>
      )}
    </div>
  );
}