import { useState, useEffect } from 'react'
import { Heart, History, Settings, Plus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Layout = ({ children, selectedCollection, onCollectionSelect, onCreateCollection, showHistory, onToggleHistory }) => {
  const [collections, setCollections] = useState([])
  const [showSidebar, setShowSidebar] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCollection, setNewCollection] = useState({
    name: '',
    color: '#4ECDC4'
  })

  useEffect(() => {
    loadCollections()
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
      }
    } catch (error) {
      console.error('Erro ao carregar coleções:', error)
    }
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

  const colorOptions = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="min-h-screen flex flex-col">
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-30">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  🧮
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">ExplicaAI</h1>
                  <p className="text-sm text-gray-600">
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
                  onClick={() => setShowSidebar(!showSidebar)}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    showSidebar
                      ? 'text-red-500 bg-red-50'
                      : 'text-gray-600 hover:text-red-500 hover:bg-red-50'
                  }`}
                  title="Coleções"
                >
                  <Heart className="w-5 h-5" />
                </button>
                
                <button 
                  onClick={onToggleHistory}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    showHistory
                      ? 'text-blue-500 bg-blue-50'
                      : 'text-gray-600 hover:text-blue-500 hover:bg-blue-50'
                  }`}
                  title="Histórico"
                >
                  <History className="w-5 h-5" />
                </button>
                
                <button className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-8">
          {children}
        </main>

        <footer className="mt-16 py-8 text-center text-gray-500 text-sm border-t border-gray-200">
          <p>ExplicaAI - Projeto Social para Educação Matemática Offline</p>
        </footer>
      </div>

      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowSidebar(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSidebar && (
          <motion.aside
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">📚 Coleções</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Nova Coleção"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Fechar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {collections.map((collection) => {
                const problemCount = parseInt(collection.problem_count) || 0
                
                return (
                  <motion.button
                    key={collection.id}
                    onClick={() => {
                      onCollectionSelect && onCollectionSelect(collection.id)
                      setShowSidebar(false)
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                      selectedCollection === collection.id
                        ? 'border-2 shadow-lg'
                        : 'border border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                    style={{
                      borderColor: selectedCollection === collection.id ? collection.color : undefined,
                      backgroundColor: selectedCollection === collection.id 
                        ? `${collection.color}15` 
                        : 'white'
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
                        </div>
                      </div>
                      
                      {/* ✅ ÁREA DIREITA COMPLETAMENTE REESTRUTURADA - SEM 0 EXTRA! */}
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
                )
              })}

              {collections.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-2">Nenhuma coleção encontrada</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Criar primeira coleção
                  </button>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

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
    </div>
  )
}

export default Layout