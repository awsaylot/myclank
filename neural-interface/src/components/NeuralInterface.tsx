'use client';

import { useTime } from '../hooks/useTime';
import { useConnection } from '../hooks/useConnection';
import { Header } from './ui/Header';
import { StatusBar } from './ui/StatusBar';
import { Terminal } from './ui/Terminal';
import { ChatContainer } from './chat/ChatContainer';

export function NeuralInterface() {
  const { currentTime, currentDate } = useTime();
  const { connectionStatus, systemStatus, isConnected } = useConnection();

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

      {/* Main Terminal Content */}
      <Terminal 
        currentTime={currentTime}
        isConnected={isConnected}
      >
        {/* This space will show chat messages */}
      </Terminal>

      {/* Bottom Terminal with Chat */}
      <div className="bottom-terminal">
        <ChatContainer 
          systemStatus={systemStatus}
          isConnected={isConnected}
        />
      </div>
    </div>
  );
}