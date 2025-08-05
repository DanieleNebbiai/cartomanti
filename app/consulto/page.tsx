"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Phone, PhoneOff } from "lucide-react"
import Header from "@/components/header"
import AuthModal from "@/components/auth-modal"

export default function ConsultoPage() {
  const [showAuth, setShowAuth] = useState(false)
  const [isCallActive, setIsCallActive] = useState(false)
  const [timer, setTimer] = useState(0)
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])

  useEffect(() => {
    // Generate floating particles
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
    }))
    setParticles(newParticles)
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isCallActive) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isCallActive])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleStartCall = () => {
    setIsCallActive(true)
    setTimer(0)
  }

  const handleEndCall = () => {
    setIsCallActive(false)
    setTimer(0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-earth-900 via-sage-900 to-terracotta-900 text-white overflow-hidden">
      <Header onAuthClick={() => setShowAuth(true)} dark />

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 bg-sage-400/30 rounded-full animate-float"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="relative pt-20 pb-16 px-4 flex flex-col items-center justify-center min-h-screen">
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

        {/* Call Status */}
        <div className="text-center mb-8">
          <h1 className="font-playfair text-4xl font-bold mb-4">
            {isCallActive ? "Consulto in Corso" : "Pronto per il Consulto"}
          </h1>

          {isCallActive && (
            <div className="text-2xl font-mono text-sage-300 mb-4 animate-pulse">{formatTime(timer)}</div>
          )}

          <p className="text-xl text-earth-200 max-w-2xl mx-auto">
            {isCallActive
              ? "Il tuo cartomante è in ascolto. Condividi le tue domande e ricevi le risposte che cerchi."
              : "Clicca il pulsante per iniziare il tuo consulto personalizzato con un cartomante esperto."}
          </p>
        </div>

        {/* Call Controls */}
        <div className="flex gap-6">
          {!isCallActive ? (
            <Button
              size="lg"
              onClick={handleStartCall}
              className="bg-gradient-to-r from-sage-600 to-sage-700 hover:from-sage-700 hover:to-sage-800 text-white px-12 py-6 text-xl font-semibold rounded-full shadow-2xl hover:shadow-sage-500/25 transition-all duration-300 animate-pulse-glow"
            >
              <Phone className="mr-3 h-6 w-6" />
              Inizia Consulto
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleEndCall}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-12 py-6 text-xl font-semibold rounded-full shadow-2xl hover:shadow-red-500/25 transition-all duration-300"
            >
              <PhoneOff className="mr-3 h-6 w-6" />
              Termina Consulto
            </Button>
          )}
        </div>

        {/* Demo Notice */}
        {isCallActive && (
          <div className="mt-8 text-center">
            <p className="text-earth-300 text-sm">
              * Questa è una demo di 30 secondi. Il timer si resetterà automaticamente.
            </p>
          </div>
        )}

        {/* Mystical Elements */}
        <div className="absolute top-1/4 left-1/4 text-6xl opacity-20 animate-float">✨</div>
        <div className="absolute top-1/3 right-1/4 text-4xl opacity-30 animate-float" style={{ animationDelay: "1s" }}>
          🌙
        </div>
        <div
          className="absolute bottom-1/4 left-1/3 text-5xl opacity-25 animate-float"
          style={{ animationDelay: "2s" }}
        >
          ⭐
        </div>
        <div
          className="absolute bottom-1/3 right-1/3 text-3xl opacity-20 animate-float"
          style={{ animationDelay: "1.5s" }}
        >
          🔯
        </div>
      </div>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  )
}
