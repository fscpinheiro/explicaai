import { useState } from 'react'
import { Calculator, Camera, Sparkles, BookOpen, X, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import CollectionSelectorModal from '../ui/CollectionSelectorModal' 

const MathInput = ({ onExplain, onGenerateSimilar, onTakePhoto, isLoading, setIsLoading, isOllamaOnline = true }) => {
  const [problem, setProblem] = useState('')
  const [showSymbols, setShowSymbols] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [currentSymbol, setCurrentSymbol] = useState(null)

  // Símbolos matemáticos organizados por categoria
  const symbols = {
    basic: ['+', '−', '×', '÷', '=', '≠', '>', '<', '≥', '≤', '()', '[]'],
    powers: ['x²', 'x³', 'xⁿ', '√', '∛', 'ⁿ√', '1/x', 'a/b'],
    functions: ['sen', 'cos', 'tan', 'log', 'ln', 'π', 'e', '|x|'],
    advanced: ['∫', '∑', '∏', '∂', '∞', '∆', '∈', '∉']
  }

  const symbolCategories = {
    basic: { name: 'Básico', icon: '⚡', color: 'from-blue-500 to-blue-600' },
    powers: { name: 'Potências', icon: '🔢', color: 'from-green-500 to-green-600' },
    functions: { name: 'Funções', icon: '📐', color: 'from-purple-500 to-purple-600' },
    advanced: { name: 'Avançado', icon: '🧮', color: 'from-red-500 to-red-600' }
  }

  // Configurações dos símbolos interativos
  const interactiveSymbols = {
    'x²': {
      name: 'Potência (Quadrado)',
      explanation: 'Um número multiplicado por ele mesmo',
      example: '3² = 3 × 3 = 9',
      fields: [
        { 
          key: 'base', 
          label: 'Base (número que vai ser multiplicado)', 
          placeholder: '3',
          help: 'É o número "grande" da potência. Ex: no 3², o 3 é a base'
        }
      ],
      format: (values) => `${values.base}^2`
    },
    'x³': {
      name: 'Potência (Cubo)',
      explanation: 'Um número multiplicado por ele mesmo 3 vezes',
      example: '2³ = 2 × 2 × 2 = 8',
      fields: [
        { 
          key: 'base', 
          label: 'Base (número que vai ser multiplicado)', 
          placeholder: '2',
          help: 'É o número "grande" da potência. Ex: no 2³, o 2 é a base'
        }
      ],
      format: (values) => `${values.base}^3`
    },
    'xⁿ': {
      name: 'Potência (Qualquer expoente)',
      explanation: 'Um número multiplicado por ele mesmo várias vezes',
      example: '5⁴ = 5 × 5 × 5 × 5 = 625',
      fields: [
        { 
          key: 'base', 
          label: 'Base (número que vai ser multiplicado)', 
          placeholder: '5',
          help: 'É o número "grande" da potência. Ex: no 5⁴, o 5 é a base'
        },
        { 
          key: 'exponent', 
          label: 'Expoente (quantas vezes multiplica)', 
          placeholder: '4',
          help: 'É o número "pequeno" da potência. Ex: no 5⁴, o 4 é o expoente'
        }
      ],
      format: (values) => `${values.base}^${values.exponent}`
    },
    '√': {
      name: 'Raiz Quadrada',
      explanation: 'Qual número multiplicado por ele mesmo dá o resultado?',
      example: '√16 = 4 (porque 4 × 4 = 16)',
      fields: [
        { 
          key: 'number', 
          label: 'Radicando (número dentro da raiz)', 
          placeholder: '16',
          help: 'É o número que fica "dentro" da raiz. Ex: em √16, o 16 é o radicando'
        }
      ],
      format: (values) => `sqrt(${values.number})`
    },
    '∛': {
      name: 'Raiz Cúbica',
      explanation: 'Qual número multiplicado por ele mesmo 3 vezes dá o resultado?',
      example: '∛8 = 2 (porque 2 × 2 × 2 = 8)',
      fields: [
        { 
          key: 'number', 
          label: 'Radicando (número dentro da raiz)', 
          placeholder: '8',
          help: 'É o número que fica "dentro" da raiz. Ex: em ∛8, o 8 é o radicando'
        }
      ],
      format: (values) => `cbrt(${values.number})`
    },
    'ⁿ√': {
      name: 'Raiz de Qualquer Índice',
      explanation: 'Qual número multiplicado por ele mesmo n vezes dá o resultado?',
      example: '⁴√16 = 2 (porque 2⁴ = 16)',
      fields: [
        { 
          key: 'index', 
          label: 'Índice (que raiz é essa?)', 
          placeholder: '4',
          help: 'É o número "pequeno" da raiz. Ex: em ⁴√16, o 4 é o índice'
        },
        { 
          key: 'number', 
          label: 'Radicando (número dentro da raiz)', 
          placeholder: '16',
          help: 'É o número que fica "dentro" da raiz. Ex: em ⁴√16, o 16 é o radicando'
        }
      ],
      format: (values) => `${values.number}^(1/${values.index})`
    },
    '1/x': {
      name: 'Fração Unitária (Inverso)',
      explanation: 'Um dividido por um número',
      example: '1/5 = 0,2',
      fields: [
        { 
          key: 'denominator', 
          label: 'Denominador (número que divide)', 
          placeholder: '5',
          help: 'É o número que fica "embaixo" da fração. Ex: em 1/5, o 5 é o denominador'
        }
      ],
      format: (values) => `1/${values.denominator}`
    },
    'a/b': {
      name: 'Fração',
      explanation: 'Um número dividido por outro',
      example: '3/4 = 0,75',
      fields: [
        { 
          key: 'numerator', 
          label: 'Numerador (número que é dividido)', 
          placeholder: '3',
          help: 'É o número que fica "em cima" da fração. Ex: em 3/4, o 3 é o numerador'
        },
        { 
          key: 'denominator', 
          label: 'Denominador (número que divide)', 
          placeholder: '4',
          help: 'É o número que fica "embaixo" da fração. Ex: em 3/4, o 4 é o denominador'
        }
      ],
      format: (values) => `${values.numerator}/${values.denominator}`
    },
    'sen': {
      name: 'Seno',
      explanation: 'Função trigonométrica (trabalha com ângulos)',
      example: 'sen(30°) = 0,5',
      fields: [
        { 
          key: 'angle', 
          label: 'Ângulo (em graus ou radianos)', 
          placeholder: '30',
          help: 'É o ângulo que você quer calcular o seno. Ex: sen(30°)'
        }
      ],
      format: (values) => `sen(${values.angle})`
    },
    'cos': {
      name: 'Cosseno',
      explanation: 'Função trigonométrica (trabalha com ângulos)',
      example: 'cos(60°) = 0,5',
      fields: [
        { 
          key: 'angle', 
          label: 'Ângulo (em graus ou radianos)', 
          placeholder: '60',
          help: 'É o ângulo que você quer calcular o cosseno. Ex: cos(60°)'
        }
      ],
      format: (values) => `cos(${values.angle})`
    },
    'tan': {
      name: 'Tangente',
      explanation: 'Função trigonométrica (trabalha com ângulos)',
      example: 'tan(45°) = 1',
      fields: [
        { 
          key: 'angle', 
          label: 'Ângulo (em graus ou radianos)', 
          placeholder: '45',
          help: 'É o ângulo que você quer calcular a tangente. Ex: tan(45°)'
        }
      ],
      format: (values) => `tan(${values.angle})`
    },
    'log': {
      name: 'Logaritmo',
      explanation: 'Qual expoente preciso para chegar no número?',
      example: 'log₁₀(100) = 2 (porque 10² = 100)',
      fields: [
        { 
          key: 'base', 
          label: 'Base do logaritmo', 
          placeholder: '10',
          help: 'É o número que será elevado ao expoente. Ex: em log₁₀(100), o 10 é a base'
        },
        { 
          key: 'number', 
          label: 'Logaritmando (número do logaritmo)', 
          placeholder: '100',
          help: 'É o número que queremos o logaritmo. Ex: em log₁₀(100), o 100 é o logaritmando'
        }
      ],
      format: (values) => `log(${values.number}, ${values.base})`
    },
    'ln': {
      name: 'Logaritmo Natural',
      explanation: 'Logaritmo na base e (≈2,718)',
      example: 'ln(e) = 1',
      fields: [
        { 
          key: 'number', 
          label: 'Número para logaritmo natural', 
          placeholder: '2.718',
          help: 'É o número que queremos o logaritmo natural. Ex: ln(e) = 1'
        }
      ],
      format: (values) => `ln(${values.number})`
    },
    '|x|': {
      name: 'Valor Absoluto (Módulo)',
      explanation: 'Sempre dá resultado positivo',
      example: '|-5| = 5 e |3| = 3',
      fields: [
        { 
          key: 'number', 
          label: 'Número ou expressão', 
          placeholder: '-5',
          help: 'É o número que fica dentro das barras. Ex: em |-5|, o -5 fica dentro'
        }
      ],
      format: (values) => `abs(${values.number})`
    }
  }

  const [activeCategory, setActiveCategory] = useState('basic')
  const [modalValues, setModalValues] = useState({})

  const insertSymbol = (symbol) => {
    if (interactiveSymbols[symbol]) {
      // Símbolo interativo - abrir modal
      setCurrentSymbol(symbol)
      setModalValues({})
      setShowModal(true)
    } else {
      // Símbolo simples - inserir diretamente
      insertText(symbol)
    }
  }

  const insertText = (text) => {
    const textarea = document.getElementById('math-input')
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = problem.slice(0, start) + text + problem.slice(end)
    setProblem(newValue)
    
    // Manter o foco e posicionar cursor
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + text.length, start + text.length)
    }, 0)
  }

  const handleModalSubmit = () => {
    if (!currentSymbol) return

    const symbolConfig = interactiveSymbols[currentSymbol]
    const allFieldsFilled = symbolConfig.fields.every(field => modalValues[field.key]?.trim())

    if (!allFieldsFilled) {
      alert('Por favor, preencha todos os campos!')
      return
    }

    const formattedText = symbolConfig.format(modalValues)
    insertText(formattedText)
    setShowModal(false)
    setCurrentSymbol(null)
    setModalValues({})
  }

  // Função para explicar problema (conecta com API real)
   const handleExplain = async (type = 'detailed') => {
  console.log('🚨 [FRONTEND] Iniciando handleExplain com type:', type)
  if (!problem.trim()) {
    alert('Por favor, digite um problema de matemática.')
    return
  }

  // ✅ CRIAR AbortController
  const controller = new AbortController()
  setIsLoading(true)

  // ✅ DEFINIR MENSAGEM DE LOADING
  const message = type === 'answer' ? 'Calculando resposta...' : 'Resolvendo passo a passo...'
  
  // ✅ PASSAR CONTROLLER E MENSAGEM PARA O PAI
  if (window.setAbortController) {
    window.setAbortController(controller)
  }
  if (window.setLoadingMessage) {
    window.setLoadingMessage(message)
  }

  try {
    const response = await fetch('/api/problems/explain-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        text: problem.trim(),
        type: type
      }),
      signal: controller.signal  // ✅ ADICIONAR SIGNAL
    })
    
    const data = await response.json()
    
    if (data.success) {
      onExplain({
        type: type,
        problem: {
          text: problem.trim(),
          is_favorite: false,
          id: null
        },
        explanation: data.explanation,
        processingTime: data.processingTime || 0,
        autoCategory: data.autoCategory || null,
        isTemporary: true
      })

      setProblem('')
    } else {
      alert('Erro: ' + (data.message || data.error))
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('🛑 Requisição cancelada')
    } else {
      alert('Erro ao conectar com o servidor: ' + error.message)
    }
  } finally {
    setIsLoading(false)
    if (window.setAbortController) {
      window.setAbortController(null)
    }
  }
}

  // Função para gerar similares (preparada para quando a API estiver pronta)
  const handleGenerateSimilar = async () => {
    if (!isOllamaOnline) {
      alert('⚠️ IA está offline. Para gerar similares, verifique se o Ollama está rodando.')
      return
    }
    
    if (!problem.trim()) {
      alert('Por favor, digite um problema de matemática.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/problems/generate-similar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: problem.trim()
        }),
      })

      const data = await response.json()

      if (data.success) {
        onGenerateSimilar({
          originalProblem: data.originalProblem,
          similarProblems: data.similarProblems,
          processingTime: data.processingTime
        })
      } else {
        alert('Erro: ' + (data.message || data.error))
      }
    } catch (error) {
      alert('Função "Gerar Similares" ainda não implementada. Em breve!')
    } finally {
      setIsLoading(false)
    }
  }

  const cancelSaveToCollection = () => {
    setCollectionModal({ isOpen: false, problemText: '', explanation: '', processingTime: 0, type: 'detailed' })
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Card Principal */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
      >
        {/* Título */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Digite ou cole seu problema de matemática
          </h2>
          <p className="text-gray-600">
            Ex: Resolva a equação 2x + 5 = 13
          </p>
        </div>

        {/* Textarea Principal */}
        <div className="relative mb-6">
          <textarea
            id="math-input"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder={isOllamaOnline ? 
              "Digite seu problema aqui..." : 
              "IA offline - Digite para estudar problemas salvos apenas..."
            }
            className={`w-full h-32 p-4 text-lg border-2 rounded-xl resize-none focus:ring-4 transition-all duration-200 outline-none ${
              isOllamaOnline 
                ? 'border-gray-200 focus:border-blue-400 focus:ring-blue-100' 
                : 'border-yellow-300 bg-yellow-50 focus:border-yellow-400 focus:ring-yellow-100'
            }`}
            disabled={isLoading}
          />

          {!isOllamaOnline && (
            <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-medium">
              ⚠️ IA Offline
            </div>
          )}
          
          {/* Botão de Símbolos */}
          <button
            onClick={() => setShowSymbols(!showSymbols)}
            disabled={isLoading}
            className="absolute bottom-3 right-3 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors duration-200 shadow-lg disabled:opacity-50"
          >
            <Calculator className="w-5 h-5" />
          </button>
        </div>

        {/* Painel de Símbolos */}
        {showSymbols && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200"
          >
            {/* Categorias */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {Object.entries(symbolCategories).map(([key, category]) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  disabled={isLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                    activeCategory === key
                      ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{category.icon}</span>
                  <span className="text-sm">{category.name}</span>
                </button>
              ))}
            </div>

            {/* Símbolos */}
            <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
              {symbols[activeCategory].map((symbol, index) => (
                <button
                  key={index}
                  onClick={() => insertSymbol(symbol)}
                  disabled={isLoading}
                  className={`h-12 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg font-mono text-lg font-bold transition-all duration-200 hover:scale-105 disabled:opacity-50 relative ${
                    interactiveSymbols[symbol] ? 'border-green-300 bg-green-50' : ''
                  }`}
                >
                  {symbol}
                  {interactiveSymbols[symbol] && (
                    <span className="absolute -top-1 -right-1 text-xs text-green-600">⚙️</span>
                  )}
                </button>
              ))}
            </div>

            {activeCategory === 'powers' && (
              <div className="mt-3 text-sm text-green-600 text-center">
                💡 Símbolos com ⚙️ são interativos! Clique para configurar os valores.
              </div>
            )}
          </motion.div>
        )}

        {/* Botões de Ação */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Tirar Foto */}
          <button
            onClick={onTakePhoto}
            disabled={isLoading}
            className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:hover:scale-100"
          >
            <Camera className="w-5 h-5" />
            <span>Tirar Foto</span>
          </button>

          {/* Gerar Similares */}
          <button
            onClick={handleGenerateSimilar}
            disabled={!problem.trim() || isLoading || !isOllamaOnline} 
            className={`flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
              !isOllamaOnline ? 'bg-gray-400 cursor-not-allowed' : '' // ✅ STYLING OFFLINE
            }`}
            title={!isOllamaOnline ? "IA offline - Não é possível gerar similares" : "Gerar exercícios similares"}
          >
            <Sparkles className="w-5 h-5" />
            <span>{!isOllamaOnline ? 'IA Offline' : 'Similares'}</span>
          </button>

          {/* Explicação Resumida */}
          <button
            onClick={async () => {
              if (!isOllamaOnline) {
                alert('⚠️ IA está offline. Só é possível estudar problemas salvos.')
                return
              }
              
              if (!problem.trim()) {
                alert('Por favor, digite um problema de matemática.')
                return
              }

              // ✅ CRIAR AbortController
              const controller = new AbortController()
              setIsLoading(true)

              // ✅ PASSAR PARA O PAI
              if (window.setAbortController) {
                window.setAbortController(controller)
              }
              if (window.setLoadingMessage) {
                window.setLoadingMessage('Calculando resposta rápida...')
              }

              try {
                const response = await fetch('/api/problems/so-resposta', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ 
                    problem: problem.trim()
                  }),
                  signal: controller.signal  // ✅ ADICIONAR SIGNAL
                });

                const data = await response.json();
                
                if (data.success) {
                  onExplain({
                    type: 'answer',
                    problem: {
                      text: problem.trim(),
                      is_favorite: false,
                      id: null
                    },
                    explanation: data.explanation,
                    processingTime: data.processingTime || 0,
                    isTemporary: true
                  })
                  setProblem('')
                } else {
                  alert('Erro: ' + (data.message || data.error))
                }
              } catch (error) {
                if (error.name === 'AbortError') {
                  console.log('🛑 Requisição cancelada')
                } else {
                  alert(`❌ ERRO: ${error.message}`)
                }
              } finally {
                setIsLoading(false)
                if (window.setAbortController) {
                  window.setAbortController(null)
                }
              }
            }}
            disabled={!problem.trim() || isLoading || !isOllamaOnline}
            className={`flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
              !isOllamaOnline ? 'bg-gray-400 cursor-not-allowed' : ''
            }`}
            title={!isOllamaOnline ? "IA offline - Não é possível resolver novos problemas" : "Só Resposta"}
          >
            <span>{!isOllamaOnline ? 'IA Offline' : 'Só Resposta'}</span>

            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <BookOpen className="w-5 h-5" />
            )}
            <span>Só Resposta</span>
          </button>

          {/* Explicação Passo a Passo */}
          <button
            onClick={() => {
              if (!isOllamaOnline) {
                alert('⚠️ IA está offline. Só é possível estudar problemas salvos.')
                return
              }
              handleExplain('detailed')
            }}
            disabled={!problem.trim() || isLoading || !isOllamaOnline}
            className={`flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
              !isOllamaOnline ? 'bg-gray-400 cursor-not-allowed' : ''
            }`}
            title={!isOllamaOnline ? "IA offline - Não é possível resolver novos problemas" : "Passo a Passo"}
          >
            <span>{!isOllamaOnline ? 'IA Offline' : 'Passo a Passo'}</span>
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Calculator className="w-5 h-5" />
            )}
            <span>Passo a Passo</span>
          </button>
        </div>
      </motion.div>

      {/* Modal para símbolos interativos */}
      <AnimatePresence>
        {showModal && currentSymbol && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {interactiveSymbols[currentSymbol].name}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Explicação */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <p className="text-blue-800 font-medium mb-1">O que é:</p>
                <p className="text-blue-700 text-sm mb-2">
                  {interactiveSymbols[currentSymbol].explanation}
                </p>
                <p className="text-blue-600 text-sm font-mono">
                  📝 {interactiveSymbols[currentSymbol].example}
                </p>
              </div>

              {/* Campos */}
              <div className="space-y-4 mb-6">
                {interactiveSymbols[currentSymbol].fields.map((field) => (
                  <div key={field.key}>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        {field.label}
                      </label>
                      <div className="relative group">
                        <HelpCircle className="w-4 h-4 text-gray-400" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          {field.help}
                        </div>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      value={modalValues[field.key] || ''}
                      onChange={(e) => setModalValues(prev => ({
                        ...prev,
                        [field.key]: e.target.value
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                ))}
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleModalSubmit}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Inserir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
       

    </div>
  )
}

export default MathInput