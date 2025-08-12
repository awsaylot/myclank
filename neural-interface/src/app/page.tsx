'use client';

import { useState, useEffect } from 'react';

export default function NeuralInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // Simulate connection after 2 seconds
    const timer = setTimeout(() => setIsConnected(true), 2000);
    
    // Update time every second
    const timeInterval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(timeInterval);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setMessages([...messages, input]);
      setInput('');
    }
  };

  return (
    <div className="neural-interface">
      {/* Header */}
      <div className="header">
        <div className="header-left">
          <span className="prompt-symbol">&#62;</span>
          <span className="title">NEURAL.INTERFACE.v2.1</span>
        </div>
        <div className="header-right">
          <span className="time">{currentTime}</span>
          <br />
          <span className="date">{new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-item">
          <span className="status-icon">⚡</span>
          <span>DEEPSEEK-NEURAL-7B</span>
        </div>
        <div className="status-item">
          <span className="status-icon">⚡</span>
          <span>STATUS: {isConnected ? 'ONLINE' : 'CONNECTING'}</span>
        </div>
        <div className="status-item">
          <span className="status-icon">◯</span>
          <span>SECURE_CHANNEL</span>
        </div>
        <div className="status-item ready">
          <span>READY</span>
          <div className="ready-indicator"></div>
        </div>
        <div className="status-right">
          <span className="quantum-core">⚛ QUANTUM_CORE</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        <div className="terminal-header">
          <span className="terminal-icon">[AI_NEURAL_CORE]</span>
          <span className="timestamp">08:16:24 PM</span>
        </div>
        
        <div className="terminal-window">
          <div className="terminal-content">
            <div className="init-text">NEURAL INTERFACE v2.1 INITIALIZED...</div>
            <div className="separator">_______________________________________</div>
            
            <div className="system-status">
              <div className="status-line">&#62; QUANTUM AI CORE: ONLINE</div>
              <div className="status-line">&#62; NEURAL PATHWAYS: ESTABLISHED</div>
              <div className="status-line">&#62; SECURITY PROTOCOLS: ACTIVE</div>
              <div className="status-line">&#62; ENCRYPTION LAYER: ENABLED</div>
            </div>
            
            <div className="separator">_______________________________________</div>
            
            <div className="network-status">
              <div>DEEPSEEK NEURAL NETWORK STATUS: READY</div>
              <div>AWAITING USER INPUT...</div>
            </div>

            {/* Chat Messages */}
            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div key={index} className="message">
                  <span className="prompt">&#62;</span> {msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Terminal */}
      <div className="bottom-terminal">
        <div className="terminal-prompt">
          <span className="prompt-text">root@neural-interface/home/user#</span>
          <span className="cursor-indicator">█</span>
        </div>
        
        <form onSubmit={handleSubmit} className="input-form">
          <div className="input-container">
            <span className="input-prompt">&#62;</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter neural command or query..."
              className="neural-input"
              maxLength={2048}
            />
            <span className="char-count">{input.length}/2048</span>
            <button type="submit" className="execute-btn">
              <span className="execute-icon">▶</span>
              <span>EXECUTE</span>
            </button>
          </div>
        </form>

        {/* Bottom Status */}
        <div className="bottom-status">
          <div className="bottom-status-left">
            <span>NEURAL_LINK: STANDBY</span>
            <span>SESSION: ACTIVE</span>
            <span>ENCRYPTION: AES-256</span>
          </div>
          <div className="bottom-status-right">
            <span className="cpu-status">🔥 CPU: 23%</span>
            <span className="mem-status">📊 MEM: 67%</span>
          </div>
        </div>
      </div>
    </div>
  );
}