import { X, Trash2, AlertTriangle, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const DeleteCollectionModal = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  collection,
  isLoading = false 
}) => {
  if (!collection) return null

  const problemCount = parseInt(collection.problem_count) || 0
  const hasProblems = problemCount > 0

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800">
                  Excluir Coleção
                </h3>
                <p className="text-sm text-gray-500">
                  Esta ação não pode ser desfeita
                </p>
              </div>
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Coleção que será excluída */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-red-400">
              <div className="flex items-center gap-3 mb-2">
                <span 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-md"
                  style={{ backgroundColor: collection.color }}
                >
                  {collection.icon || '📚'}
                </span>
                <div>
                  <p className="font-medium text-gray-800">
                    {collection.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {problemCount} problema{problemCount !== 1 ? 's' : ''} salvo{problemCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Aviso sobre migração */}
            {hasProblems ? (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">O que acontecerá:</p>
                    <p>
                      Os <strong>{problemCount} problema{problemCount !== 1 ? 's' : ''}</strong> desta coleção 
                      {problemCount === 1 ? ' será movido' : ' serão movidos'} automaticamente para a coleção <strong>"Favoritos"</strong>.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div className="text-sm text-green-800">
                    <p className="font-medium mb-1">Coleção vazia</p>
                    <p>Esta coleção não possui problemas salvos, então pode ser excluída sem preocupações.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Warning final */}
            <div className="mb-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Atenção!</p>
                  <p>
                    A coleção "<strong>{collection.name}</strong>" será removida permanentemente 
                    e não poderá ser recuperada.
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Excluir Coleção
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default DeleteCollectionModal