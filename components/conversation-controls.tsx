"use client";

import { Button } from "@/components/ui/button";
import { Mic, MicOff, Clock, MessageSquare } from "lucide-react";

interface ConversationControlsProps {
  hasPermission: boolean | null;
  sessionStartTime: Date | null;
  isListening: boolean;
  isProcessing: boolean;
  isAISpeaking: boolean;
  authLoading: boolean;
  isUsageLoading: boolean;
  authIsAuthenticated: boolean;
  selectedOperator?: string;
  onStartConversation: () => void;
  onEndConversation: () => void;
  onRequestPermission: () => void;
  onLoginRequired?: () => void;
}

export default function ConversationControls({
  hasPermission,
  sessionStartTime,
  isListening,
  isProcessing,
  isAISpeaking,
  authLoading,
  isUsageLoading,
  authIsAuthenticated,
  selectedOperator,
  onStartConversation,
  onEndConversation,
  onRequestPermission,
  onLoginRequired,
}: ConversationControlsProps) {
  // Login required UI - but only if we're not loading and actually not authenticated
  if (!authIsAuthenticated && !authLoading && !isUsageLoading) {
    console.log("ConversationControls: Rendering login required UI");
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-sage-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-sage-400" />
          </div>
          <div className="bg-sage-800/30 rounded-lg p-3 mb-4">
            <p className="text-sage-300 text-sm">
              ✨ <strong>Prova gratuita:</strong> Il primo mese è gratis
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
          onClick={onRequestPermission}
          className="bg-sage-600 hover:bg-sage-700"
        >
          Consenti Accesso al Microfono
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Call Controls - Only Start Button */}
      <div className="flex gap-4 flex-col sm:flex-row">
        {!sessionStartTime ? (
          selectedOperator ? (
            <Button
              onClick={onStartConversation}
              disabled={isProcessing}
              className="bg-sage-600 hover:bg-sage-700 px-8 py-3 transition-all duration-2000 animate-pulse-glow"
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              Inizia Consulto
            </Button>
          ) : (
            <div className="text-center p-4 bg-sage-800/30 rounded-lg border border-sage-600/20">
              <p className="text-sage-300 text-sm">
                Seleziona un operatore per iniziare il consulto
              </p>
            </div>
          )
        ) : (
          <div className="flex gap-4 items-center justify-center">
            {/* {isListening ? (
              <div className="flex items-center gap-3 bg-green-800/30 px-6 py-3 rounded-lg border border-green-500/20">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-300 text-sm font-medium">🎤 In ascolto... (parla liberamente)</span>
              </div>
            ) : isProcessing ? (
              <div className="flex items-center gap-3 bg-blue-800/30 px-6 py-3 rounded-lg border border-blue-500/20">
                <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-300 text-sm font-medium">🔮 Consultando le stelle...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-yellow-800/30 px-6 py-3 rounded-lg border border-yellow-500/20">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-yellow-300 text-sm font-medium">⏳ Riavvio ascolto automatico...</span>
              </div>
            )}
            <Button
              onClick={onEndConversation}
              className="bg-red-600 hover:bg-red-700 px-6 py-3"
            >
              Termina Consulto
            </Button> */}
          </div>
        )}
      </div>
    </div>
  );
}
