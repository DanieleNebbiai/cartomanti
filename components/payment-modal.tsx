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

const plans = [
  {
    id: "basic",
    name: "Piano Base",
    minutes: 10,
    price: 19.99,
    popular: false,
    features: ["10 minuti di consulto", "Cartomante esperto", "Supporto clienti"],
  },
  {
    id: "premium",
    name: "Piano Premium",
    minutes: 30,
    price: 49.99,
    popular: true,
    features: ["30 minuti di consulto", "Cartomante senior", "Supporto prioritario", "Registrazione consulto"],
  },
  {
    id: "deluxe",
    name: "Piano Deluxe",
    minutes: 60,
    price: 89.99,
    popular: false,
    features: [
      "60 minuti di consulto",
      "Cartomante master",
      "Supporto VIP",
      "Registrazione consulto",
      "Follow-up gratuito",
    ],
  },
]

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const [selectedPlan, setSelectedPlan] = useState("premium")
  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    name: "",
  })

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock payment processing
    console.log("Payment:", { plan: selectedPlan, ...paymentData })
    alert("Pagamento completato! Verrai reindirizzato alla pagina di consulto.")
    onClose()
  }

  const selectedPlanData = plans.find((p) => p.id === selectedPlan)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl bg-gradient-to-br from-sage-50 to-terracotta-50 border-sage-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center font-playfair text-3xl text-earth-900 flex items-center justify-center gap-2">
            <span className="text-4xl">🔮</span>
            Scegli il Tuo Piano
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Plan Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold text-xl text-earth-800 mb-4">Seleziona Piano</h3>

            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-all duration-300 ${
                  selectedPlan === plan.id ? "ring-2 ring-sage-500 bg-sage-50" : "hover:shadow-lg bg-white/80"
                } ${plan.popular ? "border-terracotta-300" : "border-sage-200"}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-earth-800">{plan.name}</CardTitle>
                    {plan.popular && (
                      <span className="bg-gradient-to-r from-terracotta-500 to-terracotta-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Più Popolare
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-earth-900">€{plan.price}</span>
                    <span className="text-earth-600">/ {plan.minutes} min</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-earth-700">
                        <Check className="h-4 w-4 text-sage-600" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment Form */}
          <div className="space-y-4">
            <h3 className="font-semibold text-xl text-earth-800 mb-4">Dettagli Pagamento</h3>

            {selectedPlanData && (
              <Card className="bg-gradient-to-r from-sage-100 to-terracotta-100 border-sage-300 mb-6">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-earth-800">{selectedPlanData.name}</h4>
                      <p className="text-earth-600 text-sm">{selectedPlanData.minutes} minuti di consulto</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-earth-900">€{selectedPlanData.price}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <form onSubmit={handlePayment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="card-name" className="text-earth-800">
                  Nome sulla Carta
                </Label>
                <Input
                  id="card-name"
                  type="text"
                  placeholder="Mario Rossi"
                  value={paymentData.name}
                  onChange={(e) => setPaymentData({ ...paymentData, name: e.target.value })}
                  className="border-sage-200 focus:border-sage-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="card-number" className="text-earth-800">
                  Numero Carta
                </Label>
                <div className="relative">
                  <Input
                    id="card-number"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={paymentData.cardNumber}
                    onChange={(e) => setPaymentData({ ...paymentData, cardNumber: e.target.value })}
                    className="border-sage-200 focus:border-sage-400 pl-10"
                    required
                  />
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-earth-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry" className="text-earth-800">
                    Scadenza
                  </Label>
                  <Input
                    id="expiry"
                    type="text"
                    placeholder="MM/AA"
                    value={paymentData.expiryDate}
                    onChange={(e) => setPaymentData({ ...paymentData, expiryDate: e.target.value })}
                    className="border-sage-200 focus:border-sage-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cvv" className="text-earth-800">
                    CVV
                  </Label>
                  <Input
                    id="cvv"
                    type="text"
                    placeholder="123"
                    value={paymentData.cvv}
                    onChange={(e) => setPaymentData({ ...paymentData, cvv: e.target.value })}
                    className="border-sage-200 focus:border-sage-400"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-sage-600 to-terracotta-600 hover:from-sage-700 hover:to-terracotta-700 text-white py-3 text-lg font-semibold mt-6"
              >
                Completa Pagamento - €{selectedPlanData?.price}
              </Button>
            </form>

            <div className="text-center text-xs text-earth-600 mt-4">
              <p>🔒 Pagamento sicuro con crittografia SSL</p>
              <p>Accettiamo tutte le principali carte di credito</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
