import { useState, useEffect } from 'react'
import { Heart, History, Settings, Plus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
// ✅ NOVOS IMPORTS PARA SISTEMA DE FUNDOS
import BackgroundSelector from '../ui/BackgroundSelector'
import BackgroundManager from '../ui/BackgroundManager'
import useBackground from '../../hooks/useBackground'
import SettingsModal from '../ui/SettingsModal'
import AISphere from '../ui/AISphere'
import DeleteCollectionModal from '../ui/DeleteCollectionModal'
import AboutModal from '../ui/AboutModal'

const Layout = ({ 
  children, 
  selectedCollection, 
  onCollectionSelect, 
  onCreateCollection, 
  showHistory, 
  onToggleHistory,
  showExamples,
  onToggleExamples,
  systemStatus,
  isLoading,
  isTyping
}) => {
  const [collections, setCollections] = useState([])
  const [showSidebar, setShowSidebar] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCollection, setNewCollection] = useState({
    name: '',
    color: '#4ECDC4'
  })

  // ✅ ESTADO PARA SISTEMA DE FUNDOS
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false)
  const { backgroundType, changeBackground } = useBackground()

  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [deleteCollectionModal, setDeleteCollectionModal] = useState({
  isOpen: false,
  collection: null,
  isLoading: false
})

  useEffect(() => {
    loadCollections()
    const handleCollectionsUpdate = () => {
      console.log('🔄 Recarregando coleções...')
      loadCollections()
    }
    window.addEventListener('collectionsUpdated', handleCollectionsUpdate)
    return () => {
      window.removeEventListener('collectionsUpdated', handleCollectionsUpdate)
    }
  }, [])

  const loadCollections = async () => {
    try {
      const response = await fetch('/api/collections')
      const data = await response.json()
      
      if (data.success) {
        const collectionsWithCount = data.collections.map(collection => ({
          ...collection,
          problem_count: collection.problem_count || 0
        }))
        setCollections(collectionsWithCount)        
    
      } else {
      console.log('❌ [DEBUG] API retornou erro:', data)
      }
    } catch (error) {
      console.error('Erro ao carregar coleções:', error)
    }
  }

  const handleDeleteCollection = (collection) => {
    console.log('🗑️ Abrindo modal para excluir:', collection.name)
    setDeleteCollectionModal({
      isOpen: true,
      collection: collection,
      isLoading: false
    })
  }

  const confirmDeleteCollection = async () => {
    if (!deleteCollectionModal.collection) return

    setDeleteCollectionModal(prev => ({ ...prev, isLoading: true }))

    try {
      const response = await fetch(`/api/collections/${deleteCollectionModal.collection.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        console.log('✅ Coleção excluída com sucesso!')
        console.log(`📦 ${data.problemsMigrated} problemas migrados para Favoritos`)
        
        // Recarregar lista de coleções
        await loadCollections()
        
        // Fechar modal
        setDeleteCollectionModal({
          isOpen: false,
          collection: null,
          isLoading: false
        })

        // Se estava vendo a coleção excluída, voltar para todas
        if (selectedCollection === deleteCollectionModal.collection.id) {
          onCollectionSelect(null)
        }

      } else {
        alert('Erro ao excluir coleção: ' + (data.message || data.error))
        setDeleteCollectionModal(prev => ({ ...prev, isLoading: false }))
      }
    } catch (error) {
      alert('Erro ao excluir coleção: ' + error.message)
      setDeleteCollectionModal(prev => ({ ...prev, isLoading: false }))
    }
  }

  const cancelDeleteCollection = () => {
    setDeleteCollectionModal({
      isOpen: false,
      collection: null,
      isLoading: false
    })
  }

  const handleCreateCollection = async () => {
    if (!newCollection.name.trim()) {
      alert('Nome da coleção é obrigatório!')
      return
    }

    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCollection.name,
          color: newCollection.color,
          icon: '📚'
        }),
      })

      const data = await response.json()

      if (data.success) {
        await loadCollections()
        setShowCreateModal(false)
        setNewCollection({ name: '', color: '#4ECDC4' })
        
        if (onCreateCollection) {
          onCreateCollection(data.collection)
        }
      } else {
        alert('Erro: ' + (data.message || data.error))
      }
    } catch (error) {
      alert('Erro ao criar coleção: ' + error.message)
    }
  }

  const handleToggleSidebar = () => {
    console.log('❤️ Toggle sidebar - Estado atual:', showSidebar)
    setShowSidebar(prev => {
      console.log('❤️ Novo estado do sidebar:', !prev)
      return !prev
    })
  }

  const colorOptions = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
    '#FF9F43', '#FF6348', '#FF4757', '#5F27CD',
    '#00D2D3', '#FF3838', '#FF9FF3', '#54A0FF',
    '#2ED573', '#FFA502', '#FF6B81', '#3742FA'
  ]

  return (
    // ✅ ENVOLVER TUDO COM BackgroundManager
    <BackgroundManager backgroundType={backgroundType}>
      {/* ✅ REMOVER O DIV COM FUNDO FIXO */}
      <div className="min-h-screen flex flex-col">
        <header className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-30 overflow-visible">
          <div className="px-4 py-4 overflow-visible">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 relative overflow-visible">
                  <AISphere 
                    state={isLoading ? "processing" : isTyping ? "typing" : !systemStatus?.canUseAI ? "error" : "idle"}
                    size="small"
                    className="w-full h-full"
                  />
                </div>
                <div>
                   <h1 className="text-2xl font-bold text-white">ExplicaAI</h1>
                  <p className="text-sm text-gray-300">
                    {showHistory 
                      ? '📚 Histórico de Problemas'
                      : selectedCollection === 'favorites' 
                        ? '❤️ Problemas Favoritos'
                        : selectedCollection 
                          ? collections.find(c => c.id === selectedCollection)?.name || 'Coleção'
                          : 'Assistente de Matemática Offline'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleToggleSidebar}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    showSidebar
                      ? 'text-red-500 bg-red-50 border-2 border-red-200'
                      : 'text-gray-600 hover:text-red-500 hover:bg-red-50 border-2 border-transparent'
                  }`}
                  title={showSidebar ? 'Fechar Coleções' : 'Abrir Coleções'}
                >
                  <Heart className="w-5 h-5" />
                </button>
                
                <button 
                  onClick={onToggleHistory}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    showHistory
                      ? 'text-blue-500 bg-blue-50 border-2 border-blue-200'
                      : 'text-gray-600 hover:text-blue-500 hover:bg-blue-50 border-2 border-transparent'
                  }`}
                  title={showHistory ? 'Fechar Histórico' : 'Abrir Histórico'}
                >
                  <History className="w-5 h-5" />
                </button>
                
                {/* ✅ BOTÃO DE CONFIGURAÇÕES MODIFICADO */}
                <button 
                  onClick={() => setShowSettingsModal(true)}
                  className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 border-2 border-transparent"
                  title="Configurações"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-8">
          {children}
        </main>

        <footer className="fixed bottom-0 left-0 right-0 text-center z-10">
          <div className="w-full bg-black/20 backdrop-blur-md border-t border-white/10 px-6 py-3 shadow-lg">
            <p className="text-white/80 text-sm font-medium">
              ExplicaAI - Projeto Social para Educação Matemática Offline
            </p>
            <p className="text-white/60 text-xs mt-1">
              Desenvolvido por{' '}
              <button
                onClick={() => setShowAboutModal(true)}
                className="text-white/80 hover:text-white underline hover:no-underline transition-colors duration-200 font-medium"
              >
                fscpinheiro
              </button>
              {' '}• Gemma 3n Impact Challenge
            </p>
          </div>
        </footer>
      </div>

      {/* OVERLAY DO SIDEBAR */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => {
              console.log('🔒 Overlay clicado - fechando sidebar')
              setShowSidebar(false)
            }}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <AnimatePresence>
        {showSidebar && (
          <motion.aside
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-100 bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">📚 Coleções ({collections.length})</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      console.log('➕ Abrindo modal de criação')
                      setShowSidebar(false)
                      setShowCreateModal(true)
                    }}
                    className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                    title="Nova Coleção"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      console.log('❌ Fechando sidebar pelo X')
                      setShowSidebar(false)
                    }}
                    className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                    title="Fechar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {collections.length > 0 ? (
                collections.map((collection) => {
                  const problemCount = parseInt(collection.problem_count) || 0
                  
                  return (
                    <div key={collection.id} className="flex items-center gap-2 group">
                      <motion.button
                        onClick={() => {
                          console.log('🖱️ Coleção selecionada:', collection.name)
                          onCollectionSelect && onCollectionSelect(collection.id)
                          setShowSidebar(false)
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex-1 text-left p-3 rounded-xl border transition-all duration-200 ${
                          selectedCollection === collection.id
                            ? 'border-2 shadow-lg bg-blue-50'
                            : 'border border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                        }`}
                        style={{
                          borderColor: selectedCollection === collection.id ? collection.color : undefined
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold text-white shadow-md"
                              style={{ backgroundColor: collection.color }}
                            >
                              {collection.icon || '📚'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-800 truncate">
                                {collection.name}
                              </h3>
                              {collection.description && (
                                <p className="text-xs text-gray-500 truncate">
                                  {collection.description}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1">
                            <span 
                              className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold rounded-full text-white shadow-sm"
                              style={{ 
                                backgroundColor: collection.color,
                                color: 'white'
                              }}
                            >
                              {problemCount}
                            </span>
                            
                            {collection.is_system === 1 && (
                              <div className="text-xs text-gray-400">Sistema</div>
                            )}
                          </div>
                        </div>
                      </motion.button>

                      {collection.is_system !== 1 ? (
                        <motion.button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDeleteCollection(collection)
                          }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 rounded-lg border border-red-200 hover:border-red-300 transition-all duration-200 opacity-0 group-hover:opacity-100"
                          title={`Excluir coleção "${collection.name}"`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </motion.button>
                      ) : (
                        <div className="w-10 h-10" />
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="mb-4 text-4xl">📚</div>
                  <p className="text-lg font-medium mb-2">Nenhuma coleção encontrada</p>
                  <p className="text-sm mb-4">Crie sua primeira coleção para organizar seus problemas</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    ➕ Criar Primeira Coleção
                  </button>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MODAL DE CRIAÇÃO DE COLEÇÃO */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  📚 Nova Coleção
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Coleção
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Trigonometria"
                    value={newCollection.name}
                    onChange={(e) => setNewCollection(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cor da Coleção
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewCollection(prev => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                          newCollection.color === color
                            ? 'border-gray-800 scale-110'
                            : 'border-gray-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-600 mb-2">Preview:</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold text-white shadow-md"
                        style={{ backgroundColor: newCollection.color }}
                      >
                        📚
                      </span>
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {newCollection.name || 'Nome da Coleção'}
                        </h4>
                      </div>
                    </div>
                    <span 
                      className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold rounded-full text-white shadow-sm"
                      style={{ 
                        backgroundColor: newCollection.color,
                        color: 'white'
                      }}
                    >
                      0
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateCollection}
                  disabled={!newCollection.name.trim()}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Criar Coleção
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
         <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          onOpenBackgroundSelector={() => setShowBackgroundSelector(true)}
          onOpenAbout={() => setShowAboutModal(true)}
          showExamples={showExamples}
          onToggleExamples={onToggleExamples}
        />
      {/*MODAL DE SELEÇÃO DE FUNDO */}
      <BackgroundSelector
        isOpen={showBackgroundSelector}
        onClose={() => setShowBackgroundSelector(false)}
        currentBackground={backgroundType}
        onSelectBackground={changeBackground}
      />

      {/* Modal de Exclusão de Coleção */}
      <DeleteCollectionModal
        isOpen={deleteCollectionModal.isOpen}
        onConfirm={confirmDeleteCollection}
        onCancel={cancelDeleteCollection}
        collection={deleteCollectionModal.collection}
        isLoading={deleteCollectionModal.isLoading}
      />
      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />
    </BackgroundManager>
  )
}

export default Layout