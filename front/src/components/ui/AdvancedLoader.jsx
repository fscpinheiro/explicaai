import { X, Bot } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const AdvancedLoader = ({ isVisible, onCancel, message = "Processando com Gemma..." }) => {
  const equations = ['2x + 5 = ?', 'π × r²', '√16 = ?', 'sin(30°)', 'log₂(8)']
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl border"
          >
            {/* Cabeçalho com botão cancelar */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">🤖 IA Trabalhando</h3>
              <button
                onClick={onCancel}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Cancelar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Robô Matemático Animado */}
            <div className="relative mb-6">
              <motion.div
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"
              >
                <Bot className="w-10 h-10 text-white" />
              </motion.div>

              {/* Equações Flutuantes */}
              {equations.map((eq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: [0, Math.cos(index * 72 * Math.PI / 180) * 60],
                    y: [0, Math.sin(index * 72 * Math.PI / 180) * 60]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.6,
                    ease: "easeInOut"
                  }}
                  className="absolute top-10 left-10 bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-mono"
                >
                  {eq}
                </motion.div>
              ))}
            </div>

            {/* Mensagem */}
            <p className="text-gray-600 mb-4">{message}</p>

            {/* Barra de Progresso Falsa (visual) */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <motion.div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
                animate={{ width: ['0%', '70%', '90%', '70%'] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>

            <p className="text-xs text-gray-500">
              Clique ✕ para cancelar a qualquer momento
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AdvancedLoader