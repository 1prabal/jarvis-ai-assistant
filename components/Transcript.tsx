
import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface TranscriptProps {
  transcript: ChatMessage[];
}

export const Transcript: React.FC<TranscriptProps> = ({ transcript }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [transcript]);

  return (
    <div className="flex-grow w-full max-w-4xl p-4 my-4 bg-black/30 border border-cyan-400/20 rounded-lg overflow-y-auto h-96">
      <div className="space-y-6">
        {transcript.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-md lg:max-w-xl px-5 py-3 rounded-xl ${msg.role === 'user' ? 'bg-blue-900/50 text-cyan-200' : 'bg-gray-800/50 text-cyan-400'}`}>
              <p className={`text-xs font-bold mb-1 ${msg.role === 'user' ? 'text-right text-cyan-500' : 'text-left text-green-400'}`}>
                {msg.role === 'user' ? 'Prabal' : 'Assistant'}
              </p>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 border-t border-cyan-700/50 pt-3">
                  <h4 className="text-xs font-semibold text-cyan-500 mb-2">Sources:</h4>
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((source, i) => (
                      <a
                        key={i}
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={source.uri}
                        className="inline-block text-sm bg-cyan-900/70 text-cyan-200 px-3 py-1 rounded-full hover:bg-cyan-800 transition-colors"
                      >
                        {source.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
};
