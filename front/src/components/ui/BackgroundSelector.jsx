import { useState } from 'react'
import { X, Palette, Cloud, Zap, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const BackgroundSelector = ({ isOpen, onClose, currentBackground, onSelectBackground }) => {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [customColor, setCustomColor] = useState('#dbeafe')

  // Cores pré-definidas para seleção rápida
  const presetColors = [
    { name: 'Azul Claro', color: '#dbeafe' },
    { name: 'Rosa Suave', color: '#fce7f3' },
    { name: 'Verde Menta', color: '#d1fae5' },
    { name: 'Amarelo Pastel', color: '#fef3c7' },
    { name: 'Roxo Claro', color: '#e9d5ff' },
    { name: 'Cinza Suave', color: '#f3f4f6' },
    { name: 'Laranja Claro', color: '#fed7aa' },
    { name: 'Turquesa', color: '#a7f3d0' }
  ]

  const backgrounds = [
    {
      id: 'static',
      name: 'Estático',
      description: 'Escolha sua cor personalizada',
      icon: <Palette className="w-6 h-6" />,
      preview: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #f3e8ff 100%)',
      expandable: true
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

  const handleStaticClick = () => {
    if (currentBackground === 'static' || currentBackground?.startsWith('static-')) {
      setShowColorPicker(!showColorPicker)
    } else {
      onSelectBackground('static')
      setShowColorPicker(true)
    }
  }

  const handleColorSelect = (color) => {
    const backgroundId = `static-${color.replace('#', '')}`
    onSelectBackground(backgroundId)
    setCustomColor(color)
  }

  const handleCustomColorChange = (e) => {
    const color = e.target.value
    setCustomColor(color)
    handleColorSelect(color)
  }

  // Verificar se é background estático (incluindo cores customizadas)
  const isStaticSelected = currentBackground === 'static' || currentBackground?.startsWith('static-')
  
  // Extrair cor atual se for static customizado
  const getCurrentStaticColor = () => {
    if (currentBackground?.startsWith('static-')) {
      return '#' + currentBackground.replace('static-', '')
    }
    return '#dbeafe'
  }

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
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
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
            <div className="space-y-3">
              {backgrounds.map((bg) => (
                <div key={bg.id}>
                  {/* Botão Principal */}
                  <button
                    onClick={() => {
                      if (bg.expandable) {
                        handleStaticClick()
                      } else {
                        onSelectBackground(bg.id)
                        onClose()
                      }
                    }}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      (bg.id === currentBackground) || (bg.expandable && isStaticSelected)
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Preview */}
                      <div 
                        className="w-16 h-12 rounded-lg shadow-md border relative overflow-hidden"
                        style={{ 
                          background: bg.expandable && isStaticSelected 
                            ? `linear-gradient(135deg, ${getCurrentStaticColor()}, ${getCurrentStaticColor()}dd)` 
                            : bg.preview 
                        }}
                      >
                        {/* Indicador de animação para gradientes */}
                        {bg.id.startsWith('gradient-') && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                        )}
                      </div>
                      
                      {/* Ícone */}
                      <div className={`p-2 rounded-lg ${
                        (bg.id === currentBackground) || (bg.expandable && isStaticSelected) 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-600'
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
                      
                      {/* Checkmark ou Expandir */}
                      {bg.expandable ? (
                        <div className={`transform transition-transform duration-200 ${
                          showColorPicker && isStaticSelected ? 'rotate-180' : ''
                        }`}>
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      ) : (
                        currentBackground === bg.id && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )
                      )}
                    </div>
                  </button>

                  {/* Color Picker Expandido */}
                  {bg.expandable && showColorPicker && isStaticSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200"
                    >
                      {/* Color Picker Nativo */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          🎨 Escolha uma cor personalizada:
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={getCurrentStaticColor()}
                            onChange={handleCustomColorChange}
                            className="w-12 h-12 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-mono text-gray-600 bg-white px-3 py-2 rounded border">
                              {getCurrentStaticColor().toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cores Pré-definidas */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ⚡ Ou escolha uma cor rápida:
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {presetColors.map((preset) => (
                            <button
                              key={preset.color}
                              onClick={() => handleColorSelect(preset.color)}
                              className={`group relative w-full h-12 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                                getCurrentStaticColor() === preset.color
                                  ? 'border-blue-500 ring-2 ring-blue-200'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              style={{ backgroundColor: preset.color }}
                              title={preset.name}
                            >
                              {getCurrentStaticColor() === preset.color && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Check className="w-4 h-4 text-gray-700" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Botão Confirmar */}
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => setShowColorPicker(false)}
                          className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Fechar
                        </button>
                        <button
                          onClick={() => {
                            onClose()
                          }}
                          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Aplicar
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>

            {/* Info */}
            <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                💡 <strong>Dica:</strong> As cores personalizadas ficam salvas para a próxima vez que você abrir o app!
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default BackgroundSelector