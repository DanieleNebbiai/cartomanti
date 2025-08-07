"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/header";
import AuthModal from "@/components/auth-modal";
import PaymentModal from "@/components/payment-modal";
import VoiceConversation from "@/components/voice-conversation-refactored";

function ConsultoPageContent() {
  const searchParams = useSearchParams();
  const selectedOperator = searchParams.get("operator");
  const selectedCategory = searchParams.get("category");

  const [showAuth, setShowAuth] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [timer, setTimer] = useState(0);
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; delay: number }>
  >([]);

  useEffect(() => {
    // Generate floating particles
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
    }));
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleVoiceConnect = () => {
    setIsCallActive(true);
    setTimer(0);
  };

  const handleVoiceDisconnect = () => {
    setIsCallActive(false);
    setTimer(0);
  };

  const handleVoiceError = (error: Error) => {
    console.error("Voice conversation error:", error);
    setIsCallActive(false);
    setTimer(0);
  };

  const handleUpgrade = () => {
    setShowPayment(true);
  };

  const handleLoginRequired = () => {
    setShowAuth(true);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-earth-900 via-sage-900 to-terracotta-900 text-white overflow-x-hidden">
      <Header onAuthClick={() => setShowAuth(true)} dark />

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 bg-sage-400/30 rounded-full animate-float"
            style={{
              left: `${Math.max(1, Math.min(99, particle.x))}%`,
              top: `${Math.max(1, Math.min(99, particle.y))}%`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="relative pt-20 pb-16 px-4 flex flex-col items-center justify-center min-h-screen max-w-full">
        {/* Main Crystal Ball */}
        <div className="relative mb-12">
          <div className="crystal-ball w-80 h-80 rounded-full bg-gradient-to-br from-sage-400/20 via-terracotta-400/30 to-earth-400/20 backdrop-blur-sm border border-white/20 flex items-center justify-center relative overflow-hidden">
            {/* Inner glow */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-sage-300/10 via-transparent to-terracotta-300/10 animate-pulse" />

            {/* Rotating gradient overlay */}
            <div className="absolute inset-0 rounded-full bg-gradient-conic from-sage-400/20 via-terracotta-400/20 to-earth-400/20 animate-spin-slow" />

            {/* Center crystal */}
            <div className="relative z-10 text-8xl animate-pulse">🔮</div>

            {/* Mystical particles inside */}
            <div className="absolute inset-0 rounded-full">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white/60 rounded-full animate-float"
                  style={{
                    left: `${20 + i * 10}%`,
                    top: `${30 + i * 5}%`,
                    animationDelay: `${i * 0.5}s`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Outer glow rings */}
          <div className="absolute inset-0 rounded-full border border-sage-400/20 animate-ping" />
          <div
            className="absolute inset-0 rounded-full border border-terracotta-400/20 animate-ping"
            style={{ animationDelay: "1s" }}
          />
        </div>

        {/* Selected Operator Info */}
        {selectedOperator && (
          <div className="text-center backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {selectedOperator}
            </h2>
            {selectedCategory && (
              <span className="inline-block px-4 py-2 bg-sage-600 text-white rounded-full text-sm font-medium">
                {selectedCategory}
              </span>
            )}
          </div>
        )}

        {/* Call Status */}
        <div className="text-center mb-8">
          {isCallActive && (
            <div className="text-2xl font-mono text-sage-300 mb-4 animate-pulse">
              {formatTime(timer)}
            </div>
          )}
        </div>

        {/* Operator Selection */}
        {!selectedOperator && (
          <div className="text-center mb-8 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 max-w-md mx-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              Seleziona un Operatore
            </h3>
            <p className="text-sage-300 mb-4">
              Scegli dalla nostra lista di specialisti per iniziare il consulto
            </p>
            <Link
              href="/operatori"
              className="inline-flex items-center px-6 py-3 bg-sage-600 hover:bg-sage-700 text-white rounded-lg transition-colors"
            >
              Visualizza Operatori
            </Link>
          </div>
        )}

        {/* Voice Conversation Component */}
        <div className="mb-8">
          <VoiceConversation
            selectedOperator={selectedOperator || undefined}
            selectedCategory={selectedCategory || undefined}
            onConnect={handleVoiceConnect}
            onDisconnect={handleVoiceDisconnect}
            onError={handleVoiceError}
            onUpgrade={handleUpgrade}
            onLoginRequired={handleLoginRequired}
          />
        </div>

        {/* Mystical Elements - contained within viewport */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 text-6xl opacity-20 animate-float transform -translate-x-1/2 -translate-y-1/2">
            ✨
          </div>
          <div
            className="absolute top-1/3 right-1/4 text-4xl opacity-30 animate-float transform translate-x-1/2 -translate-y-1/2"
            style={{ animationDelay: "1s" }}
          >
            🌙
          </div>
          <div
            className="absolute bottom-1/4 left-1/3 text-5xl opacity-25 animate-float transform -translate-x-1/2 translate-y-1/2"
            style={{ animationDelay: "2s" }}
          >
            ⭐
          </div>
          <div
            className="absolute bottom-1/3 right-1/3 text-3xl opacity-20 animate-float transform translate-x-1/2 translate-y-1/2"
            style={{ animationDelay: "1.5s" }}
          >
            🔯
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
      />
    </div>
  );
}

export default function ConsultoPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-gradient-to-br from-earth-900 via-sage-900 to-terracotta-900 text-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-sage-400/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-2xl">🔮</span>
            </div>
            <p className="text-sage-300">Caricamento consulto...</p>
          </div>
        </div>
      }
    >
      <ConsultoPageContent />
    </Suspense>
  );
}
