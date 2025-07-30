import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, ArrowLeft, Volume2, VolumeX } from 'lucide-react';

interface AudioChatProps {
  session: Session | null;
}

const AudioChat = ({ session }: AudioChatProps) => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcription, setTranscription] = useState('');

  // Placeholder functionality - will be enhanced with real audio processing
  const handleStartRecording = () => {
    setIsRecording(true);
    // TODO: Implement audio recording with OpenAI Realtime API or ElevenLabs
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // TODO: Process recorded audio
  };

  const handleTogglePlayback = () => {
    setIsPlaying(!isPlaying);
    // TODO: Implement audio playback control
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
      {/* Liquid Glass Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-600/15 to-blue-600/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/')}
          className="liquid-glass-button backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold">AI Voice Recognition</h1>
        <div className="w-10"></div> {/* Spacer */}
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pb-6 min-h-[80vh]">
        {/* Voice Visualization */}
        <div className="mb-12">
          <div className={`w-64 h-64 rounded-full flex items-center justify-center transition-all duration-500 ${
            isRecording 
              ? 'bg-gradient-to-br from-red-500/30 to-pink-500/30 border-2 border-red-500/50 animate-pulse scale-110' 
              : 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-2 border-purple-500/30'
          }`}>
            <div className={`w-48 h-48 rounded-full bg-gradient-to-br from-purple-400/40 to-blue-400/40 flex items-center justify-center transition-all duration-300 ${
              isRecording ? 'scale-90' : 'scale-100'
            }`}>
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-300/60 to-blue-300/60 flex items-center justify-center">
                {isRecording ? (
                  <MicOff className="w-16 h-16 text-red-400" />
                ) : (
                  <Mic className="w-16 h-16 text-purple-300" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center space-x-6 mb-8">
          <Button
            onClick={handleTogglePlayback}
            variant="ghost"
            size="icon"
            className="liquid-glass-button w-14 h-14 backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 rounded-full"
          >
            {isPlaying ? (
              <VolumeX className="w-6 h-6" />
            ) : (
              <Volume2 className="w-6 h-6" />
            )}
          </Button>

          <Button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`liquid-glass-card w-20 h-20 rounded-full transition-all duration-300 ${
              isRecording 
                ? 'bg-gradient-to-br from-red-500/30 to-pink-500/30 border-red-500/50 hover:from-red-500/40 hover:to-pink-500/40' 
                : 'bg-gradient-to-br from-purple-500/30 to-blue-500/30 border-purple-500/30 hover:from-purple-500/40 hover:to-blue-500/40'
            } border-2`}
          >
            {isRecording ? (
              <div className="w-6 h-6 bg-red-400 rounded-sm"></div>
            ) : (
              <Mic className="w-8 h-8 text-purple-300" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="liquid-glass-button w-14 h-14 backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 rounded-full"
          >
            <div className="w-6 h-6 border-2 border-current rounded"></div>
          </Button>
        </div>

        {/* Feature Buttons */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          <Button
            variant="ghost"
            className="liquid-glass-card h-16 backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 rounded-xl flex flex-col items-center justify-center space-y-1"
          >
            <div className="w-5 h-5 flex items-center">
              <div className="w-full h-0.5 bg-current"></div>
              <div className="w-full h-0.5 bg-current ml-1"></div>
              <div className="w-full h-0.5 bg-current ml-1"></div>
            </div>
            <span className="text-xs">Voice Clarity Boost</span>
          </Button>

          <Button
            variant="ghost"
            className="liquid-glass-card h-16 backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 rounded-xl flex flex-col items-center justify-center space-y-1"
          >
            <div className="w-5 h-5 flex items-center">
              <ArrowLeft className="w-3 h-3" />
              <div className="w-2 h-2 bg-current rounded-full mx-1"></div>
              <ArrowLeft className="w-3 h-3 rotate-180" />
            </div>
            <span className="text-xs">Instant Speech Capture</span>
          </Button>
        </div>

        {/* Transcription Display */}
        {transcription && (
          <div className="liquid-glass-section backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 mt-8 w-full max-w-2xl">
            <h3 className="text-sm font-semibold mb-2 text-purple-300">Transcription:</h3>
            <p className="text-white/90">{transcription}</p>
          </div>
        )}

        {/* Status Text */}
        <p className="text-center text-white/70 mt-8 max-w-md">
          {isRecording 
            ? "Listening... Speak clearly for best results"
            : "Tap the microphone to start voice conversation"
          }
        </p>
      </main>
    </div>
  );
};

export default AudioChat;