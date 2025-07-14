// ExplicaAI - Routes de Problemas
// Endpoints organizados para CRUD de problemas

const express = require('express');
const router = express.Router();

//const { asyncHandler, validateInput, checkDatabaseConnection } = require('../middleware/errorHandler');
const { asyncHandler, validateInput, checkDatabaseConnection } = require('../middleware/errorHandle');
const { successResponse, errorResponse, validateProblemText, validateIdArray } = require('../utils/helpers');

// Middleware para todas as rotas de problemas
router.use(checkDatabaseConnection);

/**
 * GET /api/problems
 * Listar problemas com filtros
 */
router.get('/', asyncHandler(async (req, res) => {
  const {
    favorite,
    status,
    search,
    collectionId,
    source,
    difficulty,
    tags,
    dateFrom,
    dateTo,
    limit = 20,
    page = 1
  } = req.query;

  const filters = {
    favorite: favorite === 'true',
    status,
    search,
    collectionId: collectionId ? parseInt(collectionId) : null,
    source,
    difficulty: difficulty ? parseInt(difficulty) : null,
    tags: tags ? tags.split(',') : null,
    dateFrom,
    dateTo,
    limit: Math.min(parseInt(limit) || 20, 100), // Máximo 100
    offset: (parseInt(page) - 1) * parseInt(limit) || 0
  };

  const problems = await req.db.Problem.findAll(filters);
  const total = await req.db.Problem.count(filters);

  res.json(successResponse({
    problems,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    }
  }));
}));

/**
 * POST /api/problems
 * Criar novo problema
 */
router.post('/', 
  validateInput({
    required: ['text', 'explanation'],
    maxLength: { text: 1000, explanation: 5000 }
  }),
  asyncHandler(async (req, res) => {
    const { text, explanation, source, difficulty, solvedTime, tags, collectionIds } = req.body;

    // Validar texto
    const textValidation = validateProblemText(text);
    if (!textValidation.valid) {
      return res.status(400).json(errorResponse(textValidation.error, null, 400));
    }

    // Validar IDs de coleções se fornecidos
    if (collectionIds) {
      const idsValidation = validateIdArray(collectionIds);
      if (!idsValidation.valid) {
        return res.status(400).json(errorResponse(idsValidation.error, null, 400));
      }
    }

    const problemData = {
      text: textValidation.text,
      explanation: explanation.trim(),
      source: source || 'text',
      difficulty: difficulty ? parseInt(difficulty) : null,
      solvedTime: solvedTime ? parseInt(solvedTime) : null,
      tags: tags || [],
      collectionIds: collectionIds || []
    };

    const problem = await req.db.Problem.create(problemData);

    res.status(201).json(successResponse({
      problem
    }, 'Problema criado com sucesso!'));
  })
);

/**
 * GET /api/problems/:id
 * Buscar problema específico
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json(errorResponse('ID inválido', null, 400));
  }

  const problem = await req.db.Problem.findById(id);
  
  if (!problem) {
    return res.status(404).json(errorResponse('Problema não encontrado', null, 404));
  }
  
  // Buscar problemas similares
  const similar = await req.db.Problem.findSimilar(id, 3);
  
  res.json(successResponse({
    problem,
    similar
  }));
}));

/**
 * PUT /api/problems/:id
 * Atualizar problema
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json(errorResponse('ID inválido', null, 400));
  }

  const { text, explanation, status, tags, difficulty } = req.body;
  const updateData = {};

  if (text !== undefined) {
    const textValidation = validateProblemText(text);
    if (!textValidation.valid) {
      return res.status(400).json(errorResponse(textValidation.error, null, 400));
    }
    updateData.text = textValidation.text;
  }

  if (explanation !== undefined) {
    if (!explanation || explanation.trim().length === 0) {
      return res.status(400).json(errorResponse('Explicação não pode estar vazia', null, 400));
    }
    updateData.explanation = explanation.trim();
  }

  if (status !== undefined) {
    const validStatuses = ['resolved', 'studying', 'review'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json(errorResponse('Status inválido', null, 400));
    }
    updateData.status = status;
  }

  if (tags !== undefined) {
    updateData.tags = Array.isArray(tags) ? tags : [];
  }

  if (difficulty !== undefined) {
    const diff = parseInt(difficulty);
    if (isNaN(diff) || diff < 1 || diff > 5) {
      return res.status(400).json(errorResponse('Dificuldade deve ser entre 1 e 5', null, 400));
    }
    updateData.difficulty = diff;
  }

  const problem = await req.db.Problem.update(id, updateData);
  
  res.json(successResponse({
    problem
  }, 'Problema atualizado com sucesso!'));
}));

/**
 * DELETE /api/problems/:id
 * Excluir problema
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json(errorResponse('ID inválido', null, 400));
  }

  await req.db.Problem.delete(id);
  
  res.json(successResponse({
    deleted: true
  }, 'Problema excluído com sucesso!'));
}));

/**
 * PUT /api/problems/:id/favorite
 * Toggle favorito
 */
