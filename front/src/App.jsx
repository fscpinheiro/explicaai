import { useState, useEffect } from 'react'
import { Heart, Trash2 } from 'lucide-react'
import Layout from './components/layout/Layout'
import MathInput from './components/features/MathInput'

function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [filteredHistory, setFilteredHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false) // Controla exibição do histórico

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

  const toggleFavorite = async (problemId) => {
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
      }
    } catch (error) {
      console.error('Erro ao alterar favorito:', error)
    }
  }

  const deleteProblem = async (problemId) => {
    if (!confirm('Tem certeza que deseja excluir este problema?')) {
      return
    }

    try {
      const response = await fetch(`/api/problems/${problemId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        // Remover do estado local
        setHistory(prev => prev.filter(p => p.id !== problemId))
        
        // Se estava vendo este problema no resultado, limpar
        if (result && result.problem && result.problem.id === problemId) {
          setResult(null)
        }

        console.log('🗑️ Problema excluído com sucesso!')
      } else {
        alert('Erro ao excluir: ' + (data.message || data.error))
      }
    } catch (error) {
      alert('Erro ao excluir problema: ' + error.message)
    }
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
    
    // Fechar histórico se estiver aberto (focar no resultado)
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
  }

  const handleTakePhoto = () => {
    alert('📷 Função OCR será implementada em breve!\n\nPor enquanto, digite o problema manualmente.')
  }

  const handleCollectionSelect = (collectionId) => {
    setSelectedCollection(collectionId)
    setResult(null) // Limpar resultado quando trocar filtro
  }

  const handleCreateCollection = async (newCollection) => {
    console.log('Nova coleção criada:', newCollection)
    // A interface já recarrega automaticamente
  }

  const handleToggleHistory = () => {
    setShowHistory(!showHistory)
    if (!showHistory) {
      setResult(null) // Limpar resultado quando abrir histórico
    }
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

  const getFilterTitle = () => {
    if (selectedCollection === null) return 'Todos os Problemas'
    if (selectedCollection === 'favorites') return 'Problemas Favoritos'
    return 'Problemas Filtrados'
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
        {/* Input Principal - sempre visível quando não está no histórico */}
        {!showHistory && (
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

        {/* Área de Resultados - apenas quando há resultado e não está no histórico */}
        {result && !isLoading && !showHistory && (
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
                      onClick={() => toggleFavorite(result.problem.id)}
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

        {/* Histórico - apenas quando botão História for clicado */}
        {showHistory && (
          <div className="space-y-6">
            {/* Estatísticas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                <div className="text-2xl font-bold text-blue-600">{history.length}</div>
                <div className="text-sm text-gray-600">Problemas Resolvidos</div>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                <div className="text-2xl font-bold text-red-500">
                  {history.filter(p => p.is_favorite).length}
                </div>
                <div className="text-sm text-gray-600">Favoritos</div>
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

            {/* Lista do Histórico */}
            {filteredHistory.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">
                    📚 {getFilterTitle()} ({filteredHistory.length})
                  </h3>
                  
                  {selectedCollection && (
                    <button
                      onClick={() => handleCollectionSelect(null)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Ver todos →
                    </button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {filteredHistory.slice(0, 20).map((problem) => (
                    <div 
                      key={problem.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-start justify-between">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => {
                            setResult({
                              type: 'explanation',
                              subType: 'detailed',
                              problem: problem,
                              explanation: problem.explanation,
                              processingTime: problem.solved_time
                            })
                            setShowHistory(false) // Fechar histórico ao visualizar
                          }}
                        >
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
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Favorito */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(problem.id)
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              problem.is_favorite
                                ? 'text-red-500 bg-red-50 hover:bg-red-100'
                                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                            }`}
                            title={problem.is_favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                          >
                            <Heart className={`w-4 h-4 ${problem.is_favorite ? 'fill-current' : ''}`} />
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
                
                {filteredHistory.length > 20 && (
                  <div className="text-center mt-4">
                    <p className="text-gray-500 text-sm">
                      Mostrando 20 de {filteredHistory.length} problemas
                    </p>
                  </div>
                )}

                {/* Mensagem quando não há problemas na coleção/filtro */}
                {filteredHistory.length === 0 && selectedCollection && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-2">
                      {selectedCollection === 'favorites' 
                        ? '❤️ Nenhum problema favorito ainda'
                        : '📚 Nenhum problema nesta coleção ainda'
                      }
                    </p>
                    <p className="text-sm">
                      {selectedCollection === 'favorites' 
                        ? 'Marque problemas como favoritos clicando no ❤️'
                        : 'Resolva alguns problemas para populá-la automaticamente'
                      }
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Mensagem quando não há histórico geral */}
            {history.length === 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
                <div className="text-gray-500">
                  <p className="text-lg font-semibold mb-2">📚 Nenhum problema resolvido ainda</p>
                  <p className="text-sm mb-4">Comece resolvendo seu primeiro problema de matemática!</p>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Resolver Primeiro Problema
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default App