import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Sparkles, RefreshCw, Video, Volume2, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useABTesting } from '@/hooks/useABTesting';
import { ConversationOverlay } from './ConversationOverlay';
import { SimulatedMessage } from '@/data/mockConversation';
import { motion } from 'framer-motion';

interface VideoRecordingFlowProps {
  onClose: () => void;
  onVideoRecorded: (videoBlob: Blob) => void;
  isMobile?: boolean;
}

export const VideoRecordingFlow: React.FC<VideoRecordingFlowProps> = ({
  onClose,
  onVideoRecorded,
  isMobile = false,
}) => {
  const [stage, setStage] = useState<'confirmation' | 'recording'>('confirmation');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [currentUserMessage, setCurrentUserMessage] = useState<SimulatedMessage | null>(null);
  const [currentAiMessage, setCurrentAiMessage] = useState<SimulatedMessage | null>(null);
  const [inputValue, setInputValue] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef(false);
  const { toast } = useToast();
  const { currentVideoConfirmation } = useABTesting();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    // This effect is now for managing the recording timer only.
    // The conversation simulation logic has been moved to handleSendMessage.
    if (isRecording && timerRef.current === null) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else if (!isRecording && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newUserMessage: SimulatedMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputValue,
    };
    setCurrentUserMessage(newUserMessage);
    setCurrentAiMessage(null); // Clear previous AI response
    setInputValue('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: SimulatedMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: "That's a great question! Let me look into that for you.",
      };
      setCurrentAiMessage(aiResponse);
    }, 1200);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { ideal: facingMode }
        },
        audio: true
      });

      setStream(mediaStream);

      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const wasCancelled = isCancelledRef.current;
        isCancelledRef.current = false; // Reset immediately

        if (wasCancelled) {
          console.log("Recording cancelled.");
          chunksRef.current = [];
          // Centralized cleanup only on explicit cancellation or component unmount
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
          }
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsRecording(false);
          onClose(); // Call close here after full cleanup
        } else {
        const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' });
        onVideoRecorded(videoBlob);
          // For successful recordings, do NOT stop stream or close UI. Video should persist.
          // Cleanup will happen when the component unmounts or handleClose is explicitly called.
        }
      };

      isCancelledRef.current = false; // Reset on start
      mediaRecorder.start();
      setIsRecording(true);
      setStage('recording');
      setRecordingTime(0);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to record video.",
        variant: "destructive"
      });
    }
  };

  const switchCamera = async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { ideal: newFacingMode }
        },
        audio: true
      });

      setStream(newStream);

      if (isRecording && mediaRecorderRef.current) {
        // Re-create MediaRecorder for the new stream
        const newMediaRecorder = new MediaRecorder(newStream, {
          mimeType: 'video/webm;codecs=vp9'
        });

        newMediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
    }
  };

        // Preserve the original onstop handler for the new recorder
        newMediaRecorder.onstop = mediaRecorderRef.current.onstop;
        
        mediaRecorderRef.current = newMediaRecorder;
        mediaRecorderRef.current.start();
      }

    } catch (error) {
      console.error("Error switching camera:", error);
      toast({
        title: "Camera Error",
        description: "Could not switch camera. It might be busy or not available.",
        variant: "destructive",
      });
    }
  };

  const handleStopSession = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      isCancelledRef.current = true; // Set flag to indicate user-initiated stop
      mediaRecorderRef.current.stop();
    } else {
      // If not recording (e.g., in confirmation), just clean up and close
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
        setStream(null);
    }
      onClose();
    }
  };

  // Confirmation Modal
  if (stage === 'confirmation') {
    return (
      <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-xl flex items-end lg:items-center justify-center p-4">
        {/* Mobile: Slide up from bottom */}
        <motion.div
          initial={{ opacity: 0, y: isMobile ? '100%' : 20, scale: isMobile ? 1 : 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: isMobile ? '100%' : 20, scale: isMobile ? 1 : 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-md lg:max-w-lg bg-white/15 backdrop-blur-lg rounded-2xl lg:rounded-3xl shadow-2xl border border-white/20 p-6 lg:p-8 transform transition-all duration-500 ease-out animate-slide-in-right lg:animate-scale-in"
        >
          
          {/* Glowing border effect */}
          <div className="absolute inset-0 rounded-2xl lg:rounded-3xl bg-gradient-to-r from-orange-400/20 via-red-400/20 to-amber-400/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          {/* Close button */}
          <button 
            onClick={handleStopSession}
            aria-label="Close"
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-105"
          >
            <X className="w-4 h-4 text-white/80" />
          </button>

          <div className="text-center space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="text-xl lg:text-2xl font-inter font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-amber-300"
              >
                {currentVideoConfirmation.title}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="text-sm lg:text-base text-white/70 font-inter tracking-tight"
              >
                {currentVideoConfirmation.description}
              </motion.p>
            </div>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="flex flex-col lg:flex-row gap-3 lg:gap-4"
            >
              <Button
                onClick={startRecording}
                className="w-full lg:flex-1 bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/50 rounded-full py-3 lg:py-4 font-inter tracking-tight transition-all duration-200 hover:scale-105 hover:shadow-lg relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400/10 to-red-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Play className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
              
              <Button
                onClick={handleStopSession}
                variant="ghost"
                className="w-full lg:flex-1 text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full py-3 lg:py-4 font-inter tracking-tight transition-all duration-200 hover:bg-white/10"
              >
                Cancel
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Recording State
  if (stage === 'recording') {
    return (
      <div className="fixed inset-0 z-[100] bg-black">
        {/* Video Preview */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover brightness-75"
        />

        <ConversationOverlay 
          currentUserMessage={currentUserMessage}
          currentAiMessage={currentAiMessage}
        />

        {/* --- Bottom Controls --- */}
        <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-4 pointer-events-auto">
          
          {/* Bottom input bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="flex items-center gap-2 p-2 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 shadow-lg w-[92%] max-w-lg"
          >
            <input
              type="text"
              placeholder="Ask Anything"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              className="flex-1 bg-transparent text-white placeholder:text-white/50 text-base px-3 py-2 border-none focus:outline-none focus:ring-0"
            />
            <motion.button
              onClick={handleStopSession}
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2.5 rounded-full bg-white/90 text-black font-semibold flex items-center gap-2"
            >
              <div className="w-2.5 h-2.5 bg-black rounded-sm" />
              Stop
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
};

export default VideoRecordingFlow;