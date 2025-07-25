import React from 'react';
import { localApps } from '../features/localApps';

interface AppCommandsProps {
  onClose: () => void;
}

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);


export const AppCommands: React.FC<AppCommandsProps> = ({ onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-gray-900/80 border-2 border-cyan-500/50 rounded-xl shadow-2xl shadow-cyan-500/20 w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-cyan-700/50">
          <h2 id="app-commands-title" className="text-xl font-bold text-cyan-300 tracking-wider">Available App Commands</h2>
          <button onClick={onClose} className="p-2 rounded-full text-cyan-400 hover:bg-cyan-400/20 transition-colors" aria-label="Close app commands view">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="p-6 overflow-y-auto" aria-labelledby="app-commands-title">
          <p className="text-cyan-400/80 mb-6">
            You can ask Jarvis to open any of the following installed applications. Say something like: "Jarvis, open my code editor" or "Launch Spotify".
            You can add more apps by editing the <code className="bg-cyan-900/50 text-cyan-200 px-1 py-0.5 rounded-md">features/localApps.ts</code> file.
          </p>
          <ul className="space-y-4">
            {localApps.map((app) => (
              <li key={app.name} className="p-4 bg-black/40 rounded-lg border border-cyan-400/20">
                <h3 className="font-bold text-lg text-cyan-300">{app.name}</h3>
                <p className="text-sm text-cyan-400/90 mt-1">
                  URL Scheme: <code className="bg-cyan-900/50 text-cyan-200 px-1 py-0.5 rounded-md">{app.urlScheme}</code>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs font-semibold text-gray-400 mr-2 self-center">Keywords:</span>
                  {app.commandKeywords.map((keyword) => (
                    <span key={keyword} className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded-md">
                      {keyword}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
