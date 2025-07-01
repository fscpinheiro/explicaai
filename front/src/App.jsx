import { useState, useEffect } from 'react'
import {  Heart, Trash2, MoreHorizontal, Sparkles } from 'lucide-react'
import Layout from './components/layout/Layout'
import MathInput from './components/features/MathInput'
import DeleteConfirmationModal from './components/ui/DeleteConfirmationModal'
import CollectionSelectorModal from './components/ui/CollectionSelectorModal'

function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [filteredHistory, setFilteredHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [viewMode, setViewMode] = useState('input') // 'input', 'history', 'collection', 'study'

  const [collectionModal, setCollectionModal] = useState({
    isOpen: false,
    problemText: '',
    explanation: '',
    processingTime: 0,
    type: 'detailed'
  })

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    problemId: null,
    problemText: '',
    isLoading: false
  })

  // Carregar histórico de problemas ao iniciar
  useEffect(() => {
    loadHistory()
  }, [])

  // Filtrar histórico quando mudar coleção selecionada
  useEffect(() => {
    filterHistory()
  }, [history, selectedCollection])

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
    console.log('Problema explicado:', resultData)
    
    // Mostrar resultado
    setResult({
      type: 'explanation',
      subType: resultData.type,
      problem: resultData.problem,
      explanation: resultData.explanation,
      processingTime: resultData.processingTime,
      autoCategory: resultData.autoCategory
    })

    // Recarregar histórico para mostrar o novo problema
    await loadHistory()
    notifyCollectionsChanged() 
    // Mudar para modo input com resultado
    setViewMode('input')
    setShowHistory(false)
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

  const handleTakePhoto = () => {
    alert('📷 Função OCR será implementada em breve!\n\nPor enquanto, digite o problema manualmente.')
  }

  const handleCollectionSelect = (collectionId) => {
    setSelectedCollection(collectionId)
    setViewMode('collection')
    setShowHistory(false)
    setResult(null)
    
    // Carregar problemas da coleção específica
    loadCollectionProblems(collectionId)
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
    setResult(null)
  }

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatExplanation = (text) => {
    // Quebrar texto por linhas e formatar
    return text.split('\n').map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        // Títulos em negrito
        return (
          <h4 key={index} className="font-bold text-gray-800 mt-4 mb-2 first:mt-0">
            {line.replace(/\*\*/g, '')}
          </h4>
        )
      } else if (line.trim() === '') {
        // Linhas vazias
        return <br key={index} />
      } else {
        // Texto normal
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
    
    if (!problemId || !newCollectionId) return

    try {
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
        // Recarregar a lista da coleção atual
        if (currentCollectionId) {
          loadCollectionProblems(currentCollectionId)
        }
        
        // Notificar mudança
        notifyCollectionsChanged()
        
        // Fechar modal
        setChangeCategoryModal({
          isOpen: false,
          problemId: null,
          problemText: '',
          currentCollectionId: null
        })
        
        console.log('✅ Problema movido para nova coleção!')
      } else {
        alert('Erro ao mover problema: ' + (data.message || data.error))
      }
    } catch (error) {
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
    console.log('🔔 [DEBUG] notifyCollectionsChanged() CHAMADA!')
    console.log('🔔 [DEBUG] Disparando evento collectionsUpdated...')

    window.dispatchEvent(new CustomEvent('collectionsUpdated'))
    
    console.log('🔔 [DEBUG] Evento disparado, iniciando setTimeout...')
    setTimeout(() => {
      console.log('🔔 [DEBUG] setTimeout executado, chamando loadHistory...')
      loadHistory()
    }, 100)

    console.log('🔄 Notificando atualização de coleções')
  }

  return (
    <Layout 
      selectedCollection={selectedCollection}
      onCollectionSelect={handleCollectionSelect}
      onCreateCollection={handleCreateCollection}
      showHistory={showHistory}
      onToggleHistory={handleToggleHistory}
    >
      <div className="space-y-8">
        
        {/* ✅ MODO ESTUDO - Tela dedicada para ver resolução */}
        {viewMode === 'study' && result && (
          <div className="space-y-6">
            {/* Botão Voltar */}
            <button
              onClick={handleBackToInput}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Voltar
            </button>

            {/* Resolução em Tela Cheia */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  📖 Resolução Completa
                </h2>
                
                {result.processingTime && (
                  <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    ⏱️ {formatTime(result.processingTime)}
                  </span>
                )}
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

              {/* Explicação */}
              <div className="bg-gray-50 p-6 rounded-xl">
                <div className="prose prose-lg max-w-none">
                  {formatExplanation(result.explanation)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ MODO INPUT - Card principal (apenas quando não está no histórico ou coleção) */}
        {viewMode === 'input' && (
          <MathInput
            onExplain={handleExplain}
            onGenerateSimilar={handleGenerateSimilar}
            onTakePhoto={handleTakePhoto}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
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
                  ? (result.subType === 'brief' ? '📋 Explicação Resumida' : '📋 Explicação Passo a Passo')
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
                      className={`ml-4 p-2 rounded-lg transition-colors ${
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

                {/* Explicação */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="prose prose-sm max-w-none">
                    {formatExplanation(result.explanation)}
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

            {result.type === 'similar' && (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-xl border-l-4 border-green-400">
                  <p className="font-semibold text-green-800 mb-2">Problema Original:</p>
                  <p className="text-green-700">{result.originalProblem}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="whitespace-pre-wrap text-gray-700">
                    {result.similarProblems}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ✅ HISTÓRICO - Lista simples de problemas solicitados */}
        {viewMode === 'history' && (
          <div className="space-y-6">
            {/* Estatísticas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                <div className="text-2xl font-bold text-blue-600">{history.length}</div>
                <div className="text-sm text-gray-600">Problemas Consultados</div>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                <div className="text-2xl font-bold text-red-500">
                  {history.filter(p => p.is_favorite).length}
                </div>
                <div className="text-sm text-gray-600">Salvos (Favoritos)</div>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {history.length > 0 ? Math.round(history.reduce((acc, p) => acc + (p.difficulty_level || 1), 0) / history.length * 10) / 10 : 0}
                </div>
                <div className="text-sm text-gray-600">Dificuldade Média</div>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {history.filter(p => p.created_at.includes(new Date().toISOString().split('T')[0])).length}
                </div>
                <div className="text-sm text-gray-600">Hoje</div>
              </div>
            </div>

            {/* Lista do Histórico - SEM resolução */}
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
                        {/* ✅ SEM CLIQUE para abrir resolução - apenas mostra o que foi perguntado */}
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
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
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

            {/* Mensagem quando não há histórico */}
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
            {/* Header da Coleção */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  📚 {selectedCollection === 'favorites' ? 'Favoritos' : 'Coleção Selecionada'}
                </h2>
                <button
                  onClick={handleBackToInput}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Voltar
                </button>
              </div>
            </div>

            {/* Lista de Problemas Salvos */}
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
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Trocar Categoria - aparece quando está visualizando coleções */}
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

            {/* Mensagem quando coleção está vazia */}
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
    </Layout>
  )
}

export default App