// ExplicaAI - Model de Coleções
// CRUD completo com migração automática e validações

const { generateRandomColor, generateRandomIcon, truncateText } = require('../../utils/helpers');

class Collection {
  constructor(database) {
    this.db = database;
  }

  /**
   * Criar coleções padrão do sistema
   */
  async createDefaultCollections() {
    const defaultCollections = [
      {
        name: 'Favoritos',
        description: 'Problemas marcados como favoritos',
        color: '#FF6B6B',
        icon: '⭐',
        is_default: 1,
        is_system: 1
      },
      {
        name: 'Álgebra Básica',
        description: 'Equações lineares, quadráticas e sistemas',
        color: '#4ECDC4',
        icon: '🔢',
        is_system: 1
      },
      {
        name: 'Geometria',
        description: 'Áreas, volumes e teoremas geométricos',
        color: '#45B7D1',
        icon: '📐',
        is_system: 1
      },
      {
        name: 'Funções',
        description: 'Funções lineares, quadráticas e trigonométricas',
        color: '#96CEB4',
        icon: '📊',
        is_system: 1
      },
      {
        name: 'Preparação ENEM',
        description: 'Problemas típicos do ENEM e vestibulares',
        color: '#FFEAA7',
        icon: '🎯',
        is_system: 1
      },
      {
        name: 'Para Revisar',
        description: 'Problemas que precisam ser revistos',
        color: '#DDA0DD',
        icon: '🔄',
        is_system: 1
      }
    ];

    for (const collection of defaultCollections) {
      try {
        await this.db.run(
          `INSERT OR IGNORE INTO collections (name, description, color, icon, is_default, is_system) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [collection.name, collection.description, collection.color, collection.icon, collection.is_default, collection.is_system]
        );
      } catch (error) {
        console.log(`📚 Coleção '${collection.name}' já existe`);
      }
    }

    console.log('📚 Coleções padrão verificadas/criadas');
  }

  /**
   * Criar nova coleção
   */
  async create(data) {
    const { 
      name, 
      description = '', 
      color = null, 
      icon = null,
      is_system = 0 
    } = data;

    // Validações
    if (!name || name.trim().length === 0) {
      throw new Error('Nome da coleção é obrigatório');
    }

    if (name.trim().length > 100) {
      throw new Error('Nome da coleção deve ter no máximo 100 caracteres');
    }

    if (description && description.length > 500) {
      throw new Error('Descrição deve ter no máximo 500 caracteres');
    }

    // Verificar se já existe
    const existing = await this.findByName(name.trim());
    if (existing) {
      throw new Error('Já existe uma coleção com este nome');
    }

    const finalColor = color || generateRandomColor();
    const finalIcon = icon || generateRandomIcon();

    try {
      const result = await this.db.run(
        `INSERT INTO collections (name, description, color, icon, is_system) 
         VALUES (?, ?, ?, ?, ?)`,
        [name.trim(), description.trim(), finalColor, finalIcon, is_system]
      );

      await this.logAction('create_collection', result.lastID, { name, color: finalColor, icon: finalIcon });
      console.log(`📁 Coleção criada: "${name}" (ID: ${result.lastID})`);
      
      return await this.findById(result.lastID);
    } catch (error) {
      console.error('❌ Erro ao criar coleção:', error.message);
      throw error;
    }
  }

  /**
   * Buscar coleção por ID
   */
  async findById(id) {
    try {
      const collection = await this.db.get(
        `SELECT c.*, COUNT(pc.problem_id) as problem_count
         FROM collections c
         LEFT JOIN problem_collections pc ON c.id = pc.collection_id
         WHERE c.id = ?
         GROUP BY c.id`,
        [id]
      );

      return collection || null;
    } catch (error) {
      console.error('❌ Erro ao buscar coleção por ID:', error.message);
      throw error;
    }
  }

  /**
   * Buscar coleção por nome
   */
  async findByName(name) {
    try {
      return await this.db.get(
        'SELECT * FROM collections WHERE LOWER(name) = LOWER(?)',
        [name.trim()]
      );
    } catch (error) {
      console.error('❌ Erro ao buscar coleção por nome:', error.message);
      throw error;
    }
  }

  /**
   * Listar todas as coleções
   */
  async findAll(options = {}) {
    const {
      includeSystem = true,
      orderBy = 'is_system DESC, name ASC',
      limit = null
    } = options;

    let sql = `
      SELECT c.*, COUNT(pc.problem_id) as problem_count
      FROM collections c
      LEFT JOIN problem_collections pc ON c.id = pc.collection_id
    `;

    const params = [];

    if (!includeSystem) {
      sql += ' WHERE c.is_system = 0';
    }

    sql += ` GROUP BY c.id ORDER BY ${orderBy}`;

    if (limit) {
      sql += ` LIMIT ${limit}`;
    }

    try {
      return await this.db.all(sql, params);
    } catch (error) {
      console.error('❌ Erro ao listar coleções:', error.message);
      throw error;
    }
  }

  /**
   * Atualizar coleção
   */
  async update(id, data) {
    const { name, description, color, icon } = data;
    
    // Verificar se existe
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Coleção não encontrada');
    }

    // Não permitir edição de coleções do sistema (exceto cor e ícone)
    if (existing.is_system && (name || description)) {
      throw new Error('Não é possível alterar nome/descrição de coleções do sistema');
    }

    const updates = [];
    const params = [];

    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        throw new Error('Nome da coleção é obrigatório');
      }

      if (name.trim().length > 100) {
        throw new Error('Nome da coleção deve ter no máximo 100 caracteres');
      }

      // Verificar duplicação (exceto a própria coleção)
      const duplicate = await this.db.get(
        'SELECT id FROM collections WHERE LOWER(name) = LOWER(?) AND id != ?',
        [name.trim(), id]
      );

      if (duplicate) {
        throw new Error('Já existe uma coleção com este nome');
      }

      updates.push('name = ?');
      params.push(name.trim());
    }

    if (description !== undefined) {
      if (description && description.length > 500) {
        throw new Error('Descrição deve ter no máximo 500 caracteres');
      }

      updates.push('description = ?');
      params.push(description.trim());
    }

    if (color !== undefined) {
      updates.push('color = ?');
      params.push(color);
    }

    if (icon !== undefined) {
      updates.push('icon = ?');
      params.push(icon);
    }

    if (updates.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    try {
      const result = await this.db.run(
        `UPDATE collections SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      if (result.changes === 0) {
        throw new Error('Erro ao atualizar coleção');
      }

      await this.logAction('update_collection', id, data);
      console.log(`✏️ Coleção atualizada: ID ${id}`);
      
      return await this.findById(id);
    } catch (error) {
      console.error('❌ Erro ao atualizar coleção:', error.message);
      throw error;
    }
  }

  /**
   * Excluir coleção
   */
  async delete(id) {
    try {
      // Verificar se existe
      const collection = await this.findById(id);
      if (!collection) {
        throw new Error('Coleção não encontrada');
      }

      // Não permitir exclusão da coleção Favoritos
      if (collection.name === 'Favoritos' || collection.is_default) {
        throw new Error('Não é possível excluir a coleção Favoritos');
      }

      await this.db.transaction(async () => {
        // Migrar problemas para Favoritos ANTES de excluir
        if (collection.problem_count > 0) {
          await this.migrateProblemsToFavorites(id);
        }

        // Excluir a coleção
        const result = await this.db.run('DELETE FROM collections WHERE id = ?', [id]);
        
        if (result.changes === 0) {
          throw new Error('Erro ao excluir coleção');
        }

        await this.logAction('delete_collection', id, { 
          name: collection.name, 
          problems_migrated: collection.problem_count 
        });
      });

      console.log(`🗑️ Coleção excluída: "${collection.name}" (${collection.problem_count} problemas migrados)`);
      
      return {
        deleted: true,
        problemsMigrated: collection.problem_count
      };
    } catch (error) {
      console.error('❌ Erro ao excluir coleção:', error.message);
      throw error;
    }
  }

  /**
   * Migrar problemas de uma coleção para Favoritos
   */
  async migrateProblemsToFavorites(collectionId) {
    try {
      // Buscar coleção Favoritos
      const favoriteCollection = await this.findByName('Favoritos');
      if (!favoriteCollection) {
        throw new Error('Coleção Favoritos não encontrada');
      }

      // Atualizar problemas que estão APENAS na coleção sendo excluída
      const result = await this.db.run(
        `UPDATE problem_collections 
         SET collection_id = ?
         WHERE collection_id = ? 
         AND problem_id NOT IN (
           SELECT DISTINCT pc2.problem_id 
           FROM problem_collections pc2 
           WHERE pc2.collection_id = ? 
           AND pc2.collection_id != ?
         )`,
        [favoriteCollection.id, collectionId, favoriteCollection.id, collectionId]
      );

      // Para problemas que já estão em outras coleções, apenas remover da coleção atual
      await this.db.run(
        `DELETE FROM problem_collections 
         WHERE collection_id = ? 
         AND problem_id IN (
           SELECT DISTINCT pc2.problem_id 
           FROM problem_collections pc2 
           WHERE pc2.collection_id != ? 
           GROUP BY pc2.problem_id 
           HAVING COUNT(*) > 1
         )`,
        [collectionId, collectionId]
      );

      console.log(`🔄 ${result.changes} problemas migrados para Favoritos`);
      return result.changes;
    } catch (error) {
      console.error('❌ Erro na migração para Favoritos:', error.message);
      throw error;
    }
  }

  /**
   * Buscar problemas de uma coleção
   */
  async getProblems(collectionId, options = {}) {
    const { limit = 20, offset = 0, orderBy = 'pc.added_at DESC' } = options;

    try {
      const problems = await this.db.all(
        `SELECT p.*, pc.added_at as added_to_collection
         FROM problems p
         JOIN problem_collections pc ON p.id = pc.problem_id
         WHERE pc.collection_id = ?
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
        [collectionId, limit, offset]
      );

      return problems.map(problem => ({
        ...problem,
        tags: problem.tags ? JSON.parse(problem.tags) : [],
        is_favorite: !!problem.is_favorite
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar problemas da coleção:', error.message);
      throw error;
    }
  }

  /**
   * Estatísticas de uma coleção
   */
  async getStats(collectionId) {
    try {
      const collection = await this.findById(collectionId);
      if (!collection) {
        throw new Error('Coleção não encontrada');
      }

      // Estatísticas por dificuldade
      const difficultyStats = await this.db.all(
        `SELECT p.difficulty_level, COUNT(*) as count
         FROM problems p
         JOIN problem_collections pc ON p.id = pc.problem_id
         WHERE pc.collection_id = ?
         GROUP BY p.difficulty_level
         ORDER BY p.difficulty_level`,
        [collectionId]
      );

      // Estatísticas por fonte
      const sourceStats = await this.db.all(
        `SELECT p.source, COUNT(*) as count
         FROM problems p
         JOIN problem_collections pc ON p.id = pc.problem_id
         WHERE pc.collection_id = ?
         GROUP BY p.source`,
        [collectionId]
      );

      // Atividade recente (últimos 7 dias)
      const recentActivity = await this.db.get(
        `SELECT COUNT(*) as count
         FROM problems p
         JOIN problem_collections pc ON p.id = pc.problem_id
         WHERE pc.collection_id = ? 
         AND pc.added_at >= datetime('now', '-7 days')`,
        [collectionId]
      );

      return {
        id: collectionId,
        name: collection.name,
        totalProblems: collection.problem_count,
        difficultyBreakdown: difficultyStats,
        sourceBreakdown: sourceStats,
        recentlyAdded: recentActivity.count || 0,
        createdAt: collection.created_at,
        isSystem: !!collection.is_system
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas da coleção:', error.message);
      throw error;
    }
  }

  /**
   * Buscar coleções mais populares
   */
  async getPopular(limit = 5) {
    try {
      return await this.db.all(
        `SELECT c.*, COUNT(pc.problem_id) as problem_count
         FROM collections c
         LEFT JOIN problem_collections pc ON c.id = pc.collection_id
         GROUP BY c.id
         ORDER BY problem_count DESC, c.name ASC
         LIMIT ?`,
        [limit]
      );
    } catch (error) {
      console.error('❌ Erro ao buscar coleções populares:', error.message);
      throw error;
    }
  }

  /**
   * Duplicar coleção
   */
  async duplicate(id, newName) {
    try {
      const original = await this.findById(id);
      if (!original) {
        throw new Error('Coleção original não encontrada');
      }

      // Criar nova coleção
      const newCollection = await this.create({
        name: newName,
        description: `Cópia de: ${original.description}`,
        color: original.color,
        icon: original.icon
      });

      // Copiar problemas
      const problems = await this.getProblems(id);
      for (const problem of problems) {
        await this.db.run(
          'INSERT INTO problem_collections (problem_id, collection_id) VALUES (?, ?)',
          [problem.id, newCollection.id]
        );
      }

      await this.logAction('duplicate_collection', newCollection.id, { 
        originalId: id, 
        originalName: original.name,
        problemsCopied: problems.length 
      });

      console.log(`📋 Coleção duplicada: "${original.name}" → "${newName}" (${problems.length} problemas)`);
      
      return await this.findById(newCollection.id);
    } catch (error) {
      console.error('❌ Erro ao duplicar coleção:', error.message);
      throw error;
    }
  }

  /**
   * Contar coleções por tipo
   */
  async count(filters = {}) {
    const { includeSystem = true } = filters;
    
    let sql = 'SELECT COUNT(*) as count FROM collections';
    const params = [];

    if (!includeSystem) {
      sql += ' WHERE is_system = 0';
    }

    try {
      const result = await this.db.get(sql, params);
      return result.count;
    } catch (error) {
      console.error('❌ Erro ao contar coleções:', error.message);
      throw error;
    }
  }

  /**
   * Registrar ação no histórico
   */
  async logAction(action, collectionId, details = {}) {
    try {
      await this.db.run(
        'INSERT INTO history_log (action, problem_id, details) VALUES (?, ?, ?)',
        [action, null, JSON.stringify({ collectionId, ...details })]
      );
    } catch (error) {
      console.error('❌ Erro ao registrar histórico:', error.message);
    }
  }

  /**
   * Validar dados de coleção
   */
  validateData(data) {
    const errors = [];

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push('Nome é obrigatório');
      } else if (data.name.trim().length > 100) {
        errors.push('Nome deve ter no máximo 100 caracteres');
      }
    }

    if (data.description !== undefined && data.description.length > 500) {
      errors.push('Descrição deve ter no máximo 500 caracteres');
    }

    if (data.color !== undefined && data.color && !/^#[0-9A-F]{6}$/i.test(data.color)) {
      errors.push('Cor deve estar no formato hexadecimal (#RRGGBB)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = Collection;