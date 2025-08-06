import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AISphere from './AISphere'

// ✨ CSS CUSTOMIZADO PARA ANIMAÇÕES
const styles = `
  @keyframes float {
    0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
    33% { transform: translate(30px, -30px) rotate(120deg); }
    66% { transform: translate(-20px, 20px) rotate(240deg); }
  }
`

const AdvancedLoader = ({ isVisible, onCancel, message = "Processando com Gemma..." }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [currentText, setCurrentText] = useState('')

  // ✨ SEQUÊNCIA VISUAL COM TEXTOS EXTERNOS
  const animationSequence = [
    { state: 'waves', text: 'Iniciando...', duration: 8000 },         // 1. Ondas suaves
    { state: 'spinning', text: 'Processando...', duration: 6000 },      // 2. Girando rápido
    { state: 'explosion1', text: 'Calculando...', duration: 3000 },    // 3. Primeira explosão
    { state: 'pulsing', text: 'Analisando...', duration: 7000 },       // 4. Pulsação respiratória
    { state: 'explosion2', text: 'Finalizando...', duration: 3000 },    // 5. Segunda explosão
    { state: 'waves', text: 'Concluindo...', duration: 8000 }          // 6. Volta às ondas
  ]

  // ✨ CONTROLE DA SEQUÊNCIA TEMPORAL
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

  // ✨ OBTER ESTADO ATUAL DA ESFERA
  const getCurrentSphereState = () => {
    if (!isVisible) return 'idle'
    return animationSequence[currentStep].state
  }

  // ✨ OBTER TEXTO ATUAL (APENAS PARA O CARD)
  const getCurrentText = () => {
    return currentText || 'Inicializando...'
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* ✨ INJETAR CSS CUSTOMIZADO */}
          <style>{styles}</style>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 bg-gradient-to-br from-black/60 via-blue-900/40 to-purple-900/60 backdrop-blur-lg flex items-center justify-center z-50"
          >
            {/* ✨ OVERLAY PATTERN - Sutil padrão de fundo */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
              <div 
                className="absolute inset-0" 
                style={{
                  backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), 
                                   radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)`,
                  backgroundSize: '400px 400px',
                  animation: 'float 20s ease-in-out infinite'
                }}
              ></div>
            </div>

            {/* ✨ CONTAINER PRINCIPAL COM GLASSMORPHISM */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="relative w-full h-full flex flex-col items-center justify-center text-center"
            >
              {/* ✨ BOTÃO CANCELAR - Suave e elegante */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="absolute top-8 right-8 z-20"
              >
                <button
                  onClick={onCancel}
                  className="group p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 backdrop-blur-sm border border-white/10 hover:border-white/20"
                  title="Cancelar operação"
                >
                  <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </motion.div>

              {/* ✨ CARD PRINCIPAL COM GLASSMORPHISM - Expandido */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl max-w-2xl w-full mx-4"
                style={{ overflow: 'visible' }} // Permitir que esfera vaze do card
              >
                {/* ✨ CONTAINER DA ESFERA - Sem restrições visuais */}
                <motion.div
                  className="relative w-96 h-96 mx-auto flex items-center justify-center mb-8 overflow-visible"
                  animate={{ 
                    scale: currentStep === 1 ? [1, 1.05, 1] : 1, // Giro = leve crescimento
                  }}
                  transition={{ 
                    duration: currentStep === 1 ? 3 : 0.6,
                    repeat: currentStep === 1 ? Infinity : 0,
                    ease: "easeInOut"
                  }}
                  style={{ 
                    overflow: 'visible' // Permitir que esfera cresça além do container
                  }}
                >
                  {/* ✨ INNER GLOW RING - Maior para acomodar crescimento */}
                  <div className="absolute inset-[-20px] rounded-full bg-gradient-to-r from-blue-500/15 via-purple-500/15 to-blue-500/15 blur-2xl animate-pulse"></div>
                  
                  <AISphere 
                    state={getCurrentSphereState()}
                    size="large"
                    className="w-full h-full relative z-10"
                    style={{ overflow: 'visible' }}
                  />
                </motion.div>

                {/* ✨ TEXTO DINÂMICO - Voltou para o card */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="mb-6 text-center"
                  >
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {getCurrentText()}
                    </h3>
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-sm text-white/70"
                    >
                      {currentStep === 0 && "Estabelecendo conexão com o modelo..."}
                      {currentStep === 1 && "Acelerando processamento matemático..."}
                      {currentStep === 2 && "Aplicando algoritmos avançados..."}
                      {currentStep === 3 && "Refinando cálculos e resultados..."}
                      {currentStep === 4 && "Preparando resposta final..."}
                      {currentStep === 5 && "Organizando explicação passo a passo..."}
                    </motion.p>
                  </motion.div>
                </AnimatePresence>

                {/* ✨ PROGRESSO VISUAL */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex justify-center gap-2"
                >
                  {animationSequence.map((_, index) => (
                    <motion.div
                      key={index}
                      className={`relative overflow-hidden rounded-full ${
                        index === currentStep ? 'w-6 h-2' : 'w-2 h-2'
                      }`}
                      animate={{
                        backgroundColor: index === currentStep ? 
                          '#3B82F6' : 
                          index < currentStep ? '#10B981' : '#374151'
                      }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                    >
                      {/* Barra de progresso interna */}
                      {index === currentStep && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400"
                          initial={{ x: '-100%' }}
                          animate={{ x: '0%' }}
                          transition={{ 
                            duration: animationSequence[currentStep].duration / 1000,
                            ease: "linear"
                          }}
                        />
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default AdvancedLoader