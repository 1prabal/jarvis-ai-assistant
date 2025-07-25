import React, { useState } from 'react';

interface TextInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
}

const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

export const TextInput: React.FC<TextInputProps> = ({ onSendMessage, disabled }) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (value.trim()) {
      onSendMessage(value.trim());
      setValue('');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full max-w-2xl mt-6 flex items-center bg-black/30 border border-cyan-400/30 rounded-full transition-all duration-300 focus-within:border-cyan-400 focus-within:shadow-lg focus-within:shadow-cyan-500/30 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={disabled ? 'Live Mode is active...' : 'Type your command...'}
        disabled={disabled}
        className="flex-grow bg-transparent text-cyan-300 placeholder-cyan-600/70 border-none focus:ring-0 focus:outline-none px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Text input for AI Assistant"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="p-3 text-cyan-400 rounded-full m-1 hover:bg-cyan-400/20 disabled:text-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors duration-200"
        aria-label="Send message"
      >
        <SendIcon className="h-6 w-6" />
      </button>
    </form>
  );
};
