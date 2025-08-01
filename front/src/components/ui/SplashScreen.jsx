import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle, Loader, RefreshCw } from 'lucide-react'
import useSystemCheck from '../../hooks/useSystemCheck'


const SplashScreen = ({ onComplete }) => {
  const { systemStatus, summary, retryCheck, isReady } = useSystemCheck()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Imagens da splash (placeholder por enquanto)
  const splashImages = [
    '/src/assets/splash/splash1.jpg',
    '/src/assets/splash/splash2.jpg',
    '/src/assets/splash/splash3.jpg',
    '/src/assets/splash/splash4.jpg',
  ]

  // Escolher imagem aleatória na inicialização
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * splashImages.length)
    setCurrentImageIndex(randomIndex)
  }, [])

  // Auto-complete quando estiver pronto
  useEffect(() => {
    if (isReady) {
      const timer = setTimeout(() => {
        onComplete(summary)
      }, 800) // Pequena pausa para mostrar o sucesso
      
      return () => clearTimeout(timer)
    }
  }, [isReady, onComplete, summary])

  // Status dos serviços para exibição
  const getServiceStatus = (service) => {
    if (systemStatus[service] === true) return 'success'
    if (systemStatus[service] === false) return 'error'
    return 'loading'
  }

  const getServiceIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center z-[100]"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), 
                             radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
                             radial-gradient(circle at 40% 80%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)`
          }} />
        </div>

        {/* Main Content */}
        <div className="relative z-10 text-center max-w-md mx-auto p-8">
          {/* Logo/Image Area */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="w-32 h-32 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-3xl shadow-2xl"></div>
              <div className="absolute inset-2 bg-white rounded-2xl flex items-center justify-center">
                <img
                  src={splashImages[currentImageIndex]}
                  alt="ExplicaAI"
                  className="w-16 h-16 object-contain"
                />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-2">
              ExplicaAI
            </h1>
            <p className="text-blue-200 text-lg">
              Assistente de Matemática Offline
            </p>
          </motion.div>

          {/* Progress Section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-6"
          >
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${systemStatus.progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <p className="text-blue-100 text-sm">
                {systemStatus.progress}% concluído
              </p>
            </div>

            {/* Current Step */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-white font-medium mb-3">
                {systemStatus.currentStep}
              </p>

              {/* Services Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-100">Servidor ExplicaAI</span>
                  {getServiceIcon(getServiceStatus('api'))}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-100">Banco de Dados</span>
                  {getServiceIcon(getServiceStatus('database'))}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-100">IA (Gemma 3n)</span>
                  {getServiceIcon(getServiceStatus('ollama'))}
                </div>
              </div>
            </div>

            {/* Error State */}
            {systemStatus.error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-400/30 rounded-xl p-4 text-left"
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-100 font-medium">Problema detectado</span>
                </div>
                <p className="text-red-200 text-sm mb-3">
                  {systemStatus.error}
                </p>
                <button
                  onClick={retryCheck}
                  className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Tentar Novamente
                </button>
              </motion.div>
            )}

            {/* Success State */}
            {isReady && !systemStatus.error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/20 border border-green-400/30 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-100 font-medium">
                    Sistema pronto!
                  </span>
                </div>
                <p className="text-green-200 text-sm">
                  {summary.isOnline 
                    ? 'Modo completo: Pode resolver novos problemas' 
                    : 'Modo estudo: Pode acessar problemas salvos'
                  }
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 text-center"
          >
            <p className="text-blue-300 text-xs">
              Projeto Social para Educação Matemática Offline
            </p>
            <p className="text-blue-400 text-xs mt-1">
              v2.0.0 • Gemma 3n Impact Challenge
            </p>
          </motion.div>
        </div>

        {/* Floating Math Symbols */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {['∑', 'π', '∞', '∫', '√', 'α', 'β', '∆'].map((symbol, index) => (
            <motion.div
              key={symbol}
              className="absolute text-white/10 text-6xl font-bold"
              style={{
                left: `${10 + (index * 12)}%`,
                top: `${20 + (index * 8)}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.1, 0.3, 0.1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 4 + index,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.5
              }}
            >
              {symbol}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default SplashScreen