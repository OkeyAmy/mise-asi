import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Square, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface VideoRecordingFlowProps {
  onClose: () => void;
  onVideoRecorded: (videoBlob: Blob) => void;
}

export const VideoRecordingFlow: React.FC<VideoRecordingFlowProps> = ({
  onClose,
  onVideoRecorded,
}) => {
  const [stage, setStage] = useState<'confirmation' | 'recording' | 'processing'>('confirmation');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
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
          facingMode: 'environment'
        },
        audio: true
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

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
        const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' });
        onVideoRecorded(videoBlob);
        setStage('processing');
      };

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

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRecording(false);
    onClose();
  };

  // Confirmation Modal
  if (stage === 'confirmation') {
    return (
      <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-xl flex items-end lg:items-center justify-center p-4">
        {/* Mobile: Slide up from bottom */}
        <div className="w-full max-w-md lg:max-w-lg bg-white/15 backdrop-blur-lg rounded-2xl lg:rounded-3xl shadow-2xl border border-white/20 p-6 lg:p-8 transform transition-all duration-500 ease-out animate-slide-in-right lg:animate-scale-in">
          
          {/* Glowing border effect */}
          <div className="absolute inset-0 rounded-2xl lg:rounded-3xl bg-gradient-to-r from-cyan-400/20 via-pink-400/20 to-violet-400/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          {/* Close button */}
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-105"
          >
            <X className="w-4 h-4 text-white/80" />
          </button>

          <div className="text-center space-y-6">
            {/* Icon */}
            <div className="mx-auto w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-cyan-400/20 to-pink-400/20 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-pink-400 opacity-20 animate-pulse" />
              <Camera className="w-8 h-8 lg:w-10 lg:h-10 text-white drop-shadow-lg" />
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-cyan-300 animate-pulse" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h2 className="text-xl lg:text-2xl font-inter font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-cyan-300">
                Launch AI Video Environment
              </h2>
              <p className="text-sm lg:text-base text-white/70 font-inter tracking-tight">
                Your recording will be securely analyzed by AI in real-time.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
              <Button
                onClick={startRecording}
                className="w-full lg:flex-1 bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/50 rounded-full py-3 lg:py-4 font-inter tracking-tight transition-all duration-200 hover:scale-105 hover:shadow-lg relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Play className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
              
              <Button
                onClick={handleClose}
                variant="ghost"
                className="w-full lg:flex-1 text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full py-3 lg:py-4 font-inter tracking-tight transition-all duration-200 hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
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
          className="w-full h-full object-cover"
        />

        {/* Overlay Controls */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Timer - Top Left */}
          <div className="absolute top-4 left-4 bg-black/30 backdrop-blur-md rounded-full px-4 py-2 pointer-events-auto">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white text-sm font-inter font-medium tracking-tight">
                {formatTime(recordingTime)}
              </span>
            </div>
          </div>

          {/* AI Session Tracker - Top Right */}
          <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 pointer-events-auto">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-white text-sm font-inter tracking-tight">
                Recording...
              </span>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 pointer-events-auto">
            {/* Stop Recording Button */}
            <button
              onClick={stopRecording}
              className="w-16 h-16 lg:w-20 lg:h-20 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-xl backdrop-blur-sm border-2 border-white/30"
            >
              <Square className="w-6 h-6 lg:w-8 lg:h-8 text-white fill-current" />
            </button>

            {/* Cancel Button */}
            <button
              onClick={handleClose}
              className="w-12 h-12 lg:w-14 lg:h-14 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 backdrop-blur-md border border-white/30"
            >
              <X className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Ambient Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-600/10 via-transparent to-purple-600/10 pointer-events-none animate-pulse" />
      </div>
    );
  }

  // Processing State
  if (stage === 'processing') {
    return (
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-center justify-center">
        <div className="bg-white/15 backdrop-blur-lg rounded-3xl p-8 max-w-md mx-4 text-center border border-white/20 shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-400/20 to-pink-400/20 flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-pink-400 opacity-20 animate-spin" />
            <Sparkles className="w-8 h-8 text-cyan-300 animate-pulse" />
          </div>
          
          <h3 className="text-xl font-inter font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-cyan-300 mb-2">
            Analyzing Video
          </h3>
          <p className="text-white/70 font-inter tracking-tight">
            AI is processing your recording...
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default VideoRecordingFlow;