// ExplicaAI - Routes de Coleções
// CRUD completo com migração automática

const express = require('express');
const router = express.Router();

const { asyncHandler, validateInput, checkDatabaseConnection } = require('../middleware/errorHandler');
const { successResponse, errorResponse, generateRandomColor, generateRandomIcon } = require('../utils/helpers');

// Middleware para todas as rotas de coleções
router.use(checkDatabaseConnection);

/**
 * GET /api/collections
 * Listar todas as coleções
 */
router.get('/', asyncHandler(async (req, res) => {
  const {
    include_system = 'true',
    sort = 'is_system DESC, name ASC',
    limit
  } = req.query;

  const options = {
    includeSystem: include_system === 'true',
    orderBy: sort,
    limit: limit ? Math.min(parseInt(limit), 100) : null
  };

  const collections = await req.db.Collection.findAll(options);
  
  res.json(successResponse({
    collections,
    total: collections.length
  }));
}));

/**
 * POST /api/collections
 * Criar nova coleção
 */
router.post('/',
  validateInput({
    required: ['name'],
    maxLength: { name: 100, description: 500 }
  }),
  asyncHandler(async (req, res) => {
    const { name, description, color, icon } = req.body;

    const collectionData = {
      name: name.trim(),
      description: description ? description.trim() : '',
      color: color || generateRandomColor(),
      icon: icon || generateRandomIcon()
    };

    const collection = await req.db.Collection.create(collectionData);

    res.status(201).json(successResponse({
      collection
    }, `Coleção '${name}' criada com sucesso!`));
  })
);

/**
 * GET /api/collections/:id
 * Buscar coleção específica
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json(errorResponse('ID inválido', null, 400));
  }

  const collection = await req.db.Collection.findById(id);
  
  if (!collection) {
    return res.status(404).json(errorResponse('Coleção não encontrada', null, 404));
  }
  
  res.json(successResponse({
    collection
  }));
}));

/**
 * PUT /api/collections/:id
 * Atualizar coleção
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json(errorResponse('ID inválido', null, 400));
  }

  const { name, description, color, icon } = req.body;
  const updateData = {};

  if (name !== undefined) {
    if (!name || name.trim().length === 0) {
      return res.status(400).json(errorResponse('Nome é obrigatório', null, 400));
    }
    if (name.trim().length > 100) {
      return res.status(400).json(errorResponse('Nome deve ter no máximo 100 caracteres', null, 400));
    }
    updateData.name = name.trim();
  }

  if (description !== undefined) {
    if (description && description.length > 500) {
      return res.status(400).json(errorResponse('Descrição deve ter no máximo 500 caracteres', null, 400));
    }
    updateData.description = description ? description.trim() : '';
  }

  if (color !== undefined) {
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return res.status(400).json(errorResponse('Cor deve estar no formato hexadecimal (#RRGGBB)', null, 400));
    }
    updateData.color = color;
  }

  if (icon !== undefined) {
    updateData.icon = icon;
  }

  const collection = await req.db.Collection.update(id, updateData);
  
  res.json(successResponse({
    collection
  }, 'Coleção atualizada com sucesso!'));
}));

/**
 * DELETE /api/collections/:id
 * Excluir coleção com migração automática
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json(errorResponse('ID inválido', null, 400));
  }

  const result = await req.db.Collection.delete(id);
  
  res.json(successResponse({
    deleted: result.deleted,
    problemsMigrated: result.problemsMigrated
  }, `Coleção excluída com sucesso! ${result.problemsMigrated} problemas migrados para Favoritos.`));
}));

/**
 * GET /api/collections/:id/problems
 * Buscar problemas de uma coleção
 */
