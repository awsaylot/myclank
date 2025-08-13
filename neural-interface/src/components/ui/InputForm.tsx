import { useState, useRef, useEffect } from 'react';
import { UI_CONSTANTS } from '../../utils/constants';

interface InputFormProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
  isConnected: boolean;
}

export function InputForm({ onSubmit, isLoading, isConnected }: InputFormProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && isConnected) {
      onSubmit(input); // Don't trim here to preserve whitespace
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    // Allow default paste behavior to preserve formatting
    const pastedText = e.clipboardData.getData('text');
    console.log('Pasted text length:', pastedText.length);
    console.log('Pasted text preview:', pastedText.substring(0, 100) + '...');
  };

  return (
    <form onSubmit={handleSubmit} className="input-form">
      <div className="input-container">
        <span className="input-prompt">&#62;</span>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={
            !isConnected 
              ? "Establishing neural connection..." 
              : isLoading 
              ? "Processing..." 
              : "Enter neural command or query... (Shift+Enter for new line)"
          }
          className="neural-input"
          maxLength={UI_CONSTANTS.MAX_INPUT_LENGTH}
          disabled={isLoading || !isConnected}
          rows={1}
          style={{
            resize: 'none',
            overflow: 'hidden',
            minHeight: '20px',
            maxHeight: '120px'
          }}
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