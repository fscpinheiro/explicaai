import { HelpCircle, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

const StepCard = ({ step, index, isLast }) => {
  const handleExplainStep = () => {
    alert('🚧 Funcionalidade "Explicar Passo Detalhadamente" será implementada em breve!\n\nEsta feature permitirá aprofundar cada etapa da resolução.')
  }

  // Cores diferentes para tipos de passo
  const getStepColor = (type) => {
    switch (type) {
      case 'verificacao':
        return {
          bg: 'from-green-50 to-green-100',
          border: 'border-green-200',
          accent: 'text-green-700',
          badge: 'bg-green-500'
        }
      case 'resposta':
        return {
          bg: 'from-blue-50 to-blue-100', 
          border: 'border-blue-200',
          accent: 'text-blue-700',
          badge: 'bg-blue-500'
        }
      default:
        return {
          bg: 'from-gray-50 to-gray-100',
          border: 'border-gray-200', 
          accent: 'text-gray-700',
          badge: 'bg-gray-500'
        }
    }
  }

  const colors = getStepColor(step.type)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative bg-gradient-to-r ${colors.bg} rounded-xl p-6 border-2 ${colors.border} shadow-sm hover:shadow-md transition-all duration-200`}
    >
      {/* Badge do Passo */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span 
            className={`${colors.badge} text-white text-sm font-bold px-3 py-1 rounded-full shadow-md`}
          >
            {step.type === 'verificacao' ? '✓' : step.type === 'resposta' ? '🎯' : step.numero}
          </span>
          <h3 className={`text-lg font-bold ${colors.accent}`}>
            {step.titulo}
          </h3>
        </div>

        {/* Botão Explicar Passo */}
        {step.type !== 'resposta' && (
          <button
            onClick={handleExplainStep}
            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-white rounded-lg transition-colors"
            title="Explicar este passo detalhadamente"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Conteúdo */}
      <div className="space-y-3">
        {/* Explicação */}
        {step.explicacao && (
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Explicação:</p>
            <p className="text-gray-800">{step.explicacao}</p>
          </div>
        )}

        {/* Cálculo */}
        {step.calculo && (
          <div className="bg-white/70 rounded-lg p-3 border border-gray-200">
            <p className="text-sm font-medium text-gray-600 mb-1">Cálculo:</p>
            <p className="font-mono text-lg text-gray-900 bg-gray-50 px-3 py-2 rounded border">
              {step.calculo}
            </p>
          </div>
        )}

        {/* Resultado */}
        {step.resultado && (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-gray-600">Resultado:</span>
            <span className="font-bold text-gray-900 bg-white px-3 py-1 rounded border">
              {step.resultado}
            </span>
          </div>
        )}
      </div>

      {/* Linha conectora */}
      {!isLast && step.type !== 'resposta' && (
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="w-8 h-8 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-gray-400 text-xs">↓</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default StepCard