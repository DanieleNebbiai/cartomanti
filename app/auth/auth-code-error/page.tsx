export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-terracotta-50 to-earth-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🔮</div>
        <h1 className="font-playfair text-2xl font-bold text-earth-900 mb-4">Errore di Autenticazione</h1>
        <p className="text-earth-700 mb-6">
          Si è verificato un errore durante l'autenticazione. Per favore, riprova ad accedere.
        </p>
        <a
          href="/"
          className="inline-block bg-gradient-to-r from-sage-600 to-sage-700 hover:from-sage-700 hover:to-sage-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
        >
          Torna alla Home
        </a>
      </div>
    </div>
  )
}
