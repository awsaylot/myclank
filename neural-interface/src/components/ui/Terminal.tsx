import { ReactNode } from 'react';
import { SYSTEM_MESSAGES, STATUS_MESSAGES } from '../../utils/constants';
import { MessageList } from '../chat/MessageList';
import { ChatMessage } from '../../types/chat';

interface TerminalProps {
  currentTime: string;
  isConnected: boolean;
  messages: ChatMessage[];
  onRetry: () => void;
}

export function Terminal({ currentTime, isConnected, messages, onRetry }: TerminalProps) {
  return (
    <div className="main-content">
      <div className="terminal-header">
        <span className="terminal-icon">[AI_NEURAL_CORE]</span>
        <span className="timestamp">{currentTime}</span>
      </div>
      
      <div className="terminal-window">
        <div className="terminal-content">
          <div className="init-text">{SYSTEM_MESSAGES.INIT}</div>
          <div className="separator">_______________________________________</div>
          
          <div className="system-status">
            <div className="status-line">{STATUS_MESSAGES.QUANTUM_CORE}</div>
            <div className="status-line">{STATUS_MESSAGES.NEURAL_PATHWAYS}</div>
            <div className="status-line">{STATUS_MESSAGES.SECURITY}</div>
            <div className="status-line">{STATUS_MESSAGES.ENCRYPTION}</div>
          </div>
          
          <div className="separator">_______________________________________</div>
          
          <div className="network-status">
            <div>{SYSTEM_MESSAGES.READY}</div>
            <div>
              {isConnected ? SYSTEM_MESSAGES.AWAITING : SYSTEM_MESSAGES.CONNECTING}
            </div>
          </div>

          {/* Messages appear here in the terminal window */}
          {messages.length > 0 && (
            <>
              <div className="separator" style={{ marginTop: '20px' }}>
                _______________________________________
              </div>
              <MessageList 
                messages={messages}
                onRetry={onRetry}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}