import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import VideoRecordingFlow from './VideoRecordingFlow';
import { useToast } from '@/hooks/use-toast';

interface VideoTriggerProps {
  isMobile?: boolean;
  onTriggerRef?: (trigger: () => void) => void;
}

export const VideoTrigger: React.FC<VideoTriggerProps> = ({ isMobile = false, onTriggerRef }) => {
  const [showVideoFlow, setShowVideoFlow] = useState(false);
  const [swipeStartY, setSwipeStartY] = useState<number | null>(null);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const { toast } = useToast();

  // Expose trigger function to parent component
  useEffect(() => {
    if (onTriggerRef) {
      onTriggerRef(triggerVideoFlow);
    }
  }, [onTriggerRef]);

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

  // Trigger video flow from external call (e.g., header logo)
  const triggerVideoFlow = () => {
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

  // Desktop: No UI rendered, just video flow when triggered
  if (!isMobile) {
    return showVideoFlow ? (
      <VideoRecordingFlow
        onClose={handleClose}
        onVideoRecorded={handleVideoRecorded}
      />
    ) : null;
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