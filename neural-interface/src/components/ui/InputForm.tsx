import { useState } from 'react';
import { UI_CONSTANTS } from '../../utils/constants';

interface InputFormProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
  isConnected: boolean;
}

export function InputForm({ onSubmit, isLoading, isConnected }: InputFormProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && isConnected) {
      onSubmit(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="input-form">
      <div className="input-container">
        <span className="input-prompt">&#62;</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            !isConnected 
              ? "Establishing neural connection..." 
              : isLoading 
              ? "Processing..." 
              : "Enter neural command or query..."
          }
          className="neural-input"
          maxLength={UI_CONSTANTS.MAX_INPUT_LENGTH}
          disabled={isLoading || !isConnected}
        />
        <span className="char-count">
          {input.length}/{UI_CONSTANTS.MAX_INPUT_LENGTH}
        </span>
        <button 
          type="submit" 
          className="execute-btn"
          disabled={!input.trim() || isLoading || !isConnected}
        >
          <span className="execute-icon">
            {isLoading ? '◐' : '▶'}
          </span>
          <span>{isLoading ? 'PROCESSING' : 'EXECUTE'}</span>
        </button>
      </div>
    </form>
  );
}