router.put('/:id/favorite', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json(errorResponse('ID inválido', null, 400));
  }

  const isFavorite = await req.db.Problem.toggleFavorite(id);
  
  res.json(successResponse({
    isFavorite,
    message: isFavorite ? 'Adicionado aos favoritos!' : 'Removido dos favoritos!'
  }));
}));

/**
 * POST /api/problems/:id/collections
 * Adicionar problema às coleções
 */
router.post('/:id/collections', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { collectionIds } = req.body;
  
  if (isNaN(id)) {
    return res.status(400).json(errorResponse('ID inválido', null, 400));
  }

  const idsValidation = validateIdArray(collectionIds);
  if (!idsValidation.valid) {
    return res.status(400).json(errorResponse(idsValidation.error, null, 400));
  }

  await req.db.Problem.addToCollections(id, idsValidation.ids);
  
  res.json(successResponse({
    added: idsValidation.ids.length
  }, `Problema adicionado a ${idsValidation.ids.length} coleção(ões)!`));
}));

/**
 * DELETE /api/problems/:id/collections
 * Remover problema de coleções
 */
router.delete('/:id/collections', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { collectionIds } = req.body;
  
  if (isNaN(id)) {
    return res.status(400).json(errorResponse('ID inválido', null, 400));
  }

  const idsValidation = validateIdArray(collectionIds);
  if (!idsValidation.valid) {
    return res.status(400).json(errorResponse(idsValidation.error, null, 400));
  }

  await req.db.Problem.removeFromCollections(id, idsValidation.ids);
  
  res.json(successResponse({
    removed: idsValidation.ids.length
  }, `Problema removido de ${idsValidation.ids.length} coleção(ões)!`));
}));

/**
 * PUT /api/problems/:id/collections
 * Atualizar coleções do problema (substitui todas)
 */
router.put('/:id/collections', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { collectionIds } = req.body;
  
  if (isNaN(id)) {
    return res.status(400).json(errorResponse('ID inválido', null, 400));
  }

  const idsValidation = validateIdArray(collectionIds || []);
  if (!idsValidation.valid) {
    return res.status(400).json(errorResponse(idsValidation.error, null, 400));
  }

  await req.db.Problem.updateCollections(id, idsValidation.ids);
  
  const updatedProblem = await req.db.Problem.findById(id);
  
  res.json(successResponse({
    problem: updatedProblem
  }, 'Coleções do problema atualizadas!'));
}));

/**
 * GET /api/problems/:id/similar
 * Buscar problemas similares
 */
router.get('/:id/similar', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const limit = Math.min(parseInt(req.query.limit) || 5, 20);
  
  if (isNaN(id)) {
    return res.status(400).json(errorResponse('ID inválido', null, 400));
  }

  const similar = await req.db.Problem.findSimilar(id, limit);
  
  res.json(successResponse({
    similar,
    count: similar.length
  }));
}));

/**
 * GET /api/problems/:id/stats
 * Estatísticas do problema
 */
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json(errorResponse('ID inválido', null, 400));
  }

  const stats = await req.db.Problem.getStats(id);
  
  res.json(successResponse({
    stats
  }));
}));

/**
 * GET /api/problems/search/advanced
 * Busca avançada de problemas
 */
