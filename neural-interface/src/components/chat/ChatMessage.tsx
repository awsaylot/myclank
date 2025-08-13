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

  // Debug: Log message content length
  console.log(`Message ${message.id} content length: ${message.content.length}`);

  return (
    <div className={getMessageClass()}>
      <div style={{ width: '100%', display: 'block' }}>
        <span className="message-prefix">{getMessagePrefix()}</span>
        <span className="message-timestamp" style={{ float: 'right' }}>
          [{formatTimestamp(message.timestamp)}]
        </span>
        <div className="message-content" style={{ clear: 'both', marginTop: '2px' }}>
          {message.status === 'sending' && message.content === '' ? (
            <span className="loading-dots">Processing neural patterns...</span>
          ) : (
            message.content
          )}
        </div>
        {message.status === 'error' && onRetry && (
          <button 
            onClick={onRetry}
            className="retry-button"
            aria-label="Retry message"
            style={{ marginTop: '4px' }}
          >
            ↻ RETRY
          </button>
        )}
      </div>
    </div>
  );
}