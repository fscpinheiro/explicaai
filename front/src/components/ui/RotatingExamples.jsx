import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Sparkles, Calculator } from 'lucide-react'

const RotatingExamples = ({ onExampleClick, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  // 📚 COLEÇÃO DE EXEMPLOS ORGANIZADOS POR CATEGORIA
  const examples = [
    // Álgebra Básica
    {
      problem: "Resolva a equação: 2x + 5 = 13",
      category: "Álgebra Básica",
      icon: "🔢",
      difficulty: 2
    },
    {
      problem: "Simplifique: 3(x + 2) - 2x = 15",
      category: "Álgebra Básica", 
      icon: "🔢",
      difficulty: 2
    },

    // Geometria
    {
      problem: "Calcule a área de um círculo com raio 5cm",
      category: "Geometria",
      icon: "📐",
      difficulty: 2
    },
    {
      problem: "Um triângulo tem base 8cm e altura 6cm. Qual sua área?",
      category: "Geometria",
      icon: "📐", 
      difficulty: 1
    },

    // Porcentagem
    {
      problem: "Quanto é 15% de 240?",
      category: "Porcentagem",
      icon: "📊",
      difficulty: 1
    },
    {
      problem: "Um produto custava R$ 100 e teve desconto de 20%. Qual o preço final?",
      category: "Porcentagem",
      icon: "📊",
      difficulty: 2
    },

    // Funções
    {
      problem: "Se f(x) = 2x + 3, calcule f(5)",
      category: "Funções",
      icon: "📈",
      difficulty: 3
    },
    {
      problem: "Encontre o zero da função f(x) = 3x - 9",
      category: "Funções", 
      icon: "📈",
      difficulty: 3
    },

    // Problemas do dia a dia
    {
      problem: "João tem R$ 50 e quer comprar 3 camisetas de R$ 18 cada. Sobra dinheiro?",
      category: "Problemas Práticos",
      icon: "🛒",
      difficulty: 1
    },
    {
      problem: "Uma receita para 4 pessoas usa 2 xícaras de farinha. Para 6 pessoas, quantas xícaras?",
      category: "Problemas Práticos",
      icon: "🛒", 
      difficulty: 2
    },

    // Trigonometria
    {
      problem: "Calcule sen(30°)",
      category: "Trigonometria",
      icon: "📐",
      difficulty: 4
    },
    {
      problem: "Em um triângulo retângulo, se um ângulo é 30° e a hipotenusa é 10cm, qual o cateto oposto?",
      category: "Trigonometria",
      icon: "📐",
      difficulty: 4
    }
  ]

  // 🔄 ROTAÇÃO AUTOMÁTICA A CADA 10 SEGUNDOS
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false) // Fade out
      
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % examples.length)
        setIsVisible(true) // Fade in
      }, 300) // Aguarda fade out terminar
      
    }, 10000) // 10 segundos

    return () => clearInterval(interval)
  }, [examples.length])

  const currentExample = examples[currentIndex]

  const getDifficultyStars = (difficulty) => {
    return '⭐'.repeat(difficulty) + '☆'.repeat(5 - difficulty)
  }

  const handleExampleClick = () => {
    if (onExampleClick) {
      onExampleClick(currentExample.problem)
    }
  }

  return (
    <div className="mt-4 mb-6 relative">
        <button
            onClick={() => onClose && onClose()}
            className="absolute top-2 right-2 z-10 p-1 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-colors"
            title="Ocultar exemplos"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
      <AnimatePresence mode="wait">       
        {isVisible && (
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 cursor-pointer hover:shadow-md transition-shadow duration-200"
            onClick={handleExampleClick}
          >
            
            <div className="flex items-start gap-3">
              {/* Ícone da categoria */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white text-lg shadow-sm">
                  {currentExample.icon}
                </div>
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    {currentExample.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getDifficultyStars(currentExample.difficulty)}
                  </span>
                </div>
                
                <p className="text-gray-800 font-medium text-sm leading-relaxed">
                  {currentExample.problem}
                </p>
                
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-blue-600 font-medium">
                    💡 Clique para resolver este exemplo
                  </p>
                  
                  {/* Indicador de progresso */}
                  <div className="flex gap-1">
                    {examples.map((_, index) => (
                      <div
                        key={index}
                        className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                          index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controles manuais (opcional) */}
      <div className="flex justify-center gap-2 mt-3">
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => {
              setCurrentIndex((prev) => (prev - 1 + examples.length) % examples.length)
              setIsVisible(true)
            }, 300)
          }}
          className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
          title="Exemplo anterior"
        >
          ← Anterior
        </button>
        
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => {
              setCurrentIndex((prev) => (prev + 1) % examples.length)
              setIsVisible(true)
            }, 300)
          }}
          className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
          title="Próximo exemplo"
        >
          Próximo →
        </button>
      </div>
    </div>
  )
}

export default RotatingExamples