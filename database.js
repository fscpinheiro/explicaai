// ExplicaAI - Sistema de Database SQLite
// Gerenciamento de problemas, coleções e histórico

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, 'explicaai.db');
    this.db = null;
  }

  // Inicializar database
  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ Erro ao conectar SQLite:', err.message);
          reject(err);
        } else {
          console.log('✅ SQLite conectado:', this.dbPath);
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  // Criar tabelas se não existirem
  async createTables() {
    const tables = [
      // Tabela de coleções
      `CREATE TABLE IF NOT EXISTS collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#4A90E2',
        icon TEXT DEFAULT '📚',
        is_default BOOLEAN DEFAULT 0,
        is_system BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de problemas
      `CREATE TABLE IF NOT EXISTS problems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        explanation TEXT NOT NULL,
        source TEXT DEFAULT 'text', -- 'text', 'ocr', 'similar'
        difficulty_level INTEGER DEFAULT 1, -- 1-5
        solved_time INTEGER, -- tempo em segundos para resolver
        is_favorite BOOLEAN DEFAULT 0,
        status TEXT DEFAULT 'resolved', -- 'resolved', 'studying', 'review'
        tags TEXT, -- JSON array de tags
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de relacionamento N:N entre problemas e coleções
      `CREATE TABLE IF NOT EXISTS problem_collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        problem_id INTEGER NOT NULL,
        collection_id INTEGER NOT NULL,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (problem_id) REFERENCES problems (id) ON DELETE CASCADE,
        FOREIGN KEY (collection_id) REFERENCES collections (id) ON DELETE CASCADE,
        UNIQUE(problem_id, collection_id)
      )`,

      // Tabela de histórico de ações
      `CREATE TABLE IF NOT EXISTS history_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL, -- 'solve', 'favorite', 'save_collection', etc
        problem_id INTEGER,
        details TEXT, -- JSON com detalhes da ação
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (problem_id) REFERENCES problems (id) ON DELETE SET NULL
      )`
    ];

    for (const table of tables) {
      await this.run(table);
    }

    // Criar coleções padrão
    await this.createDefaultCollections();
    
    console.log('🗄️ Tabelas SQLite criadas com sucesso!');
  }

  // Criar coleções padrão do sistema
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
        await this.run(
          `INSERT OR IGNORE INTO collections (name, description, color, icon, is_default, is_system) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [collection.name, collection.description, collection.color, collection.icon, collection.is_default, collection.is_system]
        );
      } catch (error) {
        // Ignorar erro se a coleção já existir
        console.log(`📚 Coleção '${collection.name}' já existe`);
      }
    }
  }

  // Helper para executar queries
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Helper para buscar um registro
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Helper para buscar múltiplos registros
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // OPERAÇÕES DE PROBLEMAS

  // Salvar novo problema
  async saveProblem(data) {
    const { text, explanation, source = 'text', difficulty = 1, solvedTime = null, tags = [] } = data;
    
    try {
      const result = await this.run(
        `INSERT INTO problems (text, explanation, source, difficulty_level, solved_time, tags)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [text, explanation, source, difficulty, solvedTime, JSON.stringify(tags)]
      );

      // Log da ação
      await this.logAction('solve', result.lastID, { source, difficulty });

      // Auto-adicionar à coleção "Favoritos" se não especificado
      const favoritesCollection = await this.get("SELECT id FROM collections WHERE name = 'Favoritos'");
      if (favoritesCollection) {
        await this.addProblemToCollection(result.lastID, favoritesCollection.id);
      }

      console.log(`💾 Problema salvo com ID: ${result.lastID}`);
      return result.lastID;
    } catch (error) {
      console.error('❌ Erro ao salvar problema:', error);
      throw error;
    }
  }

  // Buscar problema por ID
  async getProblem(id) {
    try {
      const problem = await this.get(
        `SELECT p.*, 
         GROUP_CONCAT(c.name) as collections,
         GROUP_CONCAT(c.color) as collection_colors,
         GROUP_CONCAT(c.icon) as collection_icons
         FROM problems p
         LEFT JOIN problem_collections pc ON p.id = pc.problem_id
         LEFT JOIN collections c ON pc.collection_id = c.id
         WHERE p.id = ?
         GROUP BY p.id`,
        [id]
      );

      if (problem) {
        problem.tags = problem.tags ? JSON.parse(problem.tags) : [];
        problem.collections = problem.collections ? problem.collections.split(',') : [];
        problem.collection_colors = problem.collection_colors ? problem.collection_colors.split(',') : [];
        problem.collection_icons = problem.collection_icons ? problem.collection_icons.split(',') : [];
      }

      return problem;
    } catch (error) {
      console.error('❌ Erro ao buscar problema:', error);
      throw error;
    }
  }

  // Listar problemas com filtros
  async getProblems(filters = {}) {
    let sql = `
      SELECT p.*, 
      GROUP_CONCAT(c.name) as collections,
      GROUP_CONCAT(c.color) as collection_colors
      FROM problems p
      LEFT JOIN problem_collections pc ON p.id = pc.problem_id
      LEFT JOIN collections c ON pc.collection_id = c.id
    `;
    
    const conditions = [];
    const params = [];

    if (filters.favorite) {
      conditions.push('p.is_favorite = 1');
    }

    if (filters.status) {
      conditions.push('p.status = ?');
      params.push(filters.status);
    }

    if (filters.search) {
      conditions.push('(p.text LIKE ? OR p.explanation LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.collectionId) {
      conditions.push('pc.collection_id = ?');
      params.push(filters.collectionId);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' GROUP BY p.id ORDER BY p.created_at DESC';

    if (filters.limit) {
      sql += ` LIMIT ${filters.limit}`;
    }

    try {
      const problems = await this.all(sql, params);
      
      return problems.map(problem => ({
        ...problem,
        tags: problem.tags ? JSON.parse(problem.tags) : [],
        collections: problem.collections ? problem.collections.split(',') : [],
        collection_colors: problem.collection_colors ? problem.collection_colors.split(',') : []
      }));
    } catch (error) {
      console.error('❌ Erro ao listar problemas:', error);
      throw error;
    }
  }

  // Toggle favorito
  async toggleFavorite(problemId) {
    try {
      const problem = await this.get('SELECT is_favorite FROM problems WHERE id = ?', [problemId]);
      const newFavoriteStatus = problem.is_favorite ? 0 : 1;
      
      await this.run('UPDATE problems SET is_favorite = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
        [newFavoriteStatus, problemId]);

      await this.logAction(newFavoriteStatus ? 'favorite' : 'unfavorite', problemId);

      return newFavoriteStatus;
    } catch (error) {
      console.error('❌ Erro ao alterar favorito:', error);
      throw error;
    }
  }

  // OPERAÇÕES DE COLEÇÕES

  // Listar todas as coleções
  async getCollections() {
    try {
      const collections = await this.all(
        `SELECT c.*, COUNT(pc.problem_id) as problem_count
         FROM collections c
         LEFT JOIN problem_collections pc ON c.id = pc.collection_id
         GROUP BY c.id
         ORDER BY c.is_system DESC, c.name ASC`
      );
      
      return collections;
    } catch (error) {
      console.error('❌ Erro ao listar coleções:', error);
      throw error;
    }
  }

  // Criar nova coleção
  async createCollection(data) {
    const { name, description = '', color = '#4A90E2', icon = '📚' } = data;
    
    try {
      const result = await this.run(
        'INSERT INTO collections (name, description, color, icon) VALUES (?, ?, ?, ?)',
        [name, description, color, icon]
      );

      console.log(`📁 Coleção '${name}' criada com ID: ${result.lastID}`);
      return result.lastID;
    } catch (error) {
      console.error('❌ Erro ao criar coleção:', error);
      throw error;
    }
  }

  // Adicionar problema à coleção
  async addProblemToCollection(problemId, collectionId) {
    try {
      await this.run(
        'INSERT OR IGNORE INTO problem_collections (problem_id, collection_id) VALUES (?, ?)',
        [problemId, collectionId]
      );

      await this.logAction('save_collection', problemId, { collectionId });
      
      console.log(`📚 Problema ${problemId} adicionado à coleção ${collectionId}`);
    } catch (error) {
      console.error('❌ Erro ao adicionar à coleção:', error);
      throw error;
    }
  }

  // Remover problema da coleção
  async removeProblemFromCollection(problemId, collectionId) {
    try {
      await this.run(
        'DELETE FROM problem_collections WHERE problem_id = ? AND collection_id = ?',
        [problemId, collectionId]
      );

      console.log(`🗑️ Problema ${problemId} removido da coleção ${collectionId}`);
    } catch (error) {
      console.error('❌ Erro ao remover da coleção:', error);
      throw error;
    }
  }

  // Buscar problemas de uma coleção
  async getCollectionProblems(collectionId) {
    try {
      const problems = await this.all(
        `SELECT p.* FROM problems p
         JOIN problem_collections pc ON p.id = pc.problem_id
         WHERE pc.collection_id = ?
         ORDER BY pc.added_at DESC`,
        [collectionId]
      );

      return problems.map(problem => ({
        ...problem,
        tags: problem.tags ? JSON.parse(problem.tags) : []
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar problemas da coleção:', error);
      throw error;
    }
  }

  // SISTEMA DE LOG/HISTÓRICO

  // Registrar ação no histórico
  async logAction(action, problemId = null, details = {}) {
    try {
      await this.run(
        'INSERT INTO history_log (action, problem_id, details) VALUES (?, ?, ?)',
        [action, problemId, JSON.stringify(details)]
      );
    } catch (error) {
      console.error('❌ Erro ao registrar histórico:', error);
    }
  }

  // Buscar histórico
  async getHistory(limit = 50) {
    try {
      const history = await this.all(
        `SELECT h.*, p.text as problem_text 
         FROM history_log h
         LEFT JOIN problems p ON h.problem_id = p.id
         ORDER BY h.created_at DESC
         LIMIT ?`,
        [limit]
      );

      return history.map(item => ({
        ...item,
        details: item.details ? JSON.parse(item.details) : {}
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar histórico:', error);
      throw error;
    }
  }

  // ESTATÍSTICAS

  // Estatísticas gerais
  async getStats() {
    try {
      const stats = {};
      
      stats.totalProblems = await this.get('SELECT COUNT(*) as count FROM problems');
      stats.totalCollections = await this.get('SELECT COUNT(*) as count FROM collections WHERE is_system = 0');
      stats.favoritesCount = await this.get('SELECT COUNT(*) as count FROM problems WHERE is_favorite = 1');
      stats.todayProblems = await this.get(
        'SELECT COUNT(*) as count FROM problems WHERE DATE(created_at) = DATE("now")'
      );

      // Problemas por status
      stats.statusBreakdown = await this.all(
        'SELECT status, COUNT(*) as count FROM problems GROUP BY status'
      );

      // Coleções mais usadas
      stats.topCollections = await this.all(
        `SELECT c.name, c.icon, COUNT(pc.problem_id) as count
         FROM collections c
         LEFT JOIN problem_collections pc ON c.id = pc.collection_id
         GROUP BY c.id
         ORDER BY count DESC
         LIMIT 5`
      );

      return stats;
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  // Auto-categorização inteligente
  async categorizeProblem(problemText) {
    const text = problemText.toLowerCase();
    
    // Regras simples de categorização
    if (text.includes('sen(') || text.includes('cos(') || text.includes('tan(') || text.includes('grau')) {
      return { category: 'Funções', confidence: 0.8 };
    }
    
    if (text.includes('área') || text.includes('volume') || text.includes('perímetro') || text.includes('círculo')) {
      return { category: 'Geometria', confidence: 0.9 };
    }
    
    if (text.includes('x²') || text.includes('^2') || text.includes('quadrática')) {
      return { category: 'Álgebra Básica', confidence: 0.7 };
    }
    
    if (text.includes('enem') || text.includes('vestibular') || text.includes('concurso')) {
      return { category: 'Preparação ENEM', confidence: 0.6 };
    }
    
    // Default
    return { category: 'Álgebra Básica', confidence: 0.5 };
  }

  // Fechar conexão
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('❌ Erro ao fechar SQLite:', err.message);
        } else {
          console.log('✅ Conexão SQLite fechada');
        }
      });
    }
  }
}

module.exports = Database;