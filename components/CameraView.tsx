
import React, { useRef, useEffect } from 'react';

interface CameraViewProps {
  stream: MediaStream | null;
  isMirrored?: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({ stream, isMirrored = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-cyan-400 shadow-lg shadow-cyan-500/50 bg-black flex items-center justify-center">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="text-cyan-400 text-xs text-center p-1 animate-pulse">
          Awaiting View
        </div>
      )}
    </div>
  );
};
