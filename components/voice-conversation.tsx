"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Clock, MessageSquare, Send } from "lucide-react";
import { useTrialUsage } from "@/hooks/use-trial-usage";
import { useAuth } from "@/hooks/use-auth";
import UsageLimitModal from "@/components/usage-limit-modal";

interface VoiceConversationProps {
  selectedOperator?: string;
  selectedCategory?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onUpgrade?: () => void;
  onLoginRequired?: () => void;
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
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [recognition, setRecognition] = useState<any>(null);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const sessionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { isAuthenticated: authIsAuthenticated, loading: authLoading } =
    useAuth();
  const {
    hasExceededLimit,
    getRemainingMinutes,
    getUsedMinutes,
    getUsedSecondsRemainder,
    addUsage,
    forceSave,
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

  // Initialize speech recognition - simple version
  useEffect(() => {
    if (!recognition && typeof window !== "undefined" && 
        ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();

      // Basic settings
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = "it-IT";

      recognitionInstance.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("Speech recognized:", transcript);
        await handleUserMessage(transcript);
      };

      recognitionInstance.onstart = () => {
        setIsListening(true);
        setRecognitionError(null);
        console.log("Speech started");
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
        console.log("Speech ended");
      };

      recognitionInstance.onerror = (event: any) => {
        console.error("Speech error:", event.error);
        setIsListening(false);
        
        // Simple error handling
        switch (event.error) {
          case "not-allowed":
            setRecognitionError("Permesso microfono negato");
            setHasPermission(false);
            break;
          case "no-speech":
            setRecognitionError("Nessun discorso rilevato. Riprova.");
            break;
          case "network":
            setRecognitionError("Errore di rete. Il microfono funziona solo su HTTPS. Usa il testo per ora.");
            setShowTextInput(true);
            break;
          default:
            setRecognitionError("Errore microfono. Prova con il testo.");
            setShowTextInput(true);
        }
      };

      setRecognition(recognitionInstance);
    }
  }, [recognition]);

