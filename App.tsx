import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CameraView } from './components/CameraView';
import { ControlOrb } from './components/ControlOrb';
import { Transcript } from './components/Transcript';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { AssistantState } from './types';
import { TextInput } from './components/TextInput';
import { AppCommands } from './components/AppCommands';

const ScreenShareIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const AppsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
);

const LiveMicIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5.2-3c.1-1.02-.23-2.02-.85-2.85l1.65-1.65c1.02 1.22 1.6 2.83 1.6 4.5h-2.4zm-12 0c0-1.67.58-3.28 1.6-4.5L5.15 6.15C4.13 7.37 3.5 8.98 3.5 10.65h2.4zM12 18c-2.76 0-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V22h2v-3.08c3.39-.49 6-3.39 6-6.92h-2c0 2.76-2.24 5-5 5z"/>
  </svg>
);


const App: React.FC = () => {
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [currentView, setCurrentView] = useState<'camera' | 'screen'>('camera');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [showAppCommands, setShowAppCommands] = useState(false);

  const activeStream = currentView === 'camera' ? mediaStream : screenStream;

  const {
    assistantState,
    transcript,
    startListening,
    stopSpeaking,
    sendTextMessage,
    error,
  } = useVoiceAssistant(activeStream, isLiveMode);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let isCancelled = false;

    const getPermissions = async () => {
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!isCancelled) {
          stream = localStream;
          setMediaStream(localStream);
        } else {
          // If component unmounted while we were waiting, clean up.
          localStream.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Error accessing media devices.", err);
          setPermissionError("Permissions for camera and microphone are required. Please enable them in your browser settings and refresh.");
        }
      }
    };
    getPermissions();

    return () => {
      isCancelled = true;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const handleToggleView = useCallback(async () => {
    if (currentView === 'screen') {
        screenStream?.getTracks().forEach(track => track.stop());
        setScreenStream(null);
        setCurrentView('camera');
    } else {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            stream.getVideoTracks()[0].addEventListener('ended', () => {
                setScreenStream(null);
                setCurrentView('camera');
            });
            setScreenStream(stream);
            setCurrentView('screen');
        } catch (err) {
            console.error("Failed to start screen share", err);
        }
    }
  }, [currentView, screenStream]);

  const handleOrbClick = () => {
    if (assistantState === AssistantState.IDLE || assistantState === AssistantState.ERROR) {
      startListening();
    } else if (assistantState === AssistantState.SPEAKING) {
      stopSpeaking();
    }
  };

  const handleSendMessage = (message: string) => {
    if (message.trim()) {
      sendTextMessage(message);
    }
  };
  
  const toggleLiveMode = () => {
    setIsLiveMode(prev => !prev);
  }


  return (
    <div className="bg-black min-h-screen text-cyan-300 flex flex-col items-center justify-center p-4 selection:bg-cyan-500 selection:text-black">
      <div 
        className="w-full h-full absolute top-0 left-0 bg-repeat bg-center" 
        style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300ffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}>
      </div>
      
      {showAppCommands && <AppCommands onClose={() => setShowAppCommands(false)} />}

      <main className="w-full max-w-4xl h-full flex flex-col items-center z-10 p-2 md:p-6">
        <header className="w-full flex items-center justify-between p-4 border-b-2 border-cyan-400/30">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-4xl font-bold text-cyan-400 tracking-widest">
              AI Assistant
            </h1>
            <button 
              onClick={handleToggleView} 
              title={currentView === 'camera' ? 'Share Screen' : 'Stop Sharing'}
              aria-label={currentView === 'camera' ? 'Share Screen' : 'Stop Sharing'}
              className={`p-2 rounded-full transition-all duration-300 ${currentView === 'screen' ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-400/50' : 'text-cyan-400 hover:text-white hover:bg-cyan-400/20'}`}
            >
                <ScreenShareIcon className="h-5 w-5 md:h-6 md:w-6" />
            </button>
            <button 
                onClick={() => setShowAppCommands(true)} 
                title="View App Commands"
                aria-label="View available application commands"
                className="p-2 rounded-full text-cyan-400 hover:text-white hover:bg-cyan-400/20 transition-all duration-300"
            >
                <AppsIcon className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </div>
          <CameraView 
            stream={activeStream} 
            isMirrored={currentView === 'camera'}
          />
        </header>

        {permissionError ? (
          <div className="flex-grow flex items-center justify-center text-center">
            <p className="text-red-400 bg-red-900/50 p-4 rounded-lg border border-red-400">{permissionError}</p>
          </div>
        ) : (
          <>
            <Transcript transcript={transcript} />
            <div className="w-full flex flex-col items-center justify-center py-8">
               <div className="flex items-center justify-center gap-x-8 mb-6">
                 <ControlOrb
                    state={assistantState}
                    onClick={handleOrbClick}
                    disabled={isLiveMode}
                 />
                 <button
                    onClick={toggleLiveMode}
                    className={`group p-4 rounded-full transition-all duration-300 ${
                        isLiveMode 
                        ? 'bg-red-500/20 ring-2 ring-red-500 shadow-lg shadow-red-500/50' 
                        : 'bg-black/30 ring-2 ring-cyan-700 hover:ring-cyan-400'
                    }`}
                    aria-label={isLiveMode ? 'Stop live conversation' : 'Start live conversation'}
                    title={isLiveMode ? 'Stop live conversation' : 'Start live conversation'}
                >
                    <LiveMicIcon className={`h-8 w-8 transition-colors duration-300 ${isLiveMode ? 'text-red-500 animate-pulse' : 'text-cyan-500 group-hover:text-cyan-300'}`} />
                </button>
               </div>
              <TextInput 
                onSendMessage={handleSendMessage} 
                disabled={(assistantState !== AssistantState.IDLE && assistantState !== AssistantState.ERROR) || isLiveMode} 
              />
              {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
