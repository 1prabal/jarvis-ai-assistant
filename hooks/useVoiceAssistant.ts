
import { useState, useEffect, useRef, useCallback } from 'react';
import { AssistantState, ChatMessage } from '../types';
import { assistantService, AssistantResponse } from '../services/jarvisService';

// Extending the Window interface
declare global {
    interface Window {
        SpeechRecognition: any; // Using 'any' for broader compatibility
        webkitSpeechRecognition: any; // Fallback for Safari/older Chrome
        ImageCapture: any;
    }
    interface SpeechSynthesisVoice {
        gender?: 'male' | 'female' | 'other';
    }
    // These events are part of the standard DOM lib, but let's ensure they exist
    // for environments where they might be missing. Using 'any' to avoid redeclaration.
    interface SpeechRecognitionEvent extends Event {
        readonly resultIndex: number;
        readonly results: any; // SpeechRecognitionResultList
    }

    interface SpeechRecognitionErrorEvent extends Event {
        readonly error: string; // SpeechRecognitionErrorCode
        readonly message: string;
    }
}

// Fallback for browsers that might not have SpeechRecognition
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

export const useVoiceAssistant = (stream: MediaStream | null, isLiveMode: boolean) => {
  const [assistantState, setAssistantState] = useState<AssistantState>(AssistantState.IDLE);
  const [transcript, setTranscript] = useState<ChatMessage[]>([
    { role: 'model', content: "Hello Prabal. I am online and ready. Say 'Jarvis' or type a command to begin." }
  ]);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any | null>(null);
  const isProcessing = useRef(false);
  const manualActivation = useRef(false);
  const streamRef = useRef<MediaStream | null>(stream);
  const permissionDeniedRef = useRef(false);

  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);
  
  const speak = useCallback((text: string) => {
    setAssistantState(AssistantState.SPEAKING);
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = window.speechSynthesis.getVoices();
    const ukMaleVoice = voices.find(voice => voice.lang.includes('en') && voice.name.includes('Google UK English Male') );
    const usMaleVoice = voices.find(voice => voice.lang === 'en-US' && voice.name.includes('Google US English'));
    const defaultMaleVoice = voices.find(voice => voice.lang.includes('en') && voice.gender === 'male');

    utterance.voice = ukMaleVoice || usMaleVoice || defaultMaleVoice || voices[0];
    utterance.pitch = 0.9;
    utterance.rate = 1.1;

    utterance.onend = () => {
      isProcessing.current = false;
      manualActivation.current = false;
      setAssistantState(AssistantState.IDLE);
    };
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      if (event.error === 'interrupted') {
        // This is a user-initiated stop, not a system error.
        // We just need to clean up the state.
        isProcessing.current = false;
        manualActivation.current = false;
        setAssistantState(AssistantState.IDLE);
        return;
      }
      console.error(`SpeechSynthesis Error: ${event.error}`, event);
      
      let errorMessage = "My apologies, Prabal. I seem to have an issue with my vocal processors.";
       if (event.error === 'voice-unavailable') {
          errorMessage = "My configured voice is unavailable, Prabal. I will use a default voice for now.";
      } else if (event.error === 'network') {
          errorMessage = "A network error occurred while preparing my response, Prabal.";
      } else if (event.error === 'synthesis-failed') {
          errorMessage = "I was unable to synthesize a response, Prabal. Please try again.";
      }

      setError(errorMessage);
      isProcessing.current = false;
      manualActivation.current = false;
      setAssistantState(AssistantState.ERROR);
    };
    window.speechSynthesis.speak(utterance);
  }, []);

  const captureFrame = useCallback(async (): Promise<string | null> => {
    const currentStream = streamRef.current;
    if (!currentStream?.getVideoTracks().length) {
      return null;
    }
    const videoTrack = currentStream.getVideoTracks()[0];
    if (videoTrack.readyState !== 'live') {
      console.warn("Video track is not live, cannot capture frame.");
      return null;
    }

    // Method 1: ImageCapture API (preferred)
    if (window.ImageCapture) {
      try {
        const imageCapture = new window.ImageCapture(videoTrack);
        const blob = await imageCapture.takePhoto();
        return await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string)?.split(',')[1] ?? null);
          reader.onerror = (err) => {
            console.error("FileReader error on captured frame:", err);
            resolve(null);
          };
          reader.readAsDataURL(blob);
        });
      } catch (e: any) {
        console.warn(`ImageCapture API failed with error: "${e.message}". Falling back to canvas method.`);
      }
    }

    // Method 2: Canvas fallback
    try {
      const video = document.createElement('video');
      video.srcObject = currentStream;
      video.muted = true;
      return await new Promise((resolve) => {
        video.onloadeddata = () => {
          video.play().then(() => {
            const canvas = document.createElement('canvas');
            const settings = videoTrack.getSettings();
            canvas.width = settings.width || 640;
            canvas.height = settings.height || 480;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL('image/jpeg').split(',')[1]);
            } else {
              resolve(null);
            }
          }).catch((err) => {
            console.error("Video playback failed for canvas capture:", err);
            resolve(null);
          }).finally(() => {
            video.pause();
            video.srcObject = null;
          });
        };
        video.onerror = () => {
          console.error("Video element failed to load for canvas capture.");
          resolve(null);
        };
      });
    } catch (e) {
      console.error("Canvas fallback for frame capture failed:", e);
      return null;
    }
  }, []);

  const processAndRespond = useCallback(async (text: string) => {
    if (!text?.trim() || isProcessing.current) {
        if (!isProcessing.current) {
            setAssistantState(AssistantState.IDLE);
        }
        return;
    };
    isProcessing.current = true;
    setTranscript(prev => [...prev, { role: 'user', content: text }]);
    setAssistantState(AssistantState.THINKING);

    const frame = await captureFrame();

    try {
      const { text: responseText, sources, action }: AssistantResponse = await assistantService.sendMessage(text, frame);
      
      if (action?.type === 'open_url' && action.url) {
        try {
          new URL(action.url);
          window.open(action.url, '_blank');
        } catch(e) {
          console.error("AI returned an invalid URL to open:", action.url, e);
          // Don't open the tab, but still report what the AI said.
        }
      }

      setTranscript(prev => [...prev, { role: 'model', content: responseText, sources }]);
      speak(responseText);
    } catch (e: any) {
      const errorMessage = e?.message || "An error occurred while processing your request, Prabal.";
      setError(errorMessage);
      setTranscript(prev => [...prev, { role: 'model', content: errorMessage }]);
      isProcessing.current = false;
      setAssistantState(AssistantState.ERROR);
    }
  }, [speak, captureFrame]);

    const stopSpeaking = () => {
        window.speechSynthesis.cancel();
    };

  useEffect(() => {
    if (!SpeechRecognitionAPI) {
      setError("Your browser does not support the Web Speech API. Please try Chrome or Edge.");
      setAssistantState(AssistantState.ERROR);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const lastResult = event.results[event.results.length - 1];
      if (!lastResult.isFinal) return;
      
      const fullTranscript = lastResult[0].transcript.trim();
      const lowerCaseTranscript = fullTranscript.toLowerCase();
      
      if (assistantState === AssistantState.SPEAKING && /\bstop\b/.test(lowerCaseTranscript)) {
        stopSpeaking();
        return;
      }
      
      if (isProcessing.current) return;
      if (!fullTranscript) return;

      if (isLiveMode) {
        processAndRespond(fullTranscript);
        return;
      }

      if (manualActivation.current) {
        manualActivation.current = false;
        processAndRespond(fullTranscript);
        return;
      }

      const wakeWord = 'jarvis';
      const wakeWordIndex = lowerCaseTranscript.lastIndexOf(wakeWord);

      if (wakeWordIndex > -1) {
        const command = fullTranscript.substring(wakeWordIndex + wakeWord.length).trim();
        if (command) {
          processAndRespond(command);
        } else {
            setAssistantState(AssistantState.LISTENING);
            setTimeout(() => {
                setAssistantState(currentState => currentState === AssistantState.LISTENING ? AssistantState.IDLE : currentState);
            }, 2000);
        }
      }
    };

    recognition.onend = () => {
      if (permissionDeniedRef.current) {
        return;
      }
      if (assistantState !== AssistantState.ERROR && !isProcessing.current) {
        try {
          recognitionRef.current?.start();
        } catch (e) {
            console.warn("Recognition restart failed, will retry.", e);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
      
      console.error("SpeechRecognition Error:", event.error, event.message);
      
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        permissionDeniedRef.current = true;
        setError("Speech recognition permission was denied. Please allow microphone access and refresh the page.");
        setAssistantState(AssistantState.ERROR);
        recognitionRef.current?.abort();
      }
    };

    try {
      recognition.start();
    } catch(e) {
      console.error("Initial recognition start failed.", e);
      setError("Could not start voice recognition.");
      setAssistantState(AssistantState.ERROR);
    }
    
    window.speechSynthesis.getVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }

    return () => {
        recognitionRef.current?.abort();
    }
  }, [processAndRespond, isLiveMode]); 

  const startListening = () => {
    if (assistantState === AssistantState.IDLE || assistantState === AssistantState.ERROR) {
      setError(null);
      manualActivation.current = true;
      setAssistantState(AssistantState.LISTENING);
    }
  };

  const sendTextMessage = useCallback((message: string) => {
    processAndRespond(message);
  }, [processAndRespond]);

  return { assistantState, transcript, startListening, stopSpeaking, error, sendTextMessage };
};