  // Handle user message (speech-to-text -> GPT -> text-to-speech)
  const handleUserMessage = async (message: string) => {
    if (hasExceededLimit()) {
      setShowLimitModal(true);
      return;
    }

    setIsProcessing(true);

    try {
      // Add user message to conversation
      const newConversation = [
        ...conversation,
        { role: "user", content: message },
      ];
      setConversation(newConversation);

      // Get AI response
      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          operator: selectedOperator,
          category: selectedCategory,
        }),
      });

      if (!chatResponse.ok) {
        throw new Error("Failed to get AI response");
      }

      const { text: aiResponse } = await chatResponse.json();

      // Add AI response to conversation
      setConversation((prev) => [
        ...prev,
        { role: "assistant", content: aiResponse },
      ]);

      // Convert to speech
      const ttsResponse = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: aiResponse,
          category: selectedCategory,
        }),
      });

      if (ttsResponse.ok) {
        const audioBlob = await ttsResponse.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          await audioRef.current.play();
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
      onError?.(error as Error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Start tracking usage every second (only when actively listening or processing)
  const startUsageTracking = () => {
    console.log("Starting usage tracking interval");
    sessionIntervalRef.current = setInterval(() => {
      // Only track usage when actually listening or processing
      if (isListening || isProcessing) {
        console.log("Usage tracking tick - adding 1 second (active session)");
        addUsage(1); // Add 1 second

        // Check if limit exceeded and end conversation
        if (hasExceededLimit()) {
          console.log("Usage limit exceeded, ending conversation");
          endConversation();
          setShowLimitModal(true);
        }
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopUsageTracking();
    };
  }, []);

  // Handle page unload events to save usage
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isListening || isProcessing) {
        // Force save usage before page closes
        forceSave();
        // Optional: Show warning to user
        event.preventDefault();
        event.returnValue =
          "Hai una conversazione in corso. Sei sicuro di voler uscire?";
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && (isListening || isProcessing)) {
        // Save when user switches tabs/apps
        forceSave();
      }
    };

    const handlePageHide = () => {
      if (isListening || isProcessing) {
        // Final save on page hide (mobile browsers)
        forceSave();
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
  }, [isListening, isProcessing, forceSave]);

  // Check microphone permission on mount
  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setHasPermission(true);
    } catch (error) {
      console.error("Microphone permission denied:", error);
      setHasPermission(false);
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setHasPermission(true);
      return true;
    } catch (error) {
      console.error("Failed to get microphone permission:", error);
      setHasPermission(false);
      return false;
    }
  };

  const startListening = async () => {
    // Simple checks
    if (authLoading || isUsageLoading) {
      setRecognitionError("Caricamento in corso...");
      return;
    }

    if (!authIsAuthenticated) {
      onLoginRequired?.();
      return;
    }

    if (hasExceededLimit()) {
      setShowLimitModal(true);
      return;
    }

    // Check HTTPS requirement
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setRecognitionError("Il microfono funziona solo su HTTPS. Usa il testo per ora.");
      setShowTextInput(true);
      return;
    }

    if (!hasPermission) {
      const granted = await requestMicrophonePermission();
      if (!granted) return;
    }

    if (!recognition) {
      setRecognitionError("Microfono non supportato");
      setShowTextInput(true);
      return;
    }

    try {
      setRecognitionError(null);

      // Start session if not already started
      if (!sessionStartTime) {
        setSessionStartTime(new Date());
        startUsageTracking();
        onConnect?.();
      }

      recognition.start();
    } catch (error) {
      setRecognitionError("Errore avvio microfono. Usa il testo.");
      setShowTextInput(true);
      console.error("Start listening error:", error);
    }
  };


  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
    }
    setIsListening(false);
  };

  // Handle text input submission
  const handleTextSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!textInput.trim() || isProcessing) return;

    const message = textInput.trim();
    setTextInput("");
    await handleUserMessage(message);
  };

  const endConversation = async () => {
    try {
      stopListening();
      stopUsageTracking();
      await forceSave(); // Final save to Supabase

      setConversation([]);
      setSessionStartTime(null);
      onDisconnect?.();

      console.log("Conversation ended");
    } catch (error) {
      console.error("Failed to end conversation:", error);
    }
  };

  // Login required UI - but only if we're not loading and actually not authenticated
  if (!authIsAuthenticated && !authLoading && !isUsageLoading) {
    console.log("Rendering login required UI");
    return (
      <div className="flex flex-col items-center gap-4 p-6 ">
        <div className="text-center">
          <div className="w-16 h-16 bg-sage-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-sage-400" />
          </div>
          <div className="bg-sage-800/30 rounded-lg p-3 mb-4">
            <p className="text-sage-300 text-sm">
              ✨ <strong>Prova gratuita:</strong> 10 minuti al mese
            </p>
          </div>
        </div>
        <Button
          onClick={() => onLoginRequired?.()}
          className="bg-sage-600 hover:bg-sage-700"
        >
          Accedi per Iniziare
        </Button>
      </div>
    );
  }

  // Loading state
  if (authLoading || isUsageLoading) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="w-16 h-16 bg-sage-400/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <Clock className="h-8 w-8 text-sage-400" />
        </div>
        <p className="text-sage-300 text-sm">Caricamento...</p>
      </div>
    );
  }

  // Permission request UI
  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 bg-earth-800/50 rounded-lg backdrop-blur-sm border border-white/10">
        <div className="text-center">
          <Mic className="h-12 w-12 mx-auto mb-4 text-sage-400" />
          <h3 className="text-xl font-semibold mb-2">
            Accesso al Microfono Richiesto
          </h3>
          <p className="text-earth-200 mb-4">
            Per parlare con il cartomante, è necessario l'accesso al microfono.
          </p>
        </div>
        <Button
          onClick={requestMicrophonePermission}
          className="bg-sage-600 hover:bg-sage-700"
        >
          Consenti Accesso al Microfono
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Trial Usage Display */}
      {!isUsageLoading && (
        <div className="bg-earth-800/50 rounded-lg p-4 backdrop-blur-sm border border-white/10 mb-4">
          <div className="flex items-center gap-2 text-center">
            <Clock className="h-4 w-4 text-sage-400" />
            <span className="text-sm text-earth-200">Prova gratuita:</span>
            <span className="text-sm font-semibold text-sage-300">
              {getRemainingMinutes()} min rimasti
            </span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-earth-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-sage-500 to-terracotta-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.max(
                    0,
                    ((getUsedMinutes() * 60 + getUsedSecondsRemainder()) /
                      600) *
                      100
                  )}%`,
                }}
              />
            </div>
            <div className="text-xs text-earth-300 mt-1">
              Usati: {getUsedMinutes()}:
              {getUsedSecondsRemainder().toString().padStart(2, "0")} / 10:00
            </div>
          </div>
        </div>
      )}

      {/* Error Display with Text Input Fallback */}
      {recognitionError && (
        <div className="bg-yellow-800/50 rounded-lg p-4 backdrop-blur-sm border border-yellow-500/20 mb-4 max-w-md">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-yellow-300 text-sm font-semibold">
              {recognitionError.includes("Riprovo")
                ? "Riconnessione..."
                : "Problema Microfono"}
            </span>
          </div>
          <p className="text-yellow-100 text-sm mb-3">{recognitionError}</p>

          {recognitionError.includes("Caricamento") ? (
            <div className="flex items-center gap-2 text-yellow-300 text-xs">
              <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              Caricamento...
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setRecognitionError(null);
                  startListening();
                }}
                className="bg-yellow-600 hover:bg-yellow-700 text-xs px-3 py-1"
              >
                <Mic className="mr-1 h-3 w-3" />
                Riprova Microfono
              </Button>
              <Button
                onClick={() => {
                  setShowTextInput(true);
                  setRecognitionError(null);
                }}
                className="bg-earth-600 hover:bg-earth-700 text-xs px-3 py-1"
              >
                <MessageSquare className="mr-1 h-3 w-3" />
                Usa Testo
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Text Input Fallback */}
      {(showTextInput || recognitionError) && (
        <div className="bg-earth-800/50 rounded-lg p-4 backdrop-blur-sm border border-white/10 mb-4 max-w-md">
          <h3 className="text-white text-sm font-semibold mb-3">
            Scrivi il tuo messaggio:
          </h3>
          <form onSubmit={handleTextSubmit} className="flex gap-2">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Digita la tua domanda qui..."
              className="flex-1 bg-earth-700 text-white border-earth-600"
              disabled={isProcessing}
            />
            <Button
              type="submit"
              disabled={!textInput.trim() || isProcessing}
              className="bg-sage-600 hover:bg-sage-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      {/* Call Controls */}
      <div className="flex gap-4">
        {!sessionStartTime ? (
          <>
            <Button
              onClick={startListening}
              disabled={hasPermission === null || isProcessing}
              className="bg-sage-600 hover:bg-sage-700 px-8 py-3 transition-all duration-2000 animate-pulse-glow"
            >
              <Mic className="mr-2 h-5 w-5" />
              Inizia con Voce
            </Button>
            <Button
              onClick={() => {
                setShowTextInput(true);
                if (!sessionStartTime) {
                  setSessionStartTime(new Date());
                  startUsageTracking();
                  onConnect?.();
                }
              }}
              disabled={isProcessing}
              className="bg-earth-600 hover:bg-earth-700 px-8 py-3"
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              Inizia con Testo
            </Button>
          </>
        ) : (
          <>
            {!isListening && !isProcessing ? (
              <Button
                onClick={startListening}
                className="bg-sage-600 hover:bg-sage-700 px-8 py-3"
                disabled={!!recognitionError}
              >
                <Mic className="mr-2 h-5 w-5" />
                Parla
              </Button>
            ) : (
              <Button
                onClick={stopListening}
                disabled={isProcessing}
                className="bg-yellow-600 hover:bg-yellow-700 px-8 py-3"
              >
                {isListening ? (
                  <>
                    <MicOff className="mr-2 h-5 w-5" />
                    Stop Ascolto
                  </>
                ) : (
                  <>
                    <div className="mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Elaborando...
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={endConversation}
              className="bg-red-600 hover:bg-red-700 px-8 py-3"
            >
              <MicOff className="mr-2 h-5 w-5" />
              Termina
            </Button>
          </>
        )}
      </div>

      {/* Hidden audio element for playing TTS */}
      <audio ref={audioRef} style={{ display: "none" }} />

      {/* Conversation History */}
      {conversation.length > 0 && (
        <div className="mt-8 bg-earth-800/50 rounded-lg p-4 backdrop-blur-sm border border-white/10 max-w-md">
          <h3 className="text-lg font-semibold text-white mb-4">
            Conversazione
          </h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {conversation.map((msg, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  msg.role === "user"
                    ? "bg-sage-600/30 text-sage-100"
                    : "bg-terracotta-600/30 text-terracotta-100"
                }`}
              >
                <div className="text-xs font-semibold mb-1">
                  {msg.role === "user"
                    ? "Tu"
                    : selectedOperator || "Cartomante"}
                </div>
                <div className="text-sm">{msg.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Limit Modal */}
      <UsageLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        onUpgrade={() => {
          setShowLimitModal(false);
          onUpgrade?.();
        }}
        usedMinutes={getUsedMinutes()}
        usedSeconds={getUsedSecondsRemainder()}
      />
    </div>
  );
}
