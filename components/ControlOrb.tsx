import React from 'react';
import { AssistantState } from '../types';

interface ControlOrbProps {
  state: AssistantState;
  onClick: () => void;
  disabled?: boolean;
}

const MicIcon: React.FC<{className?: string}> = ({className}) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
  </svg>
);

const StopIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 6h12v12H6z"/>
    </svg>
);

const LoadingSpinner: React.FC = () => (
  <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);


export const ControlOrb: React.FC<ControlOrbProps> = ({ state, onClick, disabled = false }) => {
  const getOrbStateClasses = () => {
    switch (state) {
      case AssistantState.LISTENING:
        return 'border-cyan-400 animate-pulse shadow-cyan-400/80';
      case AssistantState.THINKING:
        return 'border-purple-400 animate-spin-slow shadow-purple-400/80';
      case AssistantState.SPEAKING:
        return 'border-green-400 shadow-green-400/80 hover:border-red-500 hover:shadow-red-500/60';
      case AssistantState.ERROR:
        return 'border-red-500 shadow-red-500/80';
      case AssistantState.IDLE:
      default:
        return 'border-cyan-600 hover:border-cyan-400 hover:shadow-cyan-400/60';
    }
  };

  const renderContent = () => {
    switch (state) {
      case AssistantState.LISTENING:
        return <div className="w-10 h-10 bg-cyan-400 rounded-full shadow-lg"></div>;
      case AssistantState.THINKING:
        return <LoadingSpinner />;
      case AssistantState.SPEAKING:
        return <StopIcon className="h-8 w-8 text-green-400 group-hover:text-red-500 transition-colors" />;
      case AssistantState.ERROR:
         return <MicIcon className="h-10 w-10 text-red-500" />;
      case AssistantState.IDLE:
      default:
        return <MicIcon className="h-10 w-10 text-cyan-400 group-hover:text-white transition-colors" />;
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || state === AssistantState.LISTENING || state === AssistantState.THINKING}
      aria-label={state === AssistantState.SPEAKING ? 'Stop speaking' : 'Activate voice assistant'}
      className={`group w-32 h-32 rounded-full border-4 bg-black/50 flex items-center justify-center transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-black focus:ring-cyan-500 shadow-2xl ${getOrbStateClasses()} ${disabled ? 'opacity-50 cursor-not-allowed !border-cyan-800 !shadow-none' : ''}`}
    >
      {renderContent()}
    </button>
  );
};

// Add custom animation to tailwind config if possible, for now using a placeholder.
// In a real project, we would extend tailwind.config.js
// @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
// .animate-spin-slow { animation: spin-slow 3s linear infinite; }
// Since we use CDN, let's inject a style tag for this. This is a pragmatic choice.
const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .animate-spin-slow { animation: spin-slow 3s linear infinite; }
`;
document.head.appendChild(style);