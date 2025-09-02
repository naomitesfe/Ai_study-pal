import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";

interface FocusModeProps {
  isActive: boolean;
  onToggle: () => void;
}

export function FocusMode({ isActive, onToggle }: FocusModeProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState<"flashcards" | "quiz" | "notes">("flashcards");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  
  const trackStudySession = useMutation(api.analytics.trackStudySession);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleSessionComplete = async () => {
    setIsRunning(false);
    
    try {
      await trackStudySession({
        type: sessionType,
        noteId: selectedNoteId as any,
        duration: 25, // 25 minutes
      });
      
      toast.success("Focus session completed! Great job! 🎉");
      
      // Reset timer
      setTimeLeft(25 * 60);
    } catch (error) {
      console.error("Failed to track session:", error);
    }
  };

  const startTimer = () => {
    setIsRunning(true);
    toast.success("Focus session started! Stay focused! 🎯");
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 z-50 flex items-center justify-center">
      <div className="absolute top-4 right-4">
        <button
          onClick={onToggle}
          className="text-white/70 hover:text-white text-2xl"
        >
          ✕
        </button>
      </div>

      <div className="text-center text-white">
        {/* Timer Display */}
        <div className="mb-8">
          <div className="text-8xl font-mono font-bold mb-4">
            {formatTime(timeLeft)}
          </div>
          <div className="text-xl text-white/80">
            {isRunning ? "Stay focused!" : "Ready to focus?"}
          </div>
        </div>

        {/* Progress Circle */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="white"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (timeLeft / (25 * 60))}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="flex justify-center space-x-4">
            {!isRunning ? (
              <button
                onClick={startTimer}
                className="px-8 py-3 bg-white text-purple-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Start Focus Session
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="px-8 py-3 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Pause
              </button>
            )}
            
            <button
              onClick={resetTimer}
              className="px-8 py-3 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Session Type Selector */}
          <div className="flex justify-center space-x-2">
            {["flashcards", "quiz", "notes"].map((type) => (
              <button
                key={type}
                onClick={() => setSessionType(type as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sessionType === type
                    ? "bg-white text-purple-900"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 text-white/60 text-sm max-w-md mx-auto">
          <p>💡 Focus for 25 minutes, then take a 5-minute break. This is the Pomodoro Technique!</p>
        </div>
      </div>
    </div>
  );
}
