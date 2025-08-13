'use client';

import { useTime } from '../hooks/useTime';
import { useConnection } from '../hooks/useConnection';
import { useChat } from '../hooks/useChat';
import { Header } from './ui/Header';
import { StatusBar } from './ui/StatusBar';
import { Terminal } from './ui/Terminal';
import { ChatContainer } from './chat/ChatContainer';

export function NeuralInterface() {
  const { currentTime, currentDate } = useTime();
  const { connectionStatus, systemStatus, isConnected } = useConnection();
  const { 
    messages, 
    isLoading, 
    error, 
    connectionStatus: chatConnectionStatus,
    sendMessage, 
    clearMessages, 
    retryLastMessage 
  } = useChat();

  return (
    <div className="neural-interface">
      {/* Header */}
      <Header 
        currentTime={currentTime}
        currentDate={currentDate}
      />

      {/* Status Bar */}
      <StatusBar 
        connectionStatus={connectionStatus}
        isConnected={isConnected}
      />

      {/* Main Terminal Content with Messages */}
      <Terminal 
        currentTime={currentTime}
        isConnected={isConnected}
        messages={messages}
        onRetry={retryLastMessage}
      />

      {/* Bottom Terminal with Chat Input */}
      <div className="bottom-terminal">
        <ChatContainer 
          systemStatus={systemStatus}
          isConnected={isConnected}
          sendMessage={sendMessage}
          isLoading={isLoading}
          error={error}
          clearMessages={clearMessages}
          hasMessages={messages.length > 0}
        />
      </div>
    </div>
  );
}