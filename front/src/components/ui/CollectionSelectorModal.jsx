import { useState, useEffect } from 'react'
import { X, Check, Plus, Heart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const CollectionSelectorModal = ({ 
  isOpen, 
  onSelect, 
  onCancel,
  problemText,
  defaultSelected = null
}) => {
  const [collections, setCollections] = useState([])
  const [selectedCollection, setSelectedCollection] = useState(defaultSelected)
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCollection, setNewCollection] = useState({
    name: '',
    color: '#4ECDC4'
  })

  useEffect(() => {
    if (isOpen) {
      loadCollections()
    }
  }, [isOpen])

  const loadCollections = async () => {
    try {
      const response = await fetch('/api/collections')
      const data = await response.json()
      
      if (data.success) {
        setCollections(data.collections)
        
        // Se não tem coleção selecionada, selecionar Favoritos por padrão
        if (!selectedCollection) {
          const favorites = data.collections.find(c => c.name === 'Favoritos')
          if (favorites) {
            setSelectedCollection(favorites.id)
          }
        }
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

    setIsLoading(true)

    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCollection.name.trim(),
          color: newCollection.color,
          icon: '📚'
        }),
      })

      const data = await response.json()

      if (data.success) {
        await loadCollections()
        setSelectedCollection(data.collection.id)
        setShowCreateForm(false)
        setNewCollection({ name: '', color: '#4ECDC4' })
        window.dispatchEvent(new CustomEvent('collectionsUpdated'))
      } else {
        alert('Erro ao criar coleção: ' + (data.message || data.error))
      }
    } catch (error) {
      alert('Erro ao criar coleção: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = () => {
    if (selectedCollection) {
      onSelect(selectedCollection)
    }
  }

  const truncateText = (text, maxLength = 80) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const colorOptions = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                📚 Escolher Coleção
              </h3>
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Problema */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <p className="text-sm font-medium text-blue-800 mb-2">
                Problema que será salvo:
              </p>
              <p className="text-blue-700 text-sm">
                "{truncateText(problemText)}"
              </p>
            </div>

            {!showCreateForm ? (
              <>
                {/* Lista de Coleções */}
                <div className="mb-6 max-h-60 overflow-y-auto space-y-2">
                  {collections.map((collection) => (
                    <button
                      key={collection.id}
                      onClick={() => setSelectedCollection(collection.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
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
                            <h4 className="font-semibold text-gray-800 truncate">
                              {collection.name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {collection.problem_count || 0} problemas
                            </p>
                          </div>
                        </div>
                        
                        {selectedCollection === collection.id && (
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: collection.color }}
                          >
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Botão Criar Nova Coleção */}
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full mb-6 p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Criar Nova Coleção</span>
                </button>

                {/* Botões */}
                <div className="flex gap-3">
                  <button
                    onClick={onCancel}
                    className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={!selectedCollection}
                    className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Heart className="w-4 h-4" />
                    Salvar na Coleção
                  </button>
                </div>
              </>
            ) : (
              /* Formulário Criar Coleção */
              <>
                <div className="mb-6 space-y-4">
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
                </div>

                {/* Botões */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleCreateCollection}
                    disabled={!newCollection.name.trim() || isLoading}
                    className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {isLoading ? 'Criando...' : 'Criar e Selecionar'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CollectionSelectorModal