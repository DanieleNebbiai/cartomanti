"use client";

import { useState, useEffect, useRef } from "react";
import { useTrialUsage } from "@/hooks/use-trial-usage";
import { useAuth } from "@/hooks/use-auth";
import PaymentModal from "@/components/payment-modal";
import VoiceRecorder from "@/components/voice-recorder";
import AudioProcessor from "@/components/audio-processor";
import ConversationControls from "@/components/conversation-controls";

interface VoiceConversationProps {
  selectedOperator?: string;
  selectedCategory?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onUpgrade?: () => void;
  onLoginRequired?: () => void;
}

interface ConversationMessage {
  role: string;
  content: string;
}

export default function VoiceConversation({
  selectedOperator,
  selectedCategory,
  onConnect,
  onDisconnect,
  onError,
  onUpgrade,
  onLoginRequired,
}: VoiceConversationProps) {
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFirstUserInput, setIsFirstUserInput] = useState(true);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);

  const sessionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { isAuthenticated: authIsAuthenticated, loading: authLoading } =
    useAuth();
  const {
    hasExceededLimit,
    activateTrial,
    usage,
    isLoading: isUsageLoading,
    isAuthenticated: trialIsAuthenticated,
  } = useTrialUsage();

  // Debug authentication state changes - only log significant changes
  const prevAuth = useRef({ authIsAuthenticated: false, authLoading: true });
  useEffect(() => {
    if (
      prevAuth.current.authIsAuthenticated !== authIsAuthenticated ||
      (prevAuth.current.authLoading && !authLoading)
    ) {
      prevAuth.current = { authIsAuthenticated, authLoading };
    }
  }, [authIsAuthenticated, trialIsAuthenticated, authLoading, isUsageLoading]);

  // Initialize voice recorder hook
  const voiceRecorder = VoiceRecorder({
    onAudioReady: handleAudioReady,
    isAISpeaking,
    isFirstUserInput,
    onFirstUserInputChange: setIsFirstUserInput,
    onListeningChange: setIsListening,
    onRecordingChange: setIsRecording,
  });

  // Initialize audio processor hook
  const audioProcessor = AudioProcessor({
    selectedOperator,
    selectedCategory,
    onTTSStart: () => setIsAISpeaking(true),
    onTTSEnd: handleTTSEnd,
    onTTSError: handleTTSError,
  });

  // Handle audio ready from voice recorder
  async function handleAudioReady(audioBlob: Blob) {
    // No need to check limits here - we check at conversation start

    try {
      setIsProcessing(true);

      const result = await audioProcessor.processConversationFlow(
        audioBlob,
        conversation
      );

      // Update conversation history
      const newConversation = [
        ...conversation,
        { role: "user", content: result.userMessage },
        { role: "assistant", content: result.aiResponse },
      ];
      setConversation(newConversation);

      console.log("💬 Main: User said:", result.userMessage);
      console.log(
        "💬 Main: AI replied:",
        result.aiResponse.substring(0, 100) + "..."
      );
    } catch (error) {
      console.error("❌ Main: Error processing audio:", error);
      onError?.(error as Error);

      // Restart listening on error
      setTimeout(() => {
        if (sessionStartTime && !isListening && !isRecording) {
          console.log("🔄 Main: Restarting listening after error");
          voiceRecorder.startRecording();
        }
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  }

  // Handle TTS end
  function handleTTSEnd() {
    console.log("🔇 Main: AI finished speaking - restarting listening");
    setIsAISpeaking(false);

    // Restart listening after AI finishes
    setTimeout(() => {
      if (!sessionStartTime) {
        console.log(
          "🔄 Main: Restarting session and listening after AI speech"
        );
        setSessionStartTime(new Date());
        voiceRecorder.startRecording();
      } else if (!isListening && !isRecording) {
        console.log("🔄 Main: Restarting listening after AI speech");
        voiceRecorder.startRecording();
      } else {
        console.log(
          "⚠️ Main: Cannot restart - still active (listening:",
          isListening,
          "recording:",
          isRecording,
          ")"
        );
      }
    }, 500); // Small delay to ensure TTS cleanup
  }

  // Handle TTS error
  function handleTTSError() {
    console.log("❌ Main: AI audio error - restarting listening");
    setIsAISpeaking(false);

    // Restart even on error
    setTimeout(() => {
      if (!sessionStartTime) {
        setSessionStartTime(new Date());
      }
      if (!isListening && !isRecording) {
        voiceRecorder.startRecording();
      }
    }, 500);
  }

  // Start tracking usage every second
  const startUsageTracking = () => {
    console.log("Main: Starting usage tracking interval");
    sessionIntervalRef.current = setInterval(() => {
      // Only track usage when actually listening or processing
      if (isListening || isProcessing) {
        console.log(
          "Main: Usage tracking tick - session active"
        );
        // No need to check limits during conversation - we check at start
      }
    }, 1000);
  };

  // Stop tracking usage
  const stopUsageTracking = () => {
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current);
      sessionIntervalRef.current = null;
    }
  };

  // Start conversation with AI greeting  
  const startConversation = async () => {
    if (!sessionStartTime && !hasStarted) {
      console.log("🚀 Main: Starting conversation...");

      // Check if user has access BEFORE starting conversation
      const limitExceeded = hasExceededLimit();
      if (limitExceeded) {
        console.log("🚨 Main: Access denied - showing upgrade modal");
        setShowLimitModal(true);
        return; // Stop here, don't start conversation
      }

      // Activate trial if not already activated (for new users)
      if (usage && !usage.activatedAt && !usage.expiresAt) {
        console.log("🎁 Activating free trial for new user...");
        await activateTrial();
      }

      setSessionStartTime(new Date());
      startUsageTracking();
      onConnect?.();
      setHasStarted(true);

      // Start with AI greeting
      try {
        setIsProcessing(true);
        await audioProcessor.generateInitialGreeting();
      } catch (error) {
        console.error("❌ Main: Error with initial greeting:", error);
        setIsProcessing(false);

        // Initialize and start listening anyway
        setTimeout(async () => {
          if (!voiceRecorder.hasPermission) {
            await voiceRecorder.initializeMediaRecorder();
          }
          voiceRecorder.startRecording();
        }, 1000);
      }
    }
  };

  // End conversation
  const endConversation = async () => {
    try {
      console.log("🔚 Main: Ending conversation...");
      voiceRecorder.stopRecording();
      voiceRecorder.cleanup();

      setConversation([]);
      setSessionStartTime(null);
      setHasStarted(false);
      setIsFirstUserInput(true);
      onDisconnect?.();

      console.log("Main: Conversation ended");
    } catch (error) {
      console.error("Main: Failed to end conversation:", error);
    }
  };

  // Request microphone permission
  const requestMicrophonePermission = async () => {
    const hasPermission = await voiceRecorder.checkMicrophonePermission();
    return hasPermission;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (voiceRecorder) {
        voiceRecorder.cleanup();
      }
    };
  }, []);

  // Handle page unload events to save usage
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isListening || isProcessing) {
        // Show warning to user
        event.preventDefault();
        return "Hai una conversazione in corso. Sei sicuro di voler uscire?";
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && (isListening || isProcessing)) {
      }
    };

    const handlePageHide = () => {
      if (isListening || isProcessing) {
      }
    };

    // Add event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    // Cleanup
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [isListening, isProcessing]);

  // Check microphone permission on mount
  useEffect(() => {
    voiceRecorder.checkMicrophonePermission();
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Conversation Controls */}
      <ConversationControls
        hasPermission={voiceRecorder.hasPermission}
        sessionStartTime={sessionStartTime}
        isListening={isListening}
        isProcessing={isProcessing}
        isAISpeaking={isAISpeaking}
        authLoading={authLoading}
        isUsageLoading={isUsageLoading}
        authIsAuthenticated={authIsAuthenticated}
        selectedOperator={selectedOperator}
        onStartConversation={startConversation}
        onEndConversation={endConversation}
        onRequestPermission={requestMicrophonePermission}
        onLoginRequired={onLoginRequired}
      />

      {/* Hidden audio element for playing TTS */}
      <audio ref={audioProcessor.audioRef} style={{ display: "none" }} />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
      />
    </div>
  );
}