router.get('/:id/problems', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json(errorResponse('ID inválido', null, 400));
  }

  const {
    limit = 20,
    page = 1,
    sort = 'added_at DESC'
  } = req.query;

  // Verificar se coleção existe
  const collection = await req.db.Collection.findById(id);
  if (!collection) {
    return res.status(404).json(errorResponse('Coleção não encontrada', null, 404));
  }

  const options = {
    limit: Math.min(parseInt(limit), 100),
    offset: (parseInt(page) - 1) * parseInt(limit),
    orderBy: sort
  };

  const problems = await req.db.Collection.getProblems(id, options);
  
  res.json(successResponse({
    collection: {
      id: collection.id,
      name: collection.name,
      icon: collection.icon,
      color: collection.color
    },
    problems,
    pagination: {
      total: collection.problem_count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(collection.problem_count / parseInt(limit))
    }
  }));
}));

/**
 * GET /api/collections/:id/stats
 * Estatísticas de uma coleção
 */
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json(errorResponse('ID inválido', null, 400));
  }

  const stats = await req.db.Collection.getStats(id);
  
  res.json(successResponse({
    stats
  }));
}));

/**
 * POST /api/collections/:id/duplicate
 * Duplicar coleção
 */
router.post('/:id/duplicate', 
  validateInput({
    required: ['name'],
    maxLength: { name: 100 }
  }),
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const { name } = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json(errorResponse('ID inválido', null, 400));
    }

    const duplicatedCollection = await req.db.Collection.duplicate(id, name.trim());
    
    res.status(201).json(successResponse({
      collection: duplicatedCollection
    }, `Coleção duplicada como '${name}'!`));
  })
);

/**
 * GET /api/collections/popular
 * Coleções mais populares
 */
router.get('/popular', asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 5, 20);
  
  const collections = await req.db.Collection.getPopular(limit);
  
  res.json(successResponse({
    collections,
    count: collections.length
  }));
}));

/**
 * GET /api/collections/system
 * Listar apenas coleções do sistema
 */
router.get('/system', asyncHandler(async (req, res) => {
  const collections = await req.db.Collection.findAll({
    includeSystem: true,
    orderBy: 'name ASC'
  });

  const systemCollections = collections.filter(c => c.is_system);
  
  res.json(successResponse({
    collections: systemCollections,
    count: systemCollections.length
  }));
}));

/**
 * GET /api/collections/user
 * Listar apenas coleções do usuário
 */
router.get('/user', asyncHandler(async (req, res) => {
  const collections = await req.db.Collection.findAll({
    includeSystem: false,
    orderBy: 'created_at DESC'
  });
  
  res.json(successResponse({
    collections,
    count: collections.length
  }));
}));

/**
 * POST /api/collections/batch
 * Criar múltiplas coleções
 */
router.post('/batch',
  validateInput({
    required: ['collections']
  }),
  asyncHandler(async (req, res) => {
    const { collections } = req.body;

    if (!Array.isArray(collections) || collections.length === 0) {
      return res.status(400).json(errorResponse('Lista de coleções inválida', null, 400));
    }

    if (collections.length > 10) {
      return res.status(400).json(errorResponse('Máximo 10 coleções por vez', null, 400));
    }

    const createdCollections = [];
    const errors = [];

    for (let i = 0; i < collections.length; i++) {
      try {
        const collectionData = collections[i];
        
        if (!collectionData.name || collectionData.name.trim().length === 0) {
          errors.push(`Coleção ${i + 1}: Nome é obrigatório`);
          continue;
        }

        const newCollection = await req.db.Collection.create({
          name: collectionData.name.trim(),
          description: collectionData.description || '',
          color: collectionData.color || generateRandomColor(),
          icon: collectionData.icon || generateRandomIcon()
        });

        createdCollections.push(newCollection);
      } catch (error) {
        errors.push(`Coleção ${i + 1}: ${error.message}`);
      }
    }

    res.status(201).json(successResponse({
      created: createdCollections,
      errors: errors.length > 0 ? errors : null,
      summary: {
        total: collections.length,
        created: createdCollections.length,
        failed: errors.length
      }
    }, `${createdCollections.length} coleção(ões) criada(s) com sucesso!`));
  })
);

/**
 * PUT /api/collections/batch
 * Atualizar múltiplas coleções
 */
