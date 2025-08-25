"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import Header from "@/components/header";
import AuthModal from "@/components/auth-modal";
import Link from "next/link";
import Image from "next/image";

const operators = [
  {
    name: "Luna Stellare",
    category: "AMORE",
    color: "from-rose-500 to-pink-600",
    experience: "15 anni",
    description:
      "Esperta in materia di cuore, Luna ha aiutato migliaia di persone a ritrovare l'amore perduto e a costruire relazioni durature. La sua sensibilità le permette di percepire i legami invisibili che uniscono le anime. Specializzata in ritorni d'amore, anime gemelle, triangoli amorosi e gelosia.",
    approach:
      "Utilizzo tarocchi dell'amore e carte degli angeli per guidarti verso la felicità sentimentale. Il mio metodo si basa sull'ascolto del cuore e sulla lettura delle energie che legano due persone.",
    rating: 4.9,
    image: "/download.jpeg",
  },
  {
    name: "Marco Visione",
    category: "LAVORO",
    color: "from-blue-500 to-indigo-600",
    experience: "12 anni",
    description:
      "Marco è specializzato nel mondo professionale e sa guidare chi si trova di fronte a decisioni importanti per la propria carriera. Ha un dono particolare nel vedere le opportunità nascoste e nell'aiutare a superare i blocchi lavorativi. Esperto in percorsi bloccati, scelte difficili e nuove opportunità.",
    approach:
      "Uso tarocchi professionali e numerologia per sbloccare il tuo potenziale lavorativo. Analizzo il tuo percorso presente per individuare la strada migliore verso il successo.",
    rating: 4.8,
    image: "/download (1).jpeg",
  },
  {
    name: "Sofia Prosperità",
    category: "SOLDI",
    color: "from-green-500 to-emerald-600",
    experience: "18 anni",
    description:
      "Sofia ha una comprensione profonda dell'energia del denaro e sa come guidare verso la prosperità. La sua esperienza nel settore finanziario si unisce al dono della divinazione per offrire consigli pratici e spirituali. Specializzata in finanze, decisioni economiche, vendite e affari.",
    approach:
      "Combino tarocchi della ricchezza con consigli pratici per migliorare la tua situazione economica. Leggo le energie del denaro e ti guido verso scelte finanziarie vincenti.",
    rating: 4.7,
    image: "/download (2).jpeg",
  },
  {
    name: "Elena Numeri",
    category: "LOTTO",
    color: "from-yellow-500 to-orange-600",
    experience: "20 anni",
    description:
      "Elena è una maestra dei numeri e della cabala. Ha sviluppato un sistema unico per interpretare i sogni e trasformarli in combinazioni vincenti. La sua precisione è leggendaria tra chi cerca fortuna nei giochi. Esperto in cabala, numeri da sogno e previsioni numerologiche.",
    approach:
      "Interpreto i tuoi sogni e uso la cabala napoletana per trovare i numeri della fortuna. Ogni simbolo ha un significato numerico che può portarti alla vincita.",
    rating: 4.6,
    image: "/download (3).jpeg",
  },
  {
    name: "Elena Universale",
    category: "GENERICO",
    color: "from-purple-500 to-violet-600",
    experience: "25 anni",
    description:
      "Elena è la nostra cartomante più versatile, capace di affrontare qualsiasi tema con competenza. La sua esperienza ventennale la rende una guida sicura per ogni tipo di domanda. Disponibile per tutti i temi: amore, lavoro, famiglia, salute e crescita spirituale.",
    approach:
      "Uso un approccio olistico combinando diversi mazzi di tarocchi secondo le tue esigenze. Ogni consulto è personalizzato per darti le risposte più accurate possibili.",
    rating: 4.9,
    image: "/download (4).jpeg",
  },
];

export default function OperatoriPage() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-terracotta-50 to-earth-50">
      <Header onAuthClick={() => setShowAuth(true)} />

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mystical-glow mb-8">
            <span className="text-6xl animate-pulse">✨</span>
          </div>

          <h1 className="font-poppins text-4xl md:text-6xl font-light text-earth-900 mb-6">
            I Nostri Operatori
          </h1>

          <p className="text-xl text-earth-700 mb-8 max-w-3xl mx-auto">
            Ogni nostro cartomante è specializzato in un'area specifica per
            offrirti la consulenza più accurata e mirata alle tue esigenze.
          </p>
        </div>
      </section>

      {/* Operators List */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-20">
            {operators.map((operator, index) => (
              <Link
                key={index}
                href={`/consulto?operator=${encodeURIComponent(
                  operator.name
                )}&category=${encodeURIComponent(operator.category)}`}
              >
                <div className="hover:bg-gray-50 rounded-lg p-6 transition-all duration-300 cursor-pointer group">
                  <div className="flex items-start gap-8">
                    {/* Photo */}
                    <div className="flex-shrink-0">
                      <div className="w-48 h-48 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                        <Image
                          src={operator.image}
                          alt={operator.name}
                          width={192}
                          height={192}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="mb-4">
                        <h2 className="text-3xl font-bold text-earth-900 mb-2">
                          {operator.name}
                        </h2>
                        <div className="flex items-center gap-4 text-earth-600">
                          <span
                            className={`bg-gradient-to-r ${operator.color} text-white px-4 py-2 rounded-full text-sm font-medium`}
                          >
                            {operator.category}
                          </span>
                          <span className="font-medium">
                            Esperienza: {operator.experience}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            <span className="font-bold text-lg">
                              {operator.rating}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <p className="text-earth-700 leading-relaxed text-lg">
                            {operator.description}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-earth-800 mb-3 text-xl">
                            Il mio approccio:
                          </h4>
                          <p className="text-earth-600 italic leading-relaxed text-lg">
                            "{operator.approach}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
