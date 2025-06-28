// ExplicaAI - Routes de Problemas
// Endpoints organizados para CRUD de problemas

const express = require('express');
const router = express.Router();

const { asyncHandler, validateInput, checkDatabaseConnection } = require('../middleware/errorHandler');
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

module.exports = router;