import { InputForm } from '../ui/InputForm';
import { BottomStatus } from '../ui/BottomStatus';

interface ChatContainerProps {
  systemStatus: any;
  isConnected: boolean;
  sendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
  clearMessages: () => void;
  hasMessages: boolean;
}

export function ChatContainer({ 
  systemStatus, 
  isConnected, 
  sendMessage, 
  isLoading, 
  error, 
  clearMessages, 
  hasMessages 
}: ChatContainerProps) {
  return (
    <>
      {/* Terminal Prompt */}
      <div className="terminal-prompt">
        <span className="prompt-text">root@neural-interface/home/user#</span>
        <span className="cursor-indicator">█</span>
      </div>

      {/* Input Form */}
      <InputForm 
        onSubmit={sendMessage}
        isLoading={isLoading}
        isConnected={isConnected}
      />

      {/* Bottom Status */}
      <BottomStatus 
        systemStatus={systemStatus}
        isConnected={isConnected}
        error={error}
      />

      {/* Debug Actions (can be removed in production) */}
      {hasMessages && (
        <div className="debug-actions" style={{ marginTop: '10px', fontSize: '10px' }}>
          <button 
            onClick={clearMessages}
            className="clear-btn"
            style={{
              background: 'rgba(255, 0, 0, 0.1)',
              border: '1px solid #ff0000',
              color: '#ff0000',
              padding: '4px 8px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            CLEAR HISTORY
          </button>
        </div>
      )}
    </>
  );
}