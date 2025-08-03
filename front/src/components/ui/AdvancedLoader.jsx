import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AISphere from './AISphere'

const AdvancedLoader = ({ isVisible, onCancel, message = "Processando com Gemma..." }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [currentText, setCurrentText] = useState('')

  // ✅ SEQUÊNCIA DE ANIMAÇÕES DEFINIDA
  const animationSequence = [
    { state: 'thinking', text: '', duration: 8000 },      // 8s
    { state: 'processing', text: '', duration: 5000 },              // 5s pulsa/ondas
    { state: 'thinking', text: '', duration: 8000 },       // 8s
    { state: 'success', text: '', duration: 5000 },                 // 5s explosão
    { state: 'loading', text: '', duration: 5000 }                  // 5s ondas/spinning
  ]

  // ✅ CONTROLE DA SEQUÊNCIA TEMPORAL
  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0)
      setCurrentText('')
      return
    }

    const sequence = animationSequence[currentStep]
    setCurrentText(sequence.text)

    const timer = setTimeout(() => {
      setCurrentStep((prev) => (prev + 1) % animationSequence.length)
    }, sequence.duration)

    return () => clearTimeout(timer)
  }, [isVisible, currentStep])

  // ✅ OBTER ESTADO ATUAL DA ESFERA
  const getCurrentSphereState = () => {
    if (!isVisible) return 'idle'
    return animationSequence[currentStep].state
  }

  // ✅ OBTER TEXTO ATUAL
  const getCurrentText = () => {
    return currentText || 'processando'
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative w-full h-full flex flex-col items-center justify-center text-center"
          >
            {/* ✅ BOTÃO CANCELAR - Posição absoluta no canto */}
            <div className="absolute top-8 right-8 z-20">
              <button
                onClick={onCancel}
                className="p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors backdrop-blur-sm"
                title="Cancelar"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* ✅ AISPHERE ANIMADA - Tela cheia, sem limitações */}
            <div className="absolute inset-0 flex items-center justify-center mb-8 overflow-visible">
              <motion.div
                animate={{ 
                  x: currentStep === 4 ? [-200, 200, -200] : 0,
                }}
                transition={{ 
                  duration: currentStep === 4 ? 4 : 0,
                  repeat: currentStep === 4 ? Infinity : 0,
                  ease: "easeInOut"
                }}
                className="relative"
                style={{ width: '100vw', height: '100vh' }}
              >
                <AISphere 
                  state={getCurrentSphereState()}
                  text={getCurrentText()}
                  size="fullscreen"
                  className="w-full h-full"
                />
              </motion.div>
            </div>

            {/* ✅ TEXTO DINÂMICO - Bem visível no fundo escuro */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mb-6"
              >
                {currentText ? (
                  <p className="text-2xl font-medium text-white capitalize tracking-wide">
                    {currentText}
                  </p>
                ) : (
                  <p className="text-lg text-blue-100">
                    Pensando...
                  </p>
                )}
              </motion.div>
            </AnimatePresence>

            {/* ✅ INDICADORES DO CICLO - Coloridos e brilhantes */}
            <div className="flex justify-center gap-3 mb-6">
              {animationSequence.map((_, index) => (
                <motion.div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                    index === currentStep ? 'bg-blue-400' : 'bg-white/30'
                  }`}
                  animate={{
                    scale: index === currentStep ? [1, 1.3, 1] : 1,
                    boxShadow: index === currentStep ? 
                      ['0 0 0px rgba(59, 130, 246, 0.5)', '0 0 20px rgba(59, 130, 246, 0.8)', '0 0 0px rgba(59, 130, 246, 0.5)'] : 
                      '0 0 0px rgba(59, 130, 246, 0)'
                  }}
                  transition={{
                    duration: 1,
                    repeat: index === currentStep ? Infinity : 0
                  }}
                />
              ))}
            </div>

            {/* ✅ INSTRUÇÃO DE CANCELAMENTO */}
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-sm text-blue-200"
            >
              <p>Clique ✕ para cancelar a qualquer momento</p>
            </motion.div>

            {/* ✅ PARTÍCULAS E SÍMBOLOS MATEMÁTICOS COLORIDOS */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {/* Partículas coloridas flutuantes */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`absolute w-2 h-2 rounded-full ${
                    i % 3 === 0 ? 'bg-blue-400' : 
                    i % 3 === 1 ? 'bg-purple-400' : 'bg-yellow-400'
                  }`}
                  style={{
                    left: `${10 + i * 10}%`,
                    top: `${20 + (i % 3) * 20}%`,
                  }}
                  animate={{
                    y: [-20, 20, -20],
                    x: [-10, 10, -10],
                    opacity: [0.2, 0.8, 0.2],
                    scale: [0.5, 1.2, 0.5]
                  }}
                  transition={{
                    duration: 4 + i,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.7
                  }}
                />
              ))}
              
              {/* Símbolos matemáticos transparentes */}
              {['π', '∑', '∞', '∫', '√'].map((symbol, i) => (
                <motion.div
                  key={symbol}
                  className="absolute text-white/20 text-4xl font-bold"
                  style={{
                    left: `${15 + i * 15}%`,
                    top: `${10 + i * 15}%`,
                  }}
                  animate={{
                    y: [0, -30, 0],
                    opacity: [0.1, 0.3, 0.1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{
                    duration: 6 + i,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 1.2
                  }}
                >
                  {symbol}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AdvancedLoader