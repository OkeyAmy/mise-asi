import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import VideoRecordingFlow from './VideoRecordingFlow';
import { useToast } from '@/hooks/use-toast';

interface VideoTriggerProps {
  isMobile?: boolean;
}

export const VideoTrigger: React.FC<VideoTriggerProps> = ({ isMobile = false }) => {
  const [showVideoFlow, setShowVideoFlow] = useState(false);
  const [swipeStartY, setSwipeStartY] = useState<number | null>(null);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const { toast } = useToast();

  // Mobile swipe gesture detection
  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const screenHeight = window.innerHeight;
      const triggerZone = screenHeight * 0.75; // Bottom quarter of screen
      
      if (touch.clientY > triggerZone) {
        setSwipeStartY(touch.clientY);
        setIsSwipeActive(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwipeActive || swipeStartY === null) return;
      
      const touch = e.touches[0];
      const swipeDistance = swipeStartY - touch.clientY;
      const minSwipeDistance = 80;
      
      if (swipeDistance > minSwipeDistance) {
        setShowVideoFlow(true);
        setIsSwipeActive(false);
        setSwipeStartY(null);
      }
    };

    const handleTouchEnd = () => {
      setIsSwipeActive(false);
      setSwipeStartY(null);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, swipeStartY, isSwipeActive]);

  // Desktop logo click handler
  const handleDesktopTrigger = () => {
    setShowVideoFlow(true);
  };

  const handleVideoRecorded = (videoBlob: Blob) => {
    // Handle the recorded video
    console.log('Video recorded:', videoBlob);
    
    // Here you would typically:
    // 1. Upload the video to your backend
    // 2. Create a new AI session
    // 3. Process the video with AI
    
    toast({
      title: "Video Recorded",
      description: "Processing your video with AI...",
    });
    
    setShowVideoFlow(false);
  };

  const handleClose = () => {
    setShowVideoFlow(false);
  };

  // Mobile: Swipe indicator (optional visual feedback)
  if (isMobile && isSwipeActive) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none z-50">
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-white/20 backdrop-blur-md rounded-full px-4 py-2 border border-white/30">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
              <span className="text-white text-sm font-inter tracking-tight">
                Swipe up for AI Video
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop: Floating logo trigger
  if (!isMobile) {
    return (
      <>
        <button
          onClick={handleDesktopTrigger}
          className="fixed top-4 left-4 z-40 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-white/20 hover:shadow-xl group"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400/20 via-pink-400/20 to-violet-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Sparkles className="w-6 h-6 text-white group-hover:text-cyan-300 transition-colors duration-300" />
        </button>
        
        {showVideoFlow && (
          <VideoRecordingFlow
            onClose={handleClose}
            onVideoRecorded={handleVideoRecorded}
          />
        )}
      </>
    );
  }

  // Mobile: Just return the video flow when triggered
  return showVideoFlow ? (
    <VideoRecordingFlow
      onClose={handleClose}
      onVideoRecorded={handleVideoRecorded}
    />
  ) : null;
};

export default VideoTrigger;