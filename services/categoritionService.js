// ExplicaAI - Serviço de Auto-categorização Inteligente
// Analisa problemas matemáticos e sugere categorias automaticamente

const { truncateText } = require('../utils/helpers');

class CategorizationService {
  constructor() {
    // Padrões para identificação de categorias
    this.patterns = {
      'Álgebra Básica': {
        keywords: ['x', 'y', 'equação', 'linear', 'sistema', 'variável', 'incógnita', 'resolver'],
        symbols: ['=', '+', '-', 'x', 'y', 'z'],
        regex: [
          /\d*x\s*[\+\-]\s*\d+\s*=\s*\d+/, // 2x + 5 = 13
          /\d*x\s*=\s*\d+/, // x = 5
          /x\s*[\+\-]\s*\d+\s*=\s*\d+/, // x + 3 = 7
          /sistema.*equa[çc][õo]es?/i,
          /equa[çc][ãa]o.*linear/i
        ],
        confidence: 0.7
      },
      
      'Geometria': {
        keywords: ['área', 'perímetro', 'volume', 'círculo', 'triângulo', 'quadrado', 'retângulo', 
                  'comprimento', 'largura', 'altura', 'raio', 'diâmetro', 'lado', 'base',
                  'pitágoras', 'teorema', 'ângulo', 'grau', 'cm', 'm', 'km', 'm²', 'cm²'],
        symbols: ['π', '°', '²', '³'],
        regex: [
          /área.*=.*π.*r/i,
          /volume.*=.*π.*r.*h/i,
          /perímetro/i,
          /teorema.*pitágoras/i,
          /\d+\s*(cm|m|km)²?/i,
          /ângulo.*\d+°/i
        ],
        confidence: 0.9
      },
      
      'Funções': {
        keywords: ['função', 'f(x)', 'g(x)', 'domínio', 'imagem', 'gráfico', 'sen', 'cos', 'tan',
                  'log', 'ln', 'exponencial', 'logaritmo', 'derivada', 'integral'],
        symbols: ['f(', 'g(', 'sen(', 'cos(', 'tan(', 'log(', 'ln(', '∫', '∑'],
        regex: [
          /f\(x\)\s*=/, // f(x) = 
          /g\(x\)\s*=/, // g(x) = 
          /(sen|cos|tan)\([^)]+\)/i,
          /log\([^)]+\)/i,
          /ln\([^)]+\)/i,
          /\^x/i, // exponencial
          /x\^\d+/i, // potência
          /√/
        ],
        confidence: 0.8
      },
      
      'Preparação ENEM': {
        keywords: ['enem', 'vestibular', 'concurso', 'porcentagem', '%', 'juros', 'desconto',
                  'regra de três', 'proporção', 'razão', 'probabilidade', 'estatística',
                  'média', 'moda', 'mediana', 'gráfico', 'tabela'],
        symbols: ['%'],
        regex: [
          /enem/i,
          /vestibular/i,
          /\d+%/,
          /juros/i,
          /desconto/i,
          /regra.*tr[êe]s/i,
          /probabilidade/i,
          /estatística/i
        ],
        confidence: 0.6
      },
      
      'Para Revisar': {
        keywords: ['difícil', 'complexo', 'não entendi', 'confuso', 'revisar', 'estudar mais'],
        symbols: [],
        regex: [
          /n[ãa]o.*entend/i,
          /difícil/i,
          /complexo/i,
          /confuso/i
        ],
        confidence: 0.4
      }
    };
    
    // Cache para otimizar análises repetidas
    this.cache = new Map();
    this.maxCacheSize = 100;
  }

  /**
   * Categorizar problema matemático
   */
  categorizeProblem(problemText) {
    try {
      // Verificar cache primeiro
      const cacheKey = this.generateCacheKey(problemText);
      if (this.cache.has(cacheKey)) {
        console.log(`💾 Categoria recuperada do cache: "${truncateText(problemText)}"`);
        return this.cache.get(cacheKey);
      }

      const text = problemText.toLowerCase().trim();
      const scores = {};

      // Calcular pontuação para cada categoria
      for (const [category, pattern] of Object.entries(this.patterns)) {
        scores[category] = this.calculateCategoryScore(text, pattern);
      }

      // Encontrar categoria com maior pontuação
      const bestMatch = this.findBestMatch(scores);
      
      // Adicionar ao cache
      this.addToCache(cacheKey, bestMatch);
      
      console.log(`🔍 Problema categorizado: "${truncateText(problemText)}" → ${bestMatch.category} (${(bestMatch.confidence * 100).toFixed(1)}%)`);
      
      return bestMatch;
    } catch (error) {
      console.error('❌ Erro na categorização:', error.message);
      return this.getDefaultCategory();
    }
  }

  /**
   * Calcular pontuação de uma categoria para um texto
   */
  calculateCategoryScore(text, pattern) {
    let score = 0;
    let matches = 0;

    // Pontuação por palavras-chave
    for (const keyword of pattern.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 1;
        matches++;
      }
    }

    // Pontuação por símbolos
    for (const symbol of pattern.symbols) {
      if (text.includes(symbol)) {
        score += 0.5;
        matches++;
      }
    }

    // Pontuação por regex (mais específico)
    for (const regex of pattern.regex) {
      if (regex.test(text)) {
        score += 2;
        matches++;
      }
    }

    // Normalizar pontuação baseada no número de padrões
    const totalPatterns = pattern.keywords.length + pattern.symbols.length + pattern.regex.length;
    const normalizedScore = totalPatterns > 0 ? score / totalPatterns : 0;

    return {
      score: normalizedScore,
      matches,
      baseConfidence: pattern.confidence
    };
  }

  /**
   * Encontrar melhor categoria baseada nas pontuações
   */
  findBestMatch(scores) {
    let bestCategory = null;
    let bestScore = 0;
    let bestConfidence = 0;

    for (const [category, result] of Object.entries(scores)) {
      const finalScore = result.score * result.baseConfidence;
      
      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestCategory = category;
        bestConfidence = Math.min(finalScore, 0.95); // Máximo 95% de confiança
      }
    }

    // Se nenhuma categoria teve pontuação significativa, usar padrão
    if (bestScore < 0.1) {
      return this.getDefaultCategory();
    }

    return {
      category: bestCategory,
      confidence: bestConfidence,
      details: scores[bestCategory]
    };
  }

  /**
   * Categoria padrão quando não consegue categorizar
   */
  getDefaultCategory() {
    return {
      category: 'Álgebra Básica',
      confidence: 0.5,
      details: { score: 0, matches: 0, baseConfidence: 0.5 }
    };
  }

  /**
   * Gerar sugestões de tags baseadas no problema
   */
  generateTags(problemText, category) {
    const tags = [];
    const text = problemText.toLowerCase();

    // Tag da categoria
    tags.push(category.toLowerCase().replace(/\s+/g, '-'));

    // Tags específicas baseadas no conteúdo
    const tagPatterns = {
      'equação': /equa[çc][ãa]o/i,
      'sistema': /sistema/i,
      'função': /fun[çc][ãa]o|f\(x\)/i,
      'geometria': /área|perímetro|volume|círculo|triângulo/i,
      'trigonometria': /(sen|cos|tan)\(/i,
      'logaritmo': /(log|ln)\(/i,
      'porcentagem': /%|\bpor\s*cento/i,
      'juros': /juros/i,
      'probabilidade': /probabilidade/i,
      'estatística': /estatística|média|moda|mediana/i
    };

    for (const [tag, pattern] of Object.entries(tagPatterns)) {
      if (pattern.test(text)) {
        tags.push(tag);
      }
    }

    // Limitar número de tags
    return tags.slice(0, 5);
  }

  /**
   * Analisar dificuldade do problema
   */
  analyzeDifficulty(problemText) {
    const text = problemText.toLowerCase();
    let difficultyScore = 1;

    // Fatores que aumentam dificuldade
    const difficultyFactors = [
      { pattern: /\^[2-9]/, weight: 1 }, // Potências
      { pattern: /(sen|cos|tan)\(/i, weight: 1.5 }, // Trigonometria
      { pattern: /(log|ln)\(/i, weight: 1.5 }, // Logaritmos
      { pattern: /√/, weight: 0.5 }, // Raízes
      { pattern: /sistema/i, weight: 1 }, // Sistemas
      { pattern: /integral|derivada/i, weight: 2 }, // Cálculo
      { pattern: /matriz/i, weight: 1.5 }, // Álgebra linear
      { pattern: /\d{3,}/, weight: 0.5 } // Números grandes
    ];

    for (const factor of difficultyFactors) {
      if (factor.pattern.test(text)) {
        difficultyScore += factor.weight;
      }
    }

    // Normalizar para escala 1-5
    const normalizedDifficulty = Math.min(Math.max(Math.round(difficultyScore), 1), 5);

    return {
      level: normalizedDifficulty,
      description: this.getDifficultyDescription(normalizedDifficulty)
    };
  }

  /**
   * Obter descrição da dificuldade
   */
  getDifficultyDescription(level) {
    const descriptions = {
      1: 'Básico',
      2: 'Fácil',
      3: 'Médio',
      4: 'Difícil',
      5: 'Avançado'
    };
    
    return descriptions[level] || 'Médio';
  }

  /**
   * Sugerir coleção baseada na categoria
   */
  suggestCollection(category, confidence) {
    // Se confiança é baixa, sugerir Favoritos
    if (confidence < 0.6) {
      return 'Favoritos';
    }

    // Mapeamento direto categoria → coleção
    const categoryMapping = {
      'Álgebra Básica': 'Álgebra Básica',
      'Geometria': 'Geometria',
      'Funções': 'Funções',
      'Preparação ENEM': 'Preparação ENEM',
      'Para Revisar': 'Para Revisar'
    };

    return categoryMapping[category] || 'Favoritos';
  }

  /**
   * Gerenciamento de cache
   */
  generateCacheKey(text) {
    // Hash simples baseado no texto
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Converter para 32bit
    }
    return hash.toString();
  }

  addToCache(key, value) {
    // Limpar cache se estiver muito grande
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, value);
  }

  /**
   * Limpar cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 Cache de categorização limpo');
  }

  /**
   * Estatísticas do cache
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0
    };
  }

  /**
   * Análise completa do problema
   */
  analyzeComplete(problemText) {
    const category = this.categorizeProblem(problemText);
    const difficulty = this.analyzeDifficulty(problemText);
    const tags = this.generateTags(problemText, category.category);
    const suggestedCollection = this.suggestCollection(category.category, category.confidence);

    return {
      category: category.category,
      confidence: category.confidence,
      difficulty: difficulty.level,
      difficultyDescription: difficulty.description,
      tags,
      suggestedCollection,
      analysis: {
        categoryDetails: category.details,
        difficultyFactors: difficulty
      }
    };
  }
}

// Instância singleton
const categorizationService = new CategorizationService();

module.exports = categorizationService;