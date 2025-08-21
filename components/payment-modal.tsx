"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, CreditCard } from "lucide-react"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
}

const plan = {
  id: "monthly",
  name: "Piano Mensile",
  price: 29,
  features: ["Accesso illimitato alle conversazioni", "Cartomanti esperti disponibili 24/7", "Supporto clienti prioritario"],
}

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePayment = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Errore durante la creazione della sessione di pagamento')
      }

      const { url } = await response.json()
      
      if (url) {
        window.location.href = url
      } else {
        throw new Error('URL di checkout non ricevuto')
      }
    } catch (error) {
      console.error("Payment error:", error)
      alert(`Errore durante il pagamento: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl bg-gradient-to-br from-sage-50 to-terracotta-50 border-sage-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center font-playfair text-3xl text-earth-900 flex items-center justify-center gap-2">
            <span className="text-4xl">🔮</span>
            Sottoscrivi per Continuare
          </DialogTitle>
        </DialogHeader>

        <div className="max-w-md mx-auto">
          {/* Plan Display */}
          <Card className="bg-gradient-to-r from-sage-100 to-terracotta-100 border-sage-300 mb-6">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-sage-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white">🔮</span>
              </div>
              <h4 className="font-semibold text-xl text-earth-800 mb-2">{plan.name}</h4>
              <div className="flex items-baseline justify-center gap-1 mb-4">
                <span className="text-4xl font-bold text-earth-900">€{plan.price}</span>
                <span className="text-earth-600">/mese</span>
              </div>
              
              <ul className="space-y-3 text-left">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-earth-700">
                    <Check className="h-5 w-5 text-sage-600 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Payment Button */}
          <div className="space-y-4">
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-sage-600 to-terracotta-600 hover:from-sage-700 hover:to-terracotta-700 text-white py-4 text-lg font-semibold"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Elaborazione...
                </div>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Sottoscrivi per €{plan.price}/mese
                </>
              )}
            </Button>
            
            <div className="text-center text-xs text-earth-600">
              <p>🔒 Pagamento sicuro gestito da Stripe</p>
              <p>Puoi cancellare in qualsiasi momento</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
