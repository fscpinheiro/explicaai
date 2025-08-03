import { X, Palette, Cloud, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const BackgroundSelector = ({ isOpen, onClose, currentBackground, onSelectBackground }) => {
  const backgrounds = [
    {
      id: 'static',
      name: 'Estático',
      description: 'Gradiente suave e limpo',
      icon: <Palette className="w-6 h-6" />,
      preview: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #f3e8ff 100%)'
    },
    {
      id: 'gradient-sunset',
      name: 'Pôr do Sol',
      description: 'Roxo → Laranja → Amarelo',
      icon: <Zap className="w-6 h-6" />,
      preview: 'linear-gradient(-45deg, #8B5CF6 0%, #A855F7 25%, #EC4899 50%, #F97316 75%, #EAB308 100%)'
    },
    {
      id: 'gradient-ocean',
      name: 'Oceano',
      description: 'Azul escuro → Verde água',
      icon: <Zap className="w-6 h-6" />,
      preview: 'linear-gradient(-45deg, #1E3A8A 0%, #3B82F6 25%, #06B6D4 50%, #10B981 75%, #34D399 100%)'
    },
    {
      id: 'gradient-forest',
      name: 'Floresta',
      description: 'Verde escuro → Dourado',
      icon: <Zap className="w-6 h-6" />,
      preview: 'linear-gradient(-45deg, #065F46 0%, #059669 25%, #10B981 50%, #34D399 75%, #FCD34D 100%)'
    },
    {
      id: 'gradient-night',
      name: 'Noite',
      description: 'Roxo escuro → Rosa → Azul',
      icon: <Zap className="w-6 h-6" />,
      preview: 'linear-gradient(-45deg, #581C87 0%, #7C3AED 25%, #EC4899 50%, #3B82F6 75%, #1D4ED8 100%)'
    }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[80]"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                🎨 Personalizar Fundo
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Opções de Fundo */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {backgrounds.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => {
                    onSelectBackground(bg.id)
                    onClose()
                  }}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    currentBackground === bg.id
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Preview */}
                    <div 
                      className="w-16 h-12 rounded-lg shadow-md border relative overflow-hidden"
                      style={{ background: bg.preview }}
                    >
                      {/* Indicador de animação para gradientes */}
                      {bg.id.startsWith('gradient-') && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                      )}
                    </div>
                    
                    {/* Ícone */}
                    <div className={`p-2 rounded-lg ${
                      currentBackground === bg.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {bg.icon}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 mb-1">
                        {bg.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {bg.description}
                      </p>
                    </div>
                    
                    {/* Checkmark */}
                    {currentBackground === bg.id && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default BackgroundSelector