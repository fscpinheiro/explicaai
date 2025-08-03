import { useState, useEffect } from 'react'
import {  Heart, Trash2, MoreHorizontal, Sparkles, BookOpen, Calculator } from 'lucide-react'
import Layout from './components/layout/Layout'
import MathInput from './components/features/MathInput'
import DeleteConfirmationModal from './components/ui/DeleteConfirmationModal'
import CollectionSelectorModal from './components/ui/CollectionSelectorModal'
import StepCard from './components/ui/StepCard'
import { parseStructuredMathResponse, isStructuredResponse, extractFinalAnswer } from './utils/mathParser'
import ExplanationDrawer from './components/ui/ExplanationDrawer'
import AdvancedLoader from './components/ui/AdvancedLoader'
import SplashScreen from './components/ui/SplashScreen'
import AISphere from './components/ui/AISphere'


function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [filteredHistory, setFilteredHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [viewMode, setViewMode] = useState('input') // 'input', 'history', 'collection', 'study'
  const [showSplash, setShowSplash] = useState(true)
  
  const [systemStatus, setSystemStatus] = useState({
    isOnline: false,
    isOffline: false,
    hasError: false,
    canUseAI: false,
    canStudy: false,
    details: null
  })

  const [collectionModal, setCollectionModal] = useState({
    isOpen: false,
    problemText: '',
    explanation: '',
    processingTime: 0,
    type: 'detailed'
  })

  const [showExamples, setShowExamples] = useState(() => {
    // Carregar preferência salva ou usar true como padrão
    const saved = localStorage.getItem('explicaai-show-examples')
    return saved ? JSON.parse(saved) : true
  })

  const [selectedCollectionName, setSelectedCollectionName] = useState('')

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    problemId: null,
    problemText: '',
    isLoading: false
  })

  const [explanationDrawer, setExplanationDrawer] = useState({
    isOpen: false,
    stepTitle: '',
    stepExplanation: '',
    concept: '',
    isLoading: false
  })

  const [stepVisibility, setStepVisibility] = useState({
    currentStepIndex: 0, // Quantos passos mostrar (0 = apenas primeiro)
    showAllSteps: false, // Se está mostrando todos
    totalSteps: 0 // Total de passos disponíveis
  })

  // Carregar histórico de problemas ao iniciar
  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    localStorage.setItem('explicaai-show-examples', JSON.stringify(showExamples))
  }, [showExamples])

  const [abortController, setAbortController] = useState(null)
  const [loadingMessage, setLoadingMessage] = useState('')
  
  // Filtrar histórico quando mudar coleção selecionada
  useEffect(() => {
    filterHistory()
  }, [history, selectedCollection])

  useEffect(() => {
    // Expor funções globalmente para MathInput
    window.setAbortController = setAbortController
    window.setLoadingMessage = setLoadingMessage
    
    // Limpar ao desmontar
    return () => {
      delete window.setAbortController
      delete window.setLoadingMessage
    }
  }, [])

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/problems?limit=50')
      const data = await response.json()
      
      if (data.success) {
        setHistory(data.problems)
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    }
  }

  const filterHistory = () => {
    if (selectedCollection === null) {
      // Todos os problemas
      setFilteredHistory(history)
    } else if (selectedCollection === 'favorites') {
      // Apenas favoritos
      setFilteredHistory(history.filter(p => p.is_favorite))
    } else {
      // Problemas de uma coleção específica
      setFilteredHistory(history.filter(p => 
        p.collection_ids && p.collection_ids.includes(selectedCollection)
      ))
    }
  }

  const toggleFavorite = async (problemId, problemData = null) => {
    // ✅ NOVO: Se não tem ID, é um problema temporário que precisa ser salvo primeiro
    if (!problemId || problemId === null) {
      console.log('🆕 Problema temporário - abrindo modal para salvar')
      
      if (!problemData) {
        console.error('❌ Dados do problema não fornecidos')
        return
      }
      
      // Abrir modal para escolher coleção para salvar problema temporário
      setCollectionModal({
        isOpen: true,
        problemText: problemData.text,
        explanation: problemData.explanation,
        processingTime: problemData.processingTime || 0,
        type: problemData.type || 'detailed'
      })
      return
    }

    // ✅ Fluxo normal para problemas já salvos
    try {
      const response = await fetch(`/api/problems/${problemId}/favorite`, {
        method: 'PUT'
      })

      const data = await response.json()

      if (data.success) {
        // Atualizar estado local
        setHistory(prev => prev.map(problem => 
          problem.id === problemId 
            ? { ...problem, is_favorite: data.isFavorite }
            : problem
        ))

        // Atualizar também o resultado atual se for o mesmo problema
        if (result && result.problem && result.problem.id === problemId) {
          setResult(prev => ({
            ...prev,
            problem: { ...prev.problem, is_favorite: data.isFavorite }
          }))
        }

        console.log(`${data.isFavorite ? '❤️ Adicionado aos' : '💔 Removido dos'} favoritos!`)
        notifyCollectionsChanged()
      }
    } catch (error) {
      console.error('Erro ao alterar favorito:', error)
    }
  }

  const deleteProblem = async (problemId) => {
    // Encontrar o problema para mostrar no modal
    const problem = history.find(p => p.id === problemId)
    if (!problem) return

    // Abrir modal em vez de confirm()
    setDeleteModal({
      isOpen: true,
      problemId: problemId,
      problemText: problem.text,
      isLoading: false
    })
  }

  const handleSplashComplete = (summary) => {
    console.log('🚀 Splash concluída! Status do sistema:', summary)
    setSystemStatus(summary)
    setShowSplash(false)
  }

  const confirmDeleteProblem = async () => {
    if (!deleteModal.problemId) return

    setDeleteModal(prev => ({ ...prev, isLoading: true }))

    try {
      const response = await fetch(`/api/problems/${deleteModal.problemId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        // Remover do estado local
        setHistory(prev => prev.filter(p => p.id !== deleteModal.problemId))
        
        // Se estava vendo este problema no resultado, limpar
        if (result && result.problem && result.problem.id === deleteModal.problemId) {
          setResult(null)
        }

        console.log('🗑️ Problema excluído com sucesso!')
        notifyCollectionsChanged()
         
        // Fechar modal
        setDeleteModal({
          isOpen: false,
          problemId: null,
          problemText: '',
          isLoading: false
        })
      } else {
        alert('Erro ao excluir: ' + (data.message || data.error))
        setDeleteModal(prev => ({ ...prev, isLoading: false }))
      }
    } catch (error) {
      alert('Erro ao excluir problema: ' + error.message)
      setDeleteModal(prev => ({ ...prev, isLoading: false }))
    }
  }

  const cancelDeleteProblem = () => {
    setDeleteModal({
      isOpen: false,
      problemId: null,
      problemText: '',
      isLoading: false
    })
  }

  const handleExplain = async (resultData) => {
      console.log('🔍 [FRONTEND] Resultado recebido:', resultData)
    
      if (resultData.type === 'detailed') {
        const allSteps = parseStructuredMathResponse(resultData.explanation)
        setStepVisibility({
          currentStepIndex: 0,
          showAllSteps: false,
          totalSteps: allSteps.length
        })
      }
      
    setResult({
      type: 'explanation',
      subType: resultData.type,
      problem: resultData.problem,
      explanation: resultData.explanation,
      processingTime: resultData.processingTime,
      autoCategory: resultData.autoCategory
    })

    setTimeout(() => {
      const resultElement = document.querySelector('.bg-white.rounded-2xl.shadow-lg')
      if (resultElement) {
        resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
    
    await loadHistory()
    notifyCollectionsChanged() 
    setViewMode('input')
    setShowHistory(false)    
  }

  // ✅ ADICIONAR FUNÇÃO DE CANCELAMENTO:
  const handleCancelRequest = () => {
    if (abortController) {
      console.log('🛑 Cancelando requisição...')
      abortController.abort()
      setAbortController(null)
      setIsLoading(false)
      setLoadingMessage('')
      
      // ✅ MOSTRAR FEEDBACK VISUAL
      setTimeout(() => {
        alert('⏹️ Operação cancelada com sucesso!')
      }, 100)
    }
  }


  const handleGenerateSimilar = async (resultData) => {
    console.log('Similares gerados:', resultData)
    
    setResult({
      type: 'similar',
      originalProblem: resultData.originalProblem,
      similarProblems: resultData.similarProblems,
      processingTime: resultData.processingTime
    })

    setViewMode('input')
    setShowHistory(false)
  }

  const handleExplainStep = async (stepTitle, stepExplanation, concept) => {
    console.log('🔍 Abrindo explicação para:', concept)
    
    setExplanationDrawer({
      isOpen: true,
      stepTitle,
      stepExplanation,
      concept,
      isLoading: true
    })

    setTimeout(() => {
      setExplanationDrawer(prev => ({
        ...prev,
        isLoading: false
      }))
    }, 1000)
  }

  const handleCloseExplanation = () => {
    setExplanationDrawer({
      isOpen: false,
      stepTitle: '',
      stepExplanation: '',
      concept: '',
      isLoading: false
    })
  }

  const handleTakePhoto = () => {
    alert('📷 Função OCR será implementada em breve!\n\nPor enquanto, digite o problema manualmente.')
  }

  const handleCollectionSelect = (collectionId) => {
    setSelectedCollection(collectionId)
    setViewMode('collection')
    setShowHistory(false)
    setResult(null)
    //Nome da Coleção
    fetchCollectionName(collectionId)
    // Carregar problemas da coleção específica
    loadCollectionProblems(collectionId)
  }

  const fetchCollectionName = async (collectionId) => {
    try {
      const response = await fetch(`/api/collections/${collectionId}`)
      const data = await response.json()
      
      if (data.success && data.collection) {
        setSelectedCollectionName(data.collection.name)
        console.log('📚 Nome da coleção:', data.collection.name)
      }
    } catch (error) {
      console.error('Erro ao buscar nome da coleção:', error)
      setSelectedCollectionName('Coleção')
    }
  }

  // ✅ FUNÇÃO PARA EXTRAIR EXERCÍCIOS DO TEXTO DOS SIMILARES
  const parseExercises = (similarText) => {
    const exercises = []
    const lines = similarText.split('\n')
    
    let currentExercise = null
    let currentProblem = ''
    
    for (const line of lines) {
      // ✅ PARAR se chegou na dica
      if (line.includes('**Dica')) {
        // Salvar exercício atual antes de parar
        if (currentExercise && currentProblem.trim()) {
          exercises.push({
            title: currentExercise,
            problem: currentProblem.trim()
          })
        }
        break; // ✅ PARAR AQUI - não processar mais nada
      }
      
      // Detectar início de exercício
      if (line.includes('**Exer') && line.includes(':**')) {
        // Salvar exercício anterior se existir
        if (currentExercise && currentProblem.trim()) {
          exercises.push({
            title: currentExercise,
            problem: currentProblem.trim()
          })
        }
        
        // Iniciar novo exercício
        currentExercise = line.replace(/\*\*/g, '').trim()
        currentProblem = ''
        
      } else if (currentExercise && line.trim() && !line.includes('**')) {
        // Adicionar linha ao problema atual (ignorar linhas vazias e com **)
        currentProblem += line.trim() + ' '
      }
    }
    
    // ✅ REMOVER ESTA PARTE que estava causando duplicação
    // (o exercício já foi salvo quando encontrou **Dica)
    
    console.log('🎯 [DEBUG] Exercícios limpos:', exercises)
    return exercises
  }

  // ✅ FUNÇÃO PARA RESOLVER EXERCÍCIO INDIVIDUAL
  const handleSolveExercise = async (problemText, type = 'detailed') => {
  setIsLoading(true)
  
  try {
    if (type === 'answer') {
      // Chamar endpoint "só resposta"
      const response = await fetch('/api/problems/so-resposta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          problem: problemText.trim() // ✅ CORRETO: usa 'problem'
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        handleExplain({
          type: 'answer',
          problem: {
            text: problemText.trim(),
            is_favorite: false,
            id: null
          },
          explanation: data.explanation,
          processingTime: data.processingTime || 0,
          isTemporary: true
        })
        
        setProblem(problemText.trim()) // ✅ USAR setProblem DO ESCOPO PRINCIPAL
      } else {
        alert('Erro: ' + (data.message || data.error))
      }
    } else {
      // Chamar endpoint "passo a passo"
      const response = await fetch('/api/problems/explain-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: problemText.trim(), // ✅ CORRIGIDO: usa 'text' em vez de 'problem'
          type: 'detailed'
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        handleExplain({
          type: 'detailed',
          problem: data.problem,
          explanation: data.explanation,
          processingTime: data.processingTime || 0,
          autoCategory: data.autoCategory || null,
          isTemporary: false
        })
        
        setProblem(problemText.trim()) // ✅ USAR setProblem DO ESCOPO PRINCIPAL
      } else {
        alert('Erro: ' + (data.message || data.error))
      }
    }
  } catch (error) {
    alert('Erro ao resolver exercício: ' + error.message)
  } finally {
    setIsLoading(false)
  }
}

  const loadCollectionProblems = async (collectionId) => {
    try {
      const response = await fetch(`/api/collections/${collectionId}/problems`)
      const data = await response.json()
      
      if (data.success) {
        setFilteredHistory(data.problems)
      }
    } catch (error) {
      console.error('Erro ao carregar problemas da coleção:', error)
    }
  }

  const handleCreateCollection = async (newCollection) => {
    console.log('Nova coleção criada:', newCollection)
    // A interface já recarrega automaticamente
  }

  const handleToggleHistory = () => {
    if (showHistory) {
      // Fechar histórico - voltar ao input
      setShowHistory(false)
      setViewMode('input')
      setSelectedCollection(null)
    } else {
      // Abrir histórico
      setShowHistory(true)
      setViewMode('history')
      setSelectedCollection(null)
      setResult(null)
    }
  }

  // ✅ NOVA FUNÇÃO: Abrir problema para estudo (coleções)
  const handleStudyProblem = (problem) => {
    console.log('📖 Abrindo problema para estudo:', problem.text)
    
    setResult({
      type: 'study',
      problem: problem,
      explanation: problem.explanation,
      processingTime: problem.solved_time
    })
    
    setViewMode('study')
    setShowHistory(false)
  }

  // ✅ NOVA FUNÇÃO: Voltar ao input
  const handleBackToInput = () => {
    setViewMode('input')
    setShowHistory(false)
    setSelectedCollection(null)
    setSelectedCollectionName('')
    setResult(null)
  }

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatExplanation = (text, type = 'detailed', onExplainStep = null) => {
    console.log('🔍 [FORMAT] Text:', text?.substring(0, 50) + '...')
    console.log('🔍 [FORMAT] Type recebido:', type)

    if (type === 'answer') {
      console.log('✅ [FORMAT] ENTRANDO no modo ANSWER!')
      const finalAnswer = extractFinalAnswer(text)
      return (
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {finalAnswer}
          </div>
          <p className="text-sm text-gray-500">Resultado final</p>
        </div>
      )
    }

    console.log('🔍 [FORMAT] Verificando se é resposta estruturada...')
    
    // ✅ NOVO: Verificar se resposta está estruturada
    if (isStructuredResponse(text)) {
      console.log('✅ [FORMAT] Resposta estruturada detectada!')
      
      const allSteps = parseStructuredMathResponse(text)

      const stepsToShow = stepVisibility.showAllSteps 
      ? allSteps 
      : allSteps.slice(0, stepVisibility.currentStepIndex + 1)
      
      return (
        <div className="space-y-6">
          {stepsToShow.map((step, index) => (
            <StepCard 
              key={index}
              step={step}
              index={index}
              isLast={index === stepsToShow.length - 1}
              onExplainStep={handleExplainStep}
            />
          ))}
          
          {!stepVisibility.showAllSteps && stepVisibility.currentStepIndex < allSteps.length - 1 && (
            <div className="text-center py-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
                <span className="text-blue-600 text-sm font-medium">
                  Mais {allSteps.length - stepVisibility.currentStepIndex - 1} passo(s) disponível(is)
                </span>

                 <div className="flex items-center gap-3">
                    {/* Botão Próximo Passo */}
                    <button
                      onClick={() => {
                        setStepVisibility(prev => ({
                          ...prev,
                          currentStepIndex: prev.currentStepIndex + 1
                        }))
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                      title="Ver próximo passo"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <span>Próximo Passo</span>
                    </button>
                    
                    {/* Botão Mostrar Todos */}
                    <button
                      onClick={() => {
                        setStepVisibility({
                          currentStepIndex: allSteps.length - 1,
                          showAllSteps: true,
                          totalSteps: allSteps.length
                        })
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
                      title="Mostrar todos os passos restantes"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      <span>Ver Todos</span>
                    </button>
                  </div>

                <div className="flex gap-1">
                  {Array.from({length: 3}).map((_, i) => (
                    <div key={i} className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: `${i * 0.2}s`}} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }
    
    console.log('⚠️ [FORMAT] Usando formatação legacy')
    
    return text.split('\n').map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <h4 key={index} className="font-bold text-gray-800 mt-4 mb-2 first:mt-0">
            {line.replace(/\*\*/g, '')}
          </h4>
        )
      } else if (line.trim() === '') {
        return <br key={index} />
      } else {
        return (
          <p key={index} className="text-gray-700 mb-2">
            {line}
          </p>
        )
      }
    })
  }

  const reloadCollections = () => {
    setSelectedCollection(prev => prev) 
  }

  const getFilterTitle = () => {
    if (selectedCollection === null) return 'Todos os Problemas'
    if (selectedCollection === 'favorites') return 'Problemas Favoritos'
    return 'Problemas Filtrados'
  }

  const [changeCategoryModal, setChangeCategoryModal] = useState({
    isOpen: false,
    problemId: null,
    problemText: '',
    currentCollectionId: null
  })

  const handleChangeProblemCollection = (problemId, problemText) => {
    console.log('🔄 Abrindo modal para trocar categoria do problema:', problemId)
    
    setChangeCategoryModal({
      isOpen: true,
      problemId: problemId,
      problemText: problemText,
      currentCollectionId: selectedCollection
    })
  }

  const handleConfirmChangeCollection = async (newCollectionId) => {
    const { problemId, currentCollectionId } = changeCategoryModal
    
    if (!problemId || !newCollectionId) {
      console.error('❌ IDs inválidos:', { problemId, newCollectionId })
      return
    }

    try {
      console.log('🔄 Movendo problema', problemId, 'para coleção', newCollectionId)
      
      // Usar endpoint para atualizar coleções do problema
      const response = await fetch(`/api/problems/${problemId}/collections`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionIds: [newCollectionId] // Apenas a nova coleção
        }),
      })

      const data = await response.json()

      if (data.success) {
        console.log('✅ Problema movido com sucesso!')
        
        // Recarregar a lista da coleção atual se estamos numa coleção
        if (currentCollectionId && viewMode === 'collection') {
          await loadCollectionProblems(currentCollectionId)
        }
        
        // Recarregar histórico geral
        await loadHistory()
        
        // Notificar mudança para sidebar
        notifyCollectionsChanged()
        
        // Fechar modal
        setChangeCategoryModal({
          isOpen: false,
          problemId: null,
          problemText: '',
          currentCollectionId: null
        })
        
      } else {
        console.error('❌ Erro da API:', data)
        alert('Erro ao mover problema: ' + (data.message || data.error))
      }
    } catch (error) {
      console.error('❌ Erro de rede:', error)
      alert('Erro ao mover problema: ' + error.message)
    }
  }

  const handleCancelChangeCollection = () => {
    setChangeCategoryModal({
      isOpen: false,
      problemId: null,
      problemText: '',
      currentCollectionId: null
    })
  }

  const handleSaveToCollection = async (collectionId) => {
    if (!collectionModal.problemText || !collectionModal.explanation) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/problems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: collectionModal.problemText,
          explanation: collectionModal.explanation,
          source: 'text',
          solvedTime: collectionModal.processingTime,
          collectionIds: [collectionId]
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Fechar modal
        setCollectionModal({ isOpen: false, problemText: '', explanation: '', processingTime: 0, type: 'detailed' })
        
        // Atualizar resultado com problema salvo
        setResult(prev => ({
          ...prev,
          problem: { ...data.problem, is_favorite: true },
          isTemporary: false
        }))

        // Recarregar histórico
        await loadHistory()
        notifyCollectionsChanged()

        console.log('✅ Problema salvo com sucesso!')
      } else {
        alert('Erro ao salvar: ' + (data.message || data.error))
      }
    } catch (error) {
      alert('Erro ao salvar problema: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const cancelSaveToCollection = () => {
    setCollectionModal({ isOpen: false, problemText: '', explanation: '', processingTime: 0, type: 'detailed' })
  }

  const notifyCollectionsChanged = () => {
    
    window.dispatchEvent(new CustomEvent('collectionsUpdated'))
    setTimeout(() => {
      loadHistory()
    }, 100)

    console.log('🔄 Notificando atualização de coleções')
  }

  const handleGenerateSimilarFromProblem = async (problemText) => {
    if (!problemText?.trim()) {
      alert('Texto do problema inválido')
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
          text: problemText.trim()
        }),
      })

      const data = await response.json()

      if (data.success) {
        handleGenerateSimilar({
          originalProblem: data.originalProblem,
          similarProblems: data.similarProblems,
          processingTime: data.processingTime
        })

        // Mudar para o modo input para mostrar os similares
        setViewMode('input')
        setShowHistory(false)
        setSelectedCollection(null)
      } else {
        alert('Erro ao gerar similares: ' + (data.message || data.error))
      }
    } catch (error) {
      alert('Erro ao gerar similares: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* ✅ SPLASH SCREEN - Mostrar primeiro */}
      {showSplash && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}

      {/* ✅ APP PRINCIPAL - Só mostrar após splash */}
      {!showSplash && (
        <Layout 
          selectedCollection={selectedCollection}
          onCollectionSelect={handleCollectionSelect}
          onCreateCollection={handleCreateCollection}
          showHistory={showHistory}
          onToggleHistory={handleToggleHistory}
          showExamples={showExamples}
          onToggleExamples={() => setShowExamples(prev => !prev)}
          systemStatus={systemStatus}
          isLoading={isLoading}
        >
          <div className="space-y-8">
            {/* ✅ BANNER DE STATUS OFFLINE - ADICIONAR APÓS space-y-8 */}
            {systemStatus.isOffline && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Modo Estudo:</strong> IA offline. Você pode estudar problemas salvos, mas não resolver novos.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {/* ✅ MODO ESTUDO - Tela dedicada para ver resolução */}
            {viewMode === 'study' && result && (
              <div className="space-y-6">
                {/* Botão Voltar - MANTER IGUAL */}
                <button
                  onClick={handleBackToInput}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Voltar
                </button>

                {/* Resolução em Tela Cheia - ATUALIZADA */}
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                  <div className="flex items-start justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                      📖 Resolução Completa
                    </h2>
                    
                    <div className="flex items-center gap-3">
                      {result.processingTime && (
                        <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                          ⏱️ {formatTime(result.processingTime)}
                        </span>
                      )}
                      
                      {/* ✅ BOTÃO GERAR SIMILARES NA TELA DE ESTUDO */}
                      <button
                        onClick={() => handleGenerateSimilarFromProblem(result.problem.text)}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50"
                        title="Gerar exercícios similares"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        <span>Similares</span>
                      </button>
                    </div>
                  </div>

                  {/* Problema Original */}
                  <div className="bg-blue-50 p-6 rounded-xl border-l-4 border-blue-400 mb-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-blue-800 mb-2">Problema:</p>
                        <p className="text-blue-700 text-lg">{result.problem.text}</p>
                      </div>
                      
                      {/* Trocar Categoria - problema já salvo */}
                      <button
                        onClick={() => handleChangeProblemCollection(result.problem.id, result.problem.text)}
                        className="ml-4 p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                        title="Trocar de coleção"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        <span className="sr-only">Trocar de coleção</span>  
                      </button>
                    </div>
                  </div>

                  {/* Explicação - MANTER IGUAL */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <div className="prose prose-lg max-w-none">
                      {formatExplanation(result.explanation, result.subType || 'detailed', handleExplainStep)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ✅ MODO INPUT - Card principal (apenas quando não está no histórico ou coleção) */}
            {viewMode === 'input' && (
              <>
                           
              <MathInput
                onExplain={handleExplain}
                onGenerateSimilar={handleGenerateSimilar}
                onTakePhoto={handleTakePhoto}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                setAbortController={setAbortController}
                setLoadingMessage={setLoadingMessage}  
                isOllamaOnline={systemStatus.canUseAI}
                showExamples={showExamples}
                onToggleExamples={() => setShowExamples(prev => !prev)}
              />
              {/* BOTÃO TEMPORÁRIO */}
              {result && (
                <div className="text-center mb-4">
                  <button
                    onClick={() => {
                      console.log('🧹 Limpando resultado...')
                      setResult(null)
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    🧹 Limpar Resultado
                  </button>
                </div>
              )}
            </>
            )}

            
            
            {/* Loading */}
            {isLoading && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
                <div className="flex items-center justify-center gap-4">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="text-lg text-gray-600">
                    <p className="font-semibold">🤖 Processando com Gemma...</p>
                    <p className="text-sm text-gray-500">Isso pode levar alguns segundos</p>
                  </div>
                </div>
              </div>
            )}

            {/* ✅ RESULTADOS - apenas no modo input */}
            {viewMode === 'input' && result && !isLoading && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">
                    {result.type === 'explanation' 
                      ? (result.subType === 'answer' ? '✅ Resposta Final' : 
                        result.subType === 'brief' ? '📋 Explicação Resumida' : 
                        '📋 Explicação Passo a Passo')
                      : '🎯 Problemas Similares'
                    }
                  </h3>
                  
                  {result.processingTime && (
                    <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      ⏱️ {formatTime(result.processingTime)}
                    </span>
                  )}
                </div>

                {result.type === 'explanation' && (
                  <div className="space-y-4">
                    {/* Problema Original */}
                    <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-blue-400">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-blue-800 mb-2">Problema:</p>
                          <p className="text-blue-700">{result.problem.text}</p>
                        </div>
                        
                        {/* ✅ BOTÕES DE CONTROLE - POSIÇÃO CORRETA */}
                        <div className="flex items-center gap-2 ml-4">
                                                   
                          {/* Botão Próximo Passo */}
                          {result.subType === 'detailed' && !stepVisibility.showAllSteps && (
                            <button
                              onClick={() => {
                                const allSteps = parseStructuredMathResponse(result.explanation)
                                if (stepVisibility.currentStepIndex < allSteps.length - 1) {
                                  setStepVisibility(prev => ({
                                    ...prev,
                                    currentStepIndex: prev.currentStepIndex + 1
                                  }))
                                }
                              }}
                              disabled={(() => {
                                const allSteps = parseStructuredMathResponse(result.explanation)
                                return stepVisibility.currentStepIndex >= allSteps.length - 1
                              })()}
                              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              title="Próximo passo"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              <span className="hidden sm:inline">Próximo</span>
                            </button>
                          )}
                          
                          {/* Botão de Favorito */}
                          <button
                            onClick={() => toggleFavorite(
                              result.problem.id, 
                              result.problem.id ? null : {
                                text: result.problem.text,
                                explanation: result.explanation,
                                processingTime: result.processingTime,
                                type: result.subType
                              }
                            )}
                            className={`p-2 rounded-lg transition-colors ${
                              result.problem.is_favorite
                                ? 'text-red-500 bg-red-50 hover:bg-red-100'
                                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                            }`}
                            title={result.problem.is_favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                          >
                            <Heart className={`w-5 h-5 ${result.problem.is_favorite ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Explicação */}
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="prose prose-sm max-w-none">
                        {formatExplanation(result.explanation, result.subType || 'detailed', handleExplainStep)}
                      </div>
                    </div>

                    {/* Metadados */}
                    {result.autoCategory && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Categoria</p>
                          <p className="font-semibold text-gray-800">{result.autoCategory.suggested}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Dificuldade</p>
                          <p className="font-semibold text-gray-800">
                            {'⭐'.repeat(result.autoCategory.difficulty)} 
                            <span className="text-gray-600 ml-1">({result.autoCategory.difficulty}/5)</span>
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Tags</p>
                          <div className="flex flex-wrap gap-1 justify-center mt-1">
                            {result.autoCategory.tags.map((tag, index) => (
                              <span 
                                key={index}
                                className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ✅ SEÇÃO DE PROBLEMAS SIMILARES (manter igual) */}
                {result.type === 'similar' && (
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-xl border-l-4 border-green-400">
                      <p className="font-semibold text-green-800 mb-2">Problema Original:</p>
                      <p className="text-green-700">{result.originalProblem}</p>
                    </div>
                    
                    {/* ✅ NOVA SEÇÃO: EXERCÍCIOS COM BOTÕES */}
                    <div className="space-y-4">
                      {parseExercises(result.similarProblems).map((exercise, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800 mb-2">{exercise.title}</h4>
                              <p className="text-gray-700 mb-3">{exercise.problem}</p>
                            </div>
                            
                            {/* Botões para resolver */}
                            <div className="flex gap-2 ml-4">
                              {/* Botão Só Resposta */}
                              <button
                                onClick={() => handleSolveExercise(exercise.problem, 'answer')}
                                disabled={isLoading || !systemStatus.canUseAI}
                                className={`flex items-center gap-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors text-sm ${
                                  !systemStatus.canUseAI ? 'opacity-50 cursor-not-allowed' : 'disabled:opacity-50' 
                                }`}
                                title={!systemStatus.canUseAI ? "IA offline - Não é possível resolver novos problemas" : "Só Resposta"}
                              >
                                {isLoading ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <BookOpen className="w-4 h-4" />
                                )}
                              </button>
                              
                              {/* Botão Passo a Passo */}
                              <button
                                onClick={() => handleSolveExercise(exercise.problem, 'detailed')}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
                                title="Passo a Passo"
                              >
                                {isLoading ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Calculator className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Dica de Estudo (se existir) */}
                    {result.similarProblems.includes('**Dica de Estudo:**') && (
                      <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-blue-400">
                        <div className="text-blue-700">
                          {result.similarProblems.split('**Dica de Estudo:**')[1]?.trim()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ✅ HISTÓRICO - Lista simples de problemas solicitados */}
            {viewMode === 'history' && (
              <div className="space-y-6">
                {/* Estatísticas Rápidas - MANTER IGUAL */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* ... código existente das estatísticas ... */}
                </div>

                {/* Lista do Histórico - ATUALIZADA */}
                {history.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-800">
                        📚 Histórico de Consultas ({history.length})
                      </h3>
                      
                      <button
                        onClick={() => {
                          if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
                            setHistory([])
                            console.log('🧹 Histórico limpo')
                          }
                        }}
                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        🗑️ Limpar Histórico
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {history.slice(0, 20).map((problem) => (
                        <div 
                          key={problem.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 mb-1">{problem.text}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  {problem.collection_icons?.[0]} {problem.collections?.[0]}
                                </span>
                                <span>{'⭐'.repeat(problem.difficulty_level)}</span>
                                {problem.solved_time && (
                                  <span>⏱️ {formatTime(problem.solved_time)}</span>
                                )}
                                <span>{new Date(problem.created_at).toLocaleDateString('pt-BR')}</span>
                                {problem.is_favorite && <span className="text-red-500">❤️ Salvo</span>}
                              </div>
                            </div>
                            
                            {/* ✅ BOTÕES ATUALIZADOS COM SIMILARES */}
                            <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* Gerar Similares */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleGenerateSimilarFromProblem(problem.text)
                                }}
                                disabled={isLoading}
                                className="p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Gerar exercícios similares"
                              >
                                <Sparkles className="w-4 h-4" />
                              </button>
                              
                              {/* Excluir */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteProblem(problem.id)
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Excluir do histórico"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {history.length > 20 && (
                      <div className="text-center mt-4">
                        <p className="text-gray-500 text-sm">
                          Mostrando 20 de {history.length} consultas
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Mensagem quando não há histórico - MANTER IGUAL */}
                {history.length === 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
                    <div className="text-gray-500">
                      <p className="text-lg font-semibold mb-2">📚 Nenhuma consulta ainda</p>
                      <p className="text-sm mb-4">Faça sua primeira pergunta para começar!</p>
                      <button
                        onClick={() => setViewMode('input')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Fazer Primeira Consulta
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ✅ COLEÇÃO - Lista de problemas salvos COM resolução */}
            {viewMode === 'collection' && selectedCollection && (
              <div className="space-y-6">
                {/* Header da Coleção - MANTER IGUAL */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800">
                      📚 {selectedCollectionName || 'Coleção'}
                    </h2>
                    <button
                      onClick={handleBackToInput}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      ← Voltar
                    </button>
                  </div>
                </div>

                {/* Lista de Problemas Salvos - ATUALIZADA */}
                {filteredHistory.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      Problemas Salvos ({filteredHistory.length})
                    </h3>
                    
                    <div className="space-y-3">
                      {filteredHistory.slice(0, 10).map((problem) => (
                        <div 
                          key={problem.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 transition-colors cursor-pointer group"
                          onClick={() => handleStudyProblem(problem)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 mb-1">{problem.text}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>{'⭐'.repeat(problem.difficulty_level)}</span>
                                {problem.solved_time && (
                                  <span>⏱️ {formatTime(problem.solved_time)}</span>
                                )}
                                <span>{new Date(problem.created_at).toLocaleDateString('pt-BR')}</span>
                                <span className="text-blue-600">👁️ Clique para estudar</span>
                              </div>
                            </div>
                            
                            {/* ✅ BOTÕES ATUALIZADOS COM SIMILARES */}
                            <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* Gerar Similares */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleGenerateSimilarFromProblem(problem.text)
                                }}
                                disabled={isLoading}
                                className="p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Gerar exercícios similares"
                              >
                                <Sparkles className="w-4 h-4" />
                              </button>
                              
                              {/* Trocar Categoria */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleChangeProblemCollection(problem.id, problem.text)
                                }}
                                className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Trocar de coleção"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                </svg>
                              </button>
                              
                              {/* Excluir */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteProblem(problem.id)
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Excluir problema"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {filteredHistory.length > 10 && (
                      <div className="text-center mt-4">
                        <p className="text-gray-500 text-sm">
                          Mostrando 10 de {filteredHistory.length} problemas
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Mensagem quando coleção está vazia - MANTER IGUAL */}
                {filteredHistory.length === 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
                    <div className="text-gray-500">
                      <p className="text-lg font-semibold mb-2">📚 Coleção vazia</p>
                      <p className="text-sm mb-4">Resolva e salve problemas para populá-la!</p>
                      <button
                        onClick={handleBackToInput}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Resolver Problemas
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DeleteConfirmationModal
            isOpen={deleteModal.isOpen}
            onConfirm={confirmDeleteProblem}
            onCancel={cancelDeleteProblem}
            problemText={deleteModal.problemText}
            isLoading={deleteModal.isLoading}
          />
          <CollectionSelectorModal
            isOpen={collectionModal.isOpen}
            onSelect={handleSaveToCollection}
            onCancel={cancelSaveToCollection}
            problemText={collectionModal.problemText}
          />
          <DeleteConfirmationModal
            isOpen={deleteModal.isOpen}
            onConfirm={confirmDeleteProblem}
            onCancel={cancelDeleteProblem}
            problemText={deleteModal.problemText}
            isLoading={deleteModal.isLoading}
          />
          
          <CollectionSelectorModal
            isOpen={collectionModal.isOpen}
            onSelect={handleSaveToCollection}
            onCancel={cancelSaveToCollection}
            problemText={collectionModal.problemText}
            mode="save"
          />

          <CollectionSelectorModal
            isOpen={changeCategoryModal.isOpen}
            onSelect={handleConfirmChangeCollection}
            onCancel={handleCancelChangeCollection}
            problemText={changeCategoryModal.problemText}
            currentCollectionId={changeCategoryModal.currentCollectionId}
            mode="move"
          />

          <AdvancedLoader
            isVisible={isLoading}
            onCancel={handleCancelRequest}
            message={loadingMessage}
          />

          <ExplanationDrawer
            isOpen={explanationDrawer.isOpen}
            stepTitle={explanationDrawer.stepTitle}
            stepExplanation={explanationDrawer.stepExplanation}
            concept={explanationDrawer.concept}
            isLoading={explanationDrawer.isLoading}
            onClose={handleCloseExplanation}
          />
        </Layout>
      )}
    </>
  )
}

export default App