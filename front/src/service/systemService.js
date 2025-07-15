class SystemService {
  constructor() {
    this.baseUrl = '/api'
  }

  /**
   * Verificar se o Ollama está online
   */
  async checkOllamaStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/status`, {
        method: 'GET',
        timeout: 5000
      })

      const data = await response.json()
      
      return {
        isOnline: data.ollama === 'online',
        model: data.model || 'gemma3n:e4b',
        details: data
      }
    } catch (error) {
      console.error('❌ Erro ao verificar Ollama:', error)
      return {
        isOnline: false,
        model: 'gemma3n:e4b',
        error: error.message
      }
    }
  }

  /**
   * Verificar status geral do sistema
   */
  async checkSystemHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/status`, {
        method: 'GET',
        timeout: 8000
      })

      if (!response.ok) {
        throw new Error(`API retornou status ${response.status}`)
      }

      const data = await response.json()
      
      return {
        api: true,
        database: data.database === 'connected',
        ollama: data.ollama === 'online',
        model: data.model,
        version: data.version,
        uptime: data.uptime,
        details: data
      }
    } catch (error) {
      console.error('❌ Erro na verificação do sistema:', error)
      return {
        api: false,
        database: false,
        ollama: false,
        error: error.message
      }
    }
  }

  /**
   * Testar conectividade básica
   */
  async ping() {
    try {
      const startTime = Date.now()
      const response = await fetch(`${this.baseUrl}/status`, {
        method: 'GET',
        timeout: 3000
      })
      const endTime = Date.now()

      return {
        success: response.ok,
        latency: endTime - startTime,
        status: response.status
      }
    } catch (error) {
      return {
        success: false,
        latency: -1,
        error: error.message
      }
    }
  }

  /**
   * Verificação completa com retry
   */
  async fullSystemCheck(retries = 2) {
    let lastError = null

    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        console.log(`🔍 Verificação do sistema - Tentativa ${attempt}`)
        
        const health = await this.checkSystemHealth()
        
        if (health.api) {
          console.log('✅ Sistema verificado com sucesso!')
          return {
            success: true,
            attempt,
            ...health
          }
        }
        
        lastError = health.error || 'API não respondeu'
        
        // Wait before retry (except last attempt)
        if (attempt <= retries) {
          console.log(`⏳ Tentando novamente em 1s...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
      } catch (error) {
        lastError = error.message
        console.error(`❌ Tentativa ${attempt} falhou:`, error.message)
        
        if (attempt <= retries) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    return {
      success: false,
      attempts: retries + 1,
      error: lastError,
      api: false,
      database: false,
      ollama: false
    }
  }
}

// Instância singleton
const systemService = new SystemService()

export default systemService