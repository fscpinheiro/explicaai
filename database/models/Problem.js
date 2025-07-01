// ExplicaAI - Model de Problemas
// CRUD completo com funcionalidades avançadas

const categorizationService = require('../../services/categorizationService');
const { truncateText, parseIntArray, validateIdArray } = require('../../utils/helpers');

class Problem {
  constructor(database) {
    this.db = database;
  }

  /**
   * Criar novo problema
   */
  async create(data) {
    const { 
      text, 
      explanation, 
      source = 'text', 
      difficulty = null, 
      solvedTime = null, 
      tags = [],
      collectionIds = []
    } = data;
    
    try {
      // Auto-análise se não fornecida
      let finalDifficulty = difficulty;
      let finalTags = Array.isArray(tags) ? tags : [];
      
      if (!difficulty || finalTags.length === 0) {
        const analysis = categorizationService.analyzeComplete(text);
        finalDifficulty = finalDifficulty || analysis.difficulty;
        if (finalTags.length === 0) {
          finalTags = analysis.tags;
        }
      }

      // Inserir problema
      const result = await this.db.run(
        `INSERT INTO problems (text, explanation, source, difficulty_level, solved_time, tags)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [text, explanation, source, finalDifficulty, solvedTime, JSON.stringify(finalTags)]
      );

      const problemId = result.lastID;

      // Adicionar às coleções
      await this.addToCollections(problemId, collectionIds);

      // Log da ação
      await this.logAction('create', problemId, { source, difficulty: finalDifficulty });

      console.log(`💾 Problema criado com ID: ${problemId} - "${truncateText(text)}"`);
      
      return await this.findById(problemId);
    } catch (error) {
      console.error('❌ Erro ao criar problema:', error.message);
      throw error;
    }
  }

  /**
   * Buscar problema por ID
   */
  async findById(id) {
    try {
      const problem = await this.db.get(
        `SELECT p.*, 
         GROUP_CONCAT(c.name) as collection_names,
         GROUP_CONCAT(c.color) as collection_colors,
         GROUP_CONCAT(c.icon) as collection_icons,
         GROUP_CONCAT(c.id) as collection_ids
         FROM problems p
         LEFT JOIN problem_collections pc ON p.id = pc.problem_id
         LEFT JOIN collections c ON pc.collection_id = c.id
         WHERE p.id = ?
         GROUP BY p.id`,
        [id]
      );

      if (!problem) {
        return null;
      }

      return this.formatProblem(problem);
    } catch (error) {
      console.error('❌ Erro ao buscar problema:', error.message);
      throw error;
    }
  }

  /**
   * Listar problemas com filtros avançados
   */
  async findAll(filters = {}) {
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
      offset = 0,
      orderBy = 'created_at',
      orderDirection = 'DESC'
    } = filters;

    let sql = `
      SELECT p.*, 
      GROUP_CONCAT(c.name) as collection_names,
      GROUP_CONCAT(c.color) as collection_colors,
      GROUP_CONCAT(c.icon) as collection_icons,
      GROUP_CONCAT(c.id) as collection_ids
      FROM problems p
      LEFT JOIN problem_collections pc ON p.id = pc.problem_id
      LEFT JOIN collections c ON pc.collection_id = c.id
    `;
    
    const conditions = [];
    const params = [];

    // Filtros
    if (favorite) {
      conditions.push('p.is_favorite = 1');
    }

    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }

    if (source) {
      conditions.push('p.source = ?');
      params.push(source);
    }

    if (difficulty) {
      conditions.push('p.difficulty_level = ?');
      params.push(difficulty);
    }

    if (search) {
      conditions.push('(p.text LIKE ? OR p.explanation LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (collectionId) {
      conditions.push('pc.collection_id = ?');
      params.push(collectionId);
    }

    if (tags && Array.isArray(tags) && tags.length > 0) {
      const tagConditions = tags.map(() => 'p.tags LIKE ?').join(' AND ');
      conditions.push(`(${tagConditions})`);
      tags.forEach(tag => params.push(`%"${tag}"%`));
    }

    if (dateFrom) {
      conditions.push('p.created_at >= ?');
      params.push(dateFrom);
    }

    if (dateTo) {
      conditions.push('p.created_at <= ?');
      params.push(dateTo);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ` GROUP BY p.id ORDER BY p.${orderBy} ${orderDirection}`;

    if (limit) {
      sql += ` LIMIT ${limit}`;
      if (offset) {
        sql += ` OFFSET ${offset}`;
      }
    }

    try {
      const problems = await this.db.all(sql, params);
      return problems.map(problem => this.formatProblem(problem));
    } catch (error) {
      console.error('❌ Erro ao listar problemas:', error.message);
      throw error;
    }
  }

  /**
   * Atualizar problema
   */
  async update(id, data) {
    const { text, explanation, status, tags, difficulty } = data;
    const updates = [];
    const params = [];

    if (text !== undefined) {
      updates.push('text = ?');
      params.push(text);
    }

    if (explanation !== undefined) {
      updates.push('explanation = ?');
      params.push(explanation);
    }

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (tags !== undefined) {
      updates.push('tags = ?');
      params.push(JSON.stringify(Array.isArray(tags) ? tags : []));
    }

    if (difficulty !== undefined) {
      updates.push('difficulty_level = ?');
      params.push(difficulty);
    }

    if (updates.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    try {
      const result = await this.db.run(
        `UPDATE problems SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      if (result.changes === 0) {
        throw new Error('Problema não encontrado');
      }

      await this.logAction('update', id, data);
      console.log(`✏️ Problema atualizado: ID ${id}`);
      
      return await this.findById(id);
    } catch (error) {
      console.error('❌ Erro ao atualizar problema:', error.message);
      throw error;
    }
  }

  /**
   * Excluir problema
   */
  async delete(id) {
    try {
      const problem = await this.findById(id);
      if (!problem) {
        throw new Error('Problema não encontrado');
      }

      console.log('🗑️ [BACKEND] Excluindo problema ID:', id);
      console.log('🗑️ [BACKEND] Coleções do problema:', problem.collection_ids);

      // ✅ NOVA ABORDAGEM: Usar transação para excluir tudo
      await this.db.transaction(async () => {
        // 1. Primeiro remover da tabela problem_collections
        const collectionsResult = await this.db.run(
          'DELETE FROM problem_collections WHERE problem_id = ?', 
          [id]
        );
        console.log('🗑️ [BACKEND] Removido de problem_collections, changes:', collectionsResult.changes);

        // 2. Depois excluir o problema
        const problemResult = await this.db.run('DELETE FROM problems WHERE id = ?', [id]);
        console.log('🗑️ [BACKEND] Problema excluído, changes:', problemResult.changes);
        
        if (problemResult.changes === 0) {
          throw new Error('Erro ao excluir problema');
        }
      });

      await this.logAction('delete', id, { text: problem.text });
      console.log(`🗑️ Problema excluído: ID ${id} - "${truncateText(problem.text)}"`);
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao excluir problema:', error.message);
      throw error;
    }
  }

  /**
   * Toggle favorito
   */
  async toggleFavorite(id) {
    try {
      const problem = await this.db.get('SELECT is_favorite FROM problems WHERE id = ?', [id]);
      
      if (!problem) {
        throw new Error('Problema não encontrado');
      }

      const newFavoriteStatus = problem.is_favorite ? 0 : 1;
      
      await this.db.run(
        'UPDATE problems SET is_favorite = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
        [newFavoriteStatus, id]
      );

      await this.logAction(newFavoriteStatus ? 'favorite' : 'unfavorite', id);
      console.log(`${newFavoriteStatus ? '⭐' : '☆'} Favorito alterado: ID ${id}`);

      return !!newFavoriteStatus;
    } catch (error) {
      console.error('❌ Erro ao alterar favorito:', error.message);
      throw error;
    }
  }

  /**
   * Adicionar problema às coleções
   */
  async addToCollections(problemId, collectionIds) {
    if (!Array.isArray(collectionIds) || collectionIds.length === 0) {
      // Se não especificou coleções, adicionar aos Favoritos
      const favoritesCollection = await this.db.get("SELECT id FROM collections WHERE name = 'Favoritos'");
      if (favoritesCollection) {
        collectionIds = [favoritesCollection.id];
      }
    }

    const validIds = parseIntArray(collectionIds);
    
    for (const collectionId of validIds) {
      try {
        await this.db.run(
          'INSERT OR IGNORE INTO problem_collections (problem_id, collection_id) VALUES (?, ?)',
          [problemId, collectionId]
        );
      } catch (error) {
        console.error(`⚠️ Erro ao adicionar à coleção ${collectionId}:`, error.message);
      }
    }

    if (validIds.length > 0) {
      await this.logAction('add_to_collections', problemId, { collectionIds: validIds });
      console.log(`📚 Problema ${problemId} adicionado a ${validIds.length} coleção(ões)`);
    }
  }

  /**
   * Remover problema de coleções específicas
   */
  async removeFromCollections(problemId, collectionIds) {
    const validIds = parseIntArray(collectionIds);
    
    for (const collectionId of validIds) {
      try {
        await this.db.run(
          'DELETE FROM problem_collections WHERE problem_id = ? AND collection_id = ?',
          [problemId, collectionId]
        );
      } catch (error) {
        console.error(`⚠️ Erro ao remover da coleção ${collectionId}:`, error.message);
      }
    }

    await this.logAction('remove_from_collections', problemId, { collectionIds: validIds });
    console.log(`📚 Problema ${problemId} removido de ${validIds.length} coleção(ões)`);
  }

  /**
   * Atualizar coleções do problema (substitui todas)
   */
  async updateCollections(problemId, collectionIds) {
    try {
      await this.db.transaction(async () => {
        // Remover todas as coleções atuais
        await this.db.run(
          'DELETE FROM problem_collections WHERE problem_id = ?',
          [problemId]
        );

        // Adicionar novas coleções
        await this.addToCollections(problemId, collectionIds);
      });

      console.log(`🔄 Coleções do problema ${problemId} atualizadas`);
    } catch (error) {
      console.error('❌ Erro ao atualizar coleções:', error.message);
      throw error;
    }
  }

  /**
   * Migrar problemas quando coleção é excluída
   */
  async migrateFromDeletedCollection(deletedCollectionId) {
    try {
      // Buscar coleção Favoritos
      const favoritesCollection = await this.db.get("SELECT id FROM collections WHERE name = 'Favoritos'");
      
      if (!favoritesCollection) {
        throw new Error('Coleção Favoritos não encontrada');
      }

      // Migrar problemas órfãos para Favoritos
      const result = await this.db.run(
        `UPDATE problem_collections 
         SET collection_id = ? 
         WHERE collection_id = ? 
         AND problem_id NOT IN (
           SELECT DISTINCT problem_id 
           FROM problem_collections 
           WHERE collection_id = ?
         )`,
        [favoritesCollection.id, deletedCollectionId, favoritesCollection.id]
      );

      console.log(`🔄 ${result.changes} problemas migrados para Favoritos`);
      return result.changes;
    } catch (error) {
      console.error('❌ Erro na migração:', error.message);
      throw error;
    }
  }

  /**
   * Buscar problemas similares baseado em tags
   */
  async findSimilar(problemId, limit = 5) {
    try {
      const problem = await this.findById(problemId);
      if (!problem || !problem.tags || problem.tags.length === 0) {
        return [];
      }

      const tagConditions = problem.tags.map(() => 'tags LIKE ?').join(' OR ');
      const params = [];
      problem.tags.forEach(tag => params.push(`%"${tag}"%`));
      params.push(problemId, limit);

      const similar = await this.db.all(
        `SELECT id, text, tags, difficulty_level, created_at
         FROM problems 
         WHERE (${tagConditions}) AND id != ?
         ORDER BY created_at DESC 
         LIMIT ?`,
        params
      );

      return similar.map(p => ({
        ...p,
        tags: p.tags ? JSON.parse(p.tags) : []
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar similares:', error.message);
      throw error;
    }
  }

  /**
   * Estatísticas do problema
   */
  async getStats(problemId) {
    try {
      const problem = await this.findById(problemId);
      if (!problem) {
        throw new Error('Problema não encontrado');
      }

      const similar = await this.findSimilar(problemId);
      const collections = problem.collections || [];

      return {
        id: problemId,
        difficulty: problem.difficulty_level,
        collections: collections.length,
        tags: (problem.tags || []).length,
        similar: similar.length,
        created: problem.created_at,
        updated: problem.updated_at,
        isFavorite: !!problem.is_favorite
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error.message);
      throw error;
    }
  }

  /**
   * Formatar problema para resposta
   */
  formatProblem(problem) {
    return {
      ...problem,
      tags: problem.tags ? JSON.parse(problem.tags) : [],
      collections: problem.collection_names ? problem.collection_names.split(',') : [],
      collection_colors: problem.collection_colors ? problem.collection_colors.split(',') : [],
      collection_icons: problem.collection_icons ? problem.collection_icons.split(',') : [],
      collection_ids: problem.collection_ids ? problem.collection_ids.split(',').map(id => parseInt(id)) : [],
      is_favorite: !!problem.is_favorite
    };
  }

  /**
   * Registrar ação no histórico
   */
  async logAction(action, problemId, details = {}) {
    try {
      await this.db.run(
        'INSERT INTO history_log (action, problem_id, details) VALUES (?, ?, ?)',
        [action, problemId, JSON.stringify(details)]
      );
    } catch (error) {
      console.error('❌ Erro ao registrar histórico:', error.message);
    }
  }

  /**
   * Contar problemas por critério
   */
  async count(filters = {}) {
    const { favorite, status, collectionId, source, difficulty } = filters;
    
    let sql = 'SELECT COUNT(DISTINCT p.id) as count FROM problems p';
    const conditions = [];
    const params = [];

    if (collectionId) {
      sql += ' LEFT JOIN problem_collections pc ON p.id = pc.problem_id';
      conditions.push('pc.collection_id = ?');
      params.push(collectionId);
    }

    if (favorite) {
      conditions.push('p.is_favorite = 1');
    }

    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }

    if (source) {
      conditions.push('p.source = ?');
      params.push(source);
    }

    if (difficulty) {
      conditions.push('p.difficulty_level = ?');
      params.push(difficulty);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    try {
      const result = await this.db.get(sql, params);
      return result.count;
    } catch (error) {
      console.error('❌ Erro ao contar problemas:', error.message);
      throw error;
    }
  }
}

module.exports = Problem;