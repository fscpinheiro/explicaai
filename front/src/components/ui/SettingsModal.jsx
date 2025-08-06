import { X, Palette, Eye, EyeOff, HelpCircle, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const SettingsModal = ({ 
  isOpen, 
  onClose, 
  onOpenBackgroundSelector,
  onOpenAbout,
  showExamples,
  onToggleExamples
}) => {
  const settingsOptions = [
    {
      id: 'background',
      name: 'Personalizar Fundo',
      description: 'Alterar cores e tema visual',
      icon: <Palette className="w-6 h-6" />,
      action: () => {
        onOpenBackgroundSelector()
        onClose()
      }
    },
    {
      id: 'examples',
      name: showExamples ? 'Ocultar Dicas' : 'Mostrar Dicas',
      description: showExamples ? 'Esconder exemplos rotativos' : 'Exibir exemplos de problemas',
      icon: showExamples ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />,
      action: onToggleExamples
    },
    {
      id: 'about',
      name: 'Sobre Mim',
      description: 'Informações do desenvolvedor e contatos',
      icon: <User className="w-6 h-6" />,
      action: () => {
        onOpenAbout()
        onClose()
      }
    }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]"
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
                ⚙️ Configurações
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Settings Options */}
            <div className="space-y-3">
              {settingsOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={option.action}
                  className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md bg-white transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="p-2 rounded-lg bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      {option.icon}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 mb-1">
                        {option.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {option.description}
                      </p>
                    </div>
                    
                    {/* Arrow */}
                    <div className="text-gray-400 group-hover:text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Info Footer */}
            <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">ExplicaAI v2.0</p>
                  <p>Otimizado para uso offline com IA local.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SettingsModal