router.get('/search/advanced', asyncHandler(async (req, res) => {
  const {
    q, // query geral
    tags,
    difficulty_min,
    difficulty_max,
    source,
    date_from,
    date_to,
    collection,
    sort = 'created_at',
    order = 'desc',
    limit = 20
  } = req.query;

  const filters = {
    search: q,
    tags: tags ? tags.split(',') : null,
    difficulty: difficulty_min && difficulty_max ? null : (difficulty_min || difficulty_max),
    source,
    dateFrom: date_from,
    dateTo: date_to,
    collectionId: collection ? parseInt(collection) : null,
    limit: Math.min(parseInt(limit) || 20, 100),
    orderBy: sort,
    orderDirection: order.toUpperCase()
  };

  // Filtro de dificuldade por range
  if (difficulty_min && difficulty_max) {
    // Implementar filtro de range na query
    filters.difficultyRange = {
      min: parseInt(difficulty_min),
      max: parseInt(difficulty_max)
    };
  }

  const problems = await req.db.Problem.findAll(filters);
  
  res.json(successResponse({
    problems,
    query: q,
    filters: {
      tags: filters.tags,
      difficulty: filters.difficulty,
      source: filters.source,
      collection: filters.collectionId
    },
    count: problems.length
  }));
}));

/**
 * POST /api/problems/explain-text
 * Explicar problema, salvar automaticamente com resposta
 */
router.post('/explain-text', 
  validateInput({
    required: ['text'],
    maxLength: { text: 1000 }
  }),
  asyncHandler(async (req, res) => {
    const { text, type = 'detailed', collectionIds } = req.body;

    console.log('🚨 CHEGOU NA FUNÇÃO /explain-text!');
    console.log('🚨 Type recebido:', type);
    console.log('🚨 Text recebido:', text);

    // Validar texto
    const textValidation = validateProblemText(text);
    if (!textValidation.valid) {
      return res.status(400).json(errorResponse(textValidation.error, null, 400));
    }

    try {
      // Verificar se Ollama está rodando
      const ollamaService = require('../services/ollamaService');
      const ollamaStatus = await ollamaService.checkStatus();
      if (!ollamaStatus) {
        return res.status(503).json(errorResponse(
          'Ollama offline',
          'Execute: ollama serve',
          503
        ));
      }

      // Auto-categorização
      const categorizationService = require('../services/categorizationService');
      const analysis = categorizationService.analyzeComplete(textValidation.text);

      // ✅ USAR NOVOS MÉTODOS DO OLLAMA SERVICE
      let explanation;
      console.log('🔍 [BACKEND] Decidindo tipo de explicação:', type);

      if (type === 'brief') {
        console.log('🔍 [BACKEND] ✅ USANDO explainMathBrief (ainda não implementado)');
        explanation = await ollamaService.explainMath(textValidation.text); // Usar structured por enquanto
      } else if (type === 'answer') {
        console.log('🔍 [BACKEND] ✅ USANDO explainMathAnswerOnly');
        explanation = await ollamaService.explainMathAnswerOnly(textValidation.text);
      } else {
        console.log('🔍 [BACKEND] ✅ USANDO explainMath (detailed structured)');
        explanation = await ollamaService.explainMath(textValidation.text);
      }

      console.log('🔍 [BACKEND] Resposta recebida do Gemma:', explanation.response.substring(0, 100) + '...');

      // Definir coleções (auto-sugestão se não especificado)
      let finalCollectionIds = collectionIds || [];
      if (finalCollectionIds.length === 0) {
        const suggestedCollection = await req.db.get(
          "SELECT id FROM collections WHERE name = ?",
          [analysis.suggestedCollection]
        );
        if (suggestedCollection) {
          finalCollectionIds = [suggestedCollection.id];
        } else {
          const favoriteCollection = await req.db.get(
            "SELECT id FROM collections WHERE name = 'Favoritos'"
          );
          finalCollectionIds = favoriteCollection ? [favoriteCollection.id] : [];
        }
      }

      // Salvar problema com explicação
      const problemData = {
        text: textValidation.text,
        explanation: explanation.response,
        source: 'text',
        difficulty: analysis.difficulty,
        solvedTime: explanation.elapsedTime,
        tags: analysis.tags,
        collectionIds: finalCollectionIds
      };

      const savedProblem = await req.db.Problem.create(problemData);

      console.log(`✅ Problema explicado e salvo: ID ${savedProblem.id}`);

      res.json(successResponse({
        problem: savedProblem,
        explanation: explanation.response,
        analysisType: type,
        processingTime: explanation.elapsedTime,
        autoCategory: {
          suggested: analysis.suggestedCollection,
          confidence: analysis.confidence,
          difficulty: analysis.difficulty,
          tags: analysis.tags
        }
      }, `Problema ${type === 'brief' ? 'resumido' : type === 'answer' ? 'respondido' : 'explicado passo a passo'} e salvo!`));

    } catch (error) {
      console.error('❌ Erro ao explicar problema:', error.message);
      res.status(500).json(errorResponse(
        'Erro ao processar problema',
        error.message,
        500
      ));
    }
  })
);

