"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Star, Clock, Shield, Users, Sparkles } from "lucide-react";
import Link from "next/link";
import Header from "@/components/header";
import AuthModal from "@/components/auth-modal";
import PaymentModal from "@/components/payment-modal";

export default function HomePage() {
  const [showAuth, setShowAuth] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-terracotta-50 to-earth-50">
      <Header onAuthClick={() => setShowAuth(true)} />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sage-200/30 via-terracotta-200/20 to-earth-200/30" />
        <div className="floating-particles absolute inset-0" />

        <div className="relative max-w-6xl mx-auto text-center">
          <div className="mystical-glow mb-8">
            <span className="text-8xl animate-pulse">🔮</span>
          </div>

          <h1 className="font-playfair text-5xl md:text-7xl font-bold text-earth-900 mb-6 animate-fade-in tracking-tight">
            Cartomanti.online
          </h1>

          <p className="text-xl md:text-2xl text-earth-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            Consulti di cartomanzia professionale al telefono. I nostri esperti
            cartomanti sono disponibili 24/7 per guidarti nel tuo cammino. I
            primi 15 minuti sono gratuiti per ogni nuovo utente.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/consulto">
              <Button
                size="lg"
                className="bg-gradient-to-r from-sage-600 to-sage-700 hover:from-sage-700 hover:to-sage-800 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-2000 animate-pulse-glow"
              >
                <Phone className="mr-2 h-5 w-5" />
                Leggi il Futuro
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-earth-600">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
              <span>4.9/5 stelle</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-sage-600" />
              <span>Disponibili 24/7</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-terracotta-600" />
              <span>50+ Cartomanti Esperti</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-earth-100 to-sage-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-playfair text-4xl font-bold text-earth-900 mb-8">
            Ti senti perso e hai bisogno di risposte?
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 bounce-once">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">💔</div>
                <h3 className="font-semibold text-earth-800 mb-2">
                  Problemi d'Amore
                </h3>
                <p className="text-earth-600">
                  Relazioni complicate, dubbi sul futuro sentimentale
                </p>
              </CardContent>
            </Card>

            <Card
              className="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 bounce-once"
              style={{ animationDelay: "0.2s" }}
            >
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">💼</div>
                <h3 className="font-semibold text-earth-800 mb-2">
                  Carriera e Lavoro
                </h3>
                <p className="text-earth-600">
                  Decisioni professionali, cambiamenti lavorativi
                </p>
              </CardContent>
            </Card>

            <Card
              className="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 bounce-once"
              style={{ animationDelay: "0.4s" }}
            >
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">🌟</div>
                <h3 className="font-semibold text-earth-800 mb-2">
                  Crescita Personale
                </h3>
                <p className="text-earth-600">
                  Scoprire il tuo potenziale, superare ostacoli
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl font-bold text-earth-900 mb-6">
              La Soluzione è a Portata di Chiamata
            </h2>
            <p className="text-xl text-earth-700 max-w-3xl mx-auto">
              I nostri cartomanti esperti ti offrono consulti personalizzati e
              accurati, disponibili immediatamente al telefono.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="bg-gradient-to-br from-sage-500 to-sage-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 mystical-glow">
                <Phone className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-earth-800 mb-2">
                Chiamata Immediata
              </h3>
              <p className="text-earth-600">
                Connessione istantanea con i nostri esperti
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-terracotta-500 to-terracotta-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 mystical-glow">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-earth-800 mb-2">
                Totale Riservatezza
              </h3>
              <p className="text-earth-600">
                I tuoi segreti sono al sicuro con noi
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-earth-500 to-earth-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 mystical-glow">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-earth-800 mb-2">
                Cartomanti Certificati
              </h3>
              <p className="text-earth-600">
                Oltre 20 anni di esperienza media
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-sage-600 to-terracotta-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 mystical-glow">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-earth-800 mb-2">
                Letture Accurate
              </h3>
              <p className="text-earth-600">
                Previsioni precise e consigli pratici
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-gradient-to-br from-sage-50 to-terracotta-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl font-bold text-earth-900 mb-6">
              Come Funziona
            </h2>
            <p className="text-xl text-earth-700">
              Tre semplici passi per ottenere le risposte che cerchi
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center relative">
              <div className="bg-gradient-to-br from-sage-500 to-sage-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl mystical-glow">
                1
              </div>
              <h3 className="font-semibold text-earth-800 mb-4 text-xl">
                Scegli il Tuo Piano
              </h3>
              <p className="text-earth-600">
                Seleziona il pacchetto di minuti più adatto alle tue esigenze
              </p>
              {/* Connecting line */}
              <div className="hidden md:block absolute top-6 left-1/2 w-full h-0.5 bg-gradient-to-r from-sage-300 to-terracotta-300 transform translate-x-6" />
            </div>

            <div className="text-center relative">
              <div className="bg-gradient-to-br from-terracotta-500 to-terracotta-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl mystical-glow">
                2
              </div>
              <h3 className="font-semibold text-earth-800 mb-4 text-xl">
                Chiama Subito
              </h3>
              <p className="text-earth-600">
                Vieni connesso immediatamente con un cartomante disponibile
              </p>
              {/* Connecting line */}
              <div className="hidden md:block absolute top-6 left-1/2 w-full h-0.5 bg-gradient-to-r from-terracotta-300 to-earth-300 transform translate-x-6" />
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-earth-500 to-earth-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl mystical-glow">
                3
              </div>
              <h3 className="font-semibold text-earth-800 mb-4 text-xl">
                Ricevi le Risposte
              </h3>
              <p className="text-earth-600">
                Ottieni consigli personalizzati e previsioni accurate per il tuo
                futuro
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 px-4 bg-earth-900 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="font-playfair text-3xl font-bold mb-12">
            Perché Scegliere Cartomanti.online
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="floating">
              <div className="text-4xl font-bold text-sage-400 mb-2">
                50,000+
              </div>
              <p className="text-earth-200">Consulti Completati</p>
            </div>
            <div className="floating" style={{ animationDelay: "0.2s" }}>
              <div className="text-4xl font-bold text-terracotta-400 mb-2">
                24/7
              </div>
              <p className="text-earth-200">Disponibilità</p>
            </div>
            <div className="floating" style={{ animationDelay: "0.4s" }}>
              <div className="text-4xl font-bold text-sage-400 mb-2">4.9★</div>
              <p className="text-earth-200">Valutazione Media</p>
            </div>
            <div className="floating" style={{ animationDelay: "0.6s" }}>
              <div className="text-4xl font-bold text-terracotta-400 mb-2">
                20+
              </div>
              <p className="text-earth-200">Anni di Esperienza</p>
            </div>
          </div>
        </div>
      </section>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
      />
    </div>
  );
}
