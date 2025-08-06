import { X, Github, Linkedin, Mail, Code } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const AboutModal = ({ isOpen, onClose }) => {
  const socialLinks = [
    {
      name: 'LinkedIn',
      icon: <Linkedin className="w-5 h-5" />,
      url: 'https://www.linkedin.com/in/francisco-pinheiro-305a551aa/',
      description: 'Perfil profissional e networking',
      color: 'text-blue-600 hover:text-blue-700'
    },
    {
      name: 'GitHub',
      icon: <Github className="w-5 h-5" />,
      url: 'https://github.com/fscpinheiro',
      description: 'Repositórios e projetos open source',
      color: 'text-gray-800 hover:text-gray-900'
    },
    {
      name: 'HackerRank',
      icon: <Code className="w-5 h-5" />,
      url: 'https://www.hackerrank.com/profile/fscpinheiro',
      description: 'Desafios de programação e certificações',
      color: 'text-green-600 hover:text-green-700'
    },
    {
      name: 'E-mail',
      icon: <Mail className="w-5 h-5" />,
      url: 'mailto:fscpinheiro@gmail.com',
      description: 'Contato direto para colaborações',
      color: 'text-red-600 hover:text-red-700'
    }
  ]

  const handleLinkClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[80]"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  F
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Francisco Pinheiro
                  </h3>
                  <p className="text-sm text-gray-600">fscpinheiro</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sobre o Projeto */}
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                🎯 Sobre o ExplicaAI
              </h4>
              <p className="text-blue-700 text-sm leading-relaxed">
                O ExplicaAI foi desenvolvido para o <strong>Gemma 3n Impact Challenge</strong>, 
                com foco em democratizar o acesso à educação matemática em escolas públicas brasileiras. 
                A aplicação funciona 100% offline, utilizando IA local para explicações passo a passo.
              </p>
            </div>

            {/* Desenvolvedor */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3">👨‍💻 Desenvolvedor</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Desenvolvedor apaixonado por tecnologia e educação, com foco em criar soluções 
                que tenham impacto social positivo. Especialista em aplicações web modernas 
                e integração com IA para educação.
              </p>
            </div>

            {/* Links Sociais */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800 mb-3">🔗 Conecte-se comigo</h4>
              {socialLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleLinkClick(link.url)}
                  className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md bg-white transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`${link.color} transition-colors`}>
                      {link.icon}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                        {link.name}
                      </h5>
                      <p className="text-sm text-gray-600">
                        {link.description}
                      </p>
                    </div>
                    
                    {/* External Link Icon */}
                    <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-2">
                  🚀 Desenvolvido para o Gemma 3n Impact Challenge
                </p>
                <p className="text-xs text-gray-500">
                  Obrigado por usar o ExplicaAI! 💙
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AboutModal