router.put('/batch', asyncHandler(async (req, res) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json(errorResponse('Lista de atualizações inválida', null, 400));
  }

  if (updates.length > 20) {
    return res.status(400).json(errorResponse('Máximo 20 atualizações por vez', null, 400));
  }

  const results = [];
  const errors = [];

  for (const update of updates) {
    try {
      const { id, ...updateData } = update;
      
      if (!id || isNaN(parseInt(id))) {
        errors.push(`ID inválido: ${id}`);
        continue;
      }

      const updatedCollection = await req.db.Collection.update(parseInt(id), updateData);
      results.push(updatedCollection);
    } catch (error) {
      errors.push(`ID ${update.id}: ${error.message}`);
    }
  }

  res.json(successResponse({
    updated: results,
    errors: errors.length > 0 ? errors : null,
    summary: {
      total: updates.length,
      updated: results.length,
      failed: errors.length
    }
  }, `${results.length} coleção(ões) atualizada(s)!`));
}));

/**
 * DELETE /api/collections/batch
 * Excluir múltiplas coleções
 */
router.delete('/batch', asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json(errorResponse('Lista de IDs inválida', null, 400));
  }

  if (ids.length > 10) {
    return res.status(400).json(errorResponse('Máximo 10 exclusões por vez', null, 400));
  }

  const results = [];
  const errors = [];
  let totalMigrated = 0;

  for (const id of ids) {
    try {
      const numId = parseInt(id);
      
      if (isNaN(numId)) {
        errors.push(`ID inválido: ${id}`);
        continue;
      }

      const result = await req.db.Collection.delete(numId);
      results.push({ id: numId, deleted: result.deleted });
      totalMigrated += result.problemsMigrated;
    } catch (error) {
      errors.push(`ID ${id}: ${error.message}`);
    }
  }

  res.json(successResponse({
    deleted: results,
    errors: errors.length > 0 ? errors : null,
    summary: {
      total: ids.length,
      deleted: results.length,
      failed: errors.length,
      totalProblemsMigrated: totalMigrated
    }
  }, `${results.length} coleção(ões) excluída(s)! ${totalMigrated} problemas migrados.`));
}));

/**
 * GET /api/collections/search
 * Buscar coleções por nome
 */
router.get('/search', asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;

  if (!q || q.trim().length === 0) {
    return res.status(400).json(errorResponse('Query de busca é obrigatória', null, 400));
  }

  const collections = await req.db.Collection.findAll({
    includeSystem: true
  });

  const filtered = collections.filter(collection =>
    collection.name.toLowerCase().includes(q.toLowerCase()) ||
    (collection.description && collection.description.toLowerCase().includes(q.toLowerCase()))
  ).slice(0, Math.min(parseInt(limit), 50));

  res.json(successResponse({
    collections: filtered,
    query: q,
    count: filtered.length
  }));
}));

/**
 * GET /api/collections/:id/export
 * Exportar coleção com problemas
 */
router.get('/:id/export', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { format = 'json' } = req.query;
  
  if (isNaN(id)) {
    return res.status(400).json(errorResponse('ID inválido', null, 400));
  }

  const collection = await req.db.Collection.findById(id);
  if (!collection) {
    return res.status(404).json(errorResponse('Coleção não encontrada', null, 404));
  }

  const problems = await req.db.Collection.getProblems(id, { limit: 1000 });
  const stats = await req.db.Collection.getStats(id);

  const exportData = {
    collection: {
      name: collection.name,
      description: collection.description,
      color: collection.color,
      icon: collection.icon,
      created_at: collection.created_at
    },
    problems: problems.map(p => ({
      text: p.text,
      explanation: p.explanation,
      difficulty_level: p.difficulty_level,
      tags: p.tags,
      created_at: p.created_at
    })),
    stats,
    exported_at: new Date().toISOString(),
    total_problems: problems.length
  };

  if (format === 'json') {
    res.setHeader('Content-Disposition', `attachment; filename="${collection.name}_export.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(exportData);
  } else {
    res.json(successResponse({
      export: exportData
    }));
  }
}));

module.exports = router;