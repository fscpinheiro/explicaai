import { X, BookOpen, Lightbulb } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const ExplanationDrawer = ({ 
  isOpen, 
  stepTitle, 
  stepExplanation, 
  concept, 
  isLoading, 
  onClose 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lightbulb className="w-6 h-6 text-white" />
                  <h3 className="text-lg font-bold text-white">
                    Explicação Detalhada
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Preparando explicação...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Passo Original */}
                  <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-blue-400">
                    <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Passo que você clicou:
                    </h4>
                    <p className="text-blue-700 font-medium">{stepTitle}</p>
                    <p className="text-blue-600 text-sm mt-2">{stepExplanation}</p>
                  </div>

                  {/* Explicação Detalhada */}
                  <div className="bg-green-50 p-4 rounded-xl border-l-4 border-green-400">
                    <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Conceito: {concept}
                    </h4>
                    
                    {/* TODO: Aqui vai vir a explicação da API */}
                    <div className="text-green-700 space-y-3">
                      <p><strong>O que significa:</strong></p>
                      <p>Esta é uma explicação mais detalhada sobre o conceito "{concept}". Em breve, esta explicação virá da nossa IA especializada.</p>
                      
                      <p><strong>Por que fazemos isso:</strong></p>
                      <p>Explicação pedagógica sobre a importância deste passo na resolução do problema.</p>
                      
                      <p><strong>Exemplo prático:</strong></p>
                      <p>Um exemplo simples para ilustrar o conceito.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ExplanationDrawer