/**
 * POST /api/problems/teste-ola-mundo
 * TESTE: Endpoint para debug
 */
router.post('/so-resposta', asyncHandler(async (req, res) => {
  
  try {
    const ollamaService = require('../services/ollamaService');
    const resultado = await ollamaService.soResposta(req.body.problem);
    
    res.json({
      success: true,
      explanation: resultado.response,
      processingTime: resultado.elapsedTime
    });
  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({ error: error.message });
  }
}));

/**
 * POST /api/problems/generate-similar
 * Gerar problemas similares baseado em um texto
 */
router.post('/generate-similar',
  validateInput({
    required: ['text'],
    maxLength: { text: 1000 }
  }),
  asyncHandler(async (req, res) => {
    const { text } = req.body;

    // Validar texto
    const textValidation = validateProblemText(text);
    if (!textValidation.valid) {
      return res.status(400).json(errorResponse(textValidation.error, null, 400));
    }

    try {
      // Verificar se Ollama está rodando
      const ollamaService = require('../services/ollamaService');
      const ollamaStatus = await ollamaService.checkStatus();
      if (!ollamaStatus) {
        return res.status(503).json(errorResponse(
          'Ollama offline',
          'Execute: ollama serve',
          503
        ));
      }

      // Gerar similares com Gemma
      const result = await ollamaService.generateSimilar(textValidation.text);

      // Log da ação
      await req.db.run(
        'INSERT INTO history_log (action, problem_id, details) VALUES (?, ?, ?)',
        ['generate_similar', null, JSON.stringify({ 
          originalText: textValidation.text,
          processingTime: result.elapsedTime 
        })]
      );

      console.log(`🎯 Problemas similares gerados para: "${textValidation.text.substring(0, 50)}..."`);

      res.json(successResponse({
        originalProblem: textValidation.text,
        similarProblems: result.response,
        processingTime: result.elapsedTime,
        count: 3 // Assumindo que o Gemma retorna 3 exercícios
      }, 'Problemas similares gerados com sucesso!'));

    } catch (error) {
      console.error('❌ Erro ao gerar similares:', error.message);
      res.status(500).json(errorResponse(
        'Erro ao gerar problemas similares',
        error.message,
        500
      ));
    }
  })
);

/**
 * GET /api/problems/history
 * Histórico de problemas com data/hora
 */
router.get('/history', asyncHandler(async (req, res) => {
  const { 
    limit = 20, 
    page = 1,
    type = 'all' // 'all', 'solved', 'similar_generated'
  } = req.query;

  try {
    let sql = `
      SELECT 
        p.id,
        p.text,
        p.created_at,
        p.source,
        p.difficulty_level,
        p.is_favorite,
        GROUP_CONCAT(c.name) as collection_names,
        GROUP_CONCAT(c.icon) as collection_icons
      FROM problems p
      LEFT JOIN problem_collections pc ON p.id = pc.problem_id
      LEFT JOIN collections c ON pc.collection_id = c.id
    `;

    const conditions = [];
    const params = [];

    if (type === 'solved') {
      conditions.push("p.explanation IS NOT NULL");
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ` 
      GROUP BY p.id 
      ORDER BY p.created_at DESC 
      LIMIT ? OFFSET ?
    `;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const problems = await req.db.all(sql, params);

    // Buscar também ações do histórico
    const historyActions = await req.db.all(`
      SELECT 
        action,
        created_at,
        details
      FROM history_log
      WHERE action IN ('create', 'generate_similar')
      ORDER BY created_at DESC
      LIMIT ?
    `, [parseInt(limit)]);

    res.json(successResponse({
      problems: problems.map(p => ({
        ...p,
        collections: p.collection_names ? p.collection_names.split(',') : [],
        collection_icons: p.collection_icons ? p.collection_icons.split(',') : [],
        is_favorite: !!p.is_favorite
      })),
      history: historyActions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: problems.length
      }
    }));

  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error.message);
    res.status(500).json(errorResponse(
      'Erro ao buscar histórico',
      error.message,
      500
    ));
  }
}));

module.exports = router;