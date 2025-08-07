"use client";

import { Button } from "@/components/ui/button";
import { Clock, CreditCard, Gift } from "lucide-react";

interface UsageLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  usedMinutes: number;
  usedSeconds: number;
}

export default function UsageLimitModal({
  isOpen,
  onClose,
  onUpgrade,
  usedMinutes,
  usedSeconds,
}: UsageLimitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-earth-600 to-sage-600 text-white p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Prova Gratuita Terminata</h2>
          <p className="text-earth-100">Hai utilizzato il primo mese gratis.</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-earth-600 mb-6">
              Per continuare a usare la conversazione vocale con i nostri
              cartomanti, scegli uno dei nostri piani convenienti.
            </p>
          </div>

          {/* Pricing Options */}
          <div className="space-y-4 mb-6">
            <div className="border-2 border-sage-200 rounded-lg p-4 hover:border-sage-400 transition-colors">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-earth-800">
                    Piano Mensile
                  </h3>
                  <p className="text-sm text-earth-600">
                    60 minuti di conversazione
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-sage-600">€29</div>
                  <div className="text-sm text-earth-500">/mese</div>
                </div>
              </div>
            </div>

            <div className="border-2 border-terracotta-200 rounded-lg p-4 hover:border-terracotta-400 transition-colors bg-terracotta-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-earth-800">
                    Piano Più Popolare
                  </h3>
                  <p className="text-sm text-earth-600">
                    120 minuti di conversazione
                  </p>
                  <span className="inline-block bg-terracotta-200 text-terracotta-800 text-xs px-2 py-1 rounded-full mt-1">
                    Risparmia 20%
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-terracotta-600">
                    €46
                  </div>
                  <div className="text-sm text-earth-500">/mese</div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-earth-300 text-earth-700 hover:bg-earth-50"
            >
              Chiudi
            </Button>
            <Button
              onClick={onUpgrade}
              className="flex-1 bg-gradient-to-r from-sage-600 to-terracotta-600 hover:from-sage-700 hover:to-terracotta-700 text-white"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Scegli Piano
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
