// ExplicaAI - Database Principal Refatorado
// Conexão e inicialização do SQLite com estrutura modular

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Import dos models
const Problem = require('./models/Problem');
const Collection = require('./models/Collection');
const Stats = require('./models/Stats');

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, '..', 'explicaai.db');
    this.db = null;
    this.models = {};
  }

  /**
   * Inicializar database e modelos
   */
  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ Erro ao conectar SQLite:', err.message);
          reject(err);
        } else {
          console.log('✅ SQLite conectado:', this.dbPath);
          this.initializeModels()
            .then(() => this.createTables())
            .then(resolve)
            .catch(reject);
        }
      });
    });
  }

  /**
   * Inicializar modelos com referência ao database
   */
  async initializeModels() {
    this.models.Problem = new Problem(this);
    this.models.Collection = new Collection(this);
    this.models.Stats = new Stats(this);
    
    console.log('📦 Modelos inicializados: Problem, Collection, Stats');
  }

  /**
   * Criar todas as tabelas
   */
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
      )`,

      // Índices para performance
      `CREATE INDEX IF NOT EXISTS idx_problems_created_at ON problems(created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_problems_favorite ON problems(is_favorite)`,
      `CREATE INDEX IF NOT EXISTS idx_problems_source ON problems(source)`,
      `CREATE INDEX IF NOT EXISTS idx_problem_collections_problem ON problem_collections(problem_id)`,
      `CREATE INDEX IF NOT EXISTS idx_problem_collections_collection ON problem_collections(collection_id)`,
      `CREATE INDEX IF NOT EXISTS idx_history_log_created_at ON history_log(created_at DESC)`
    ];

    for (const table of tables) {
      await this.run(table);
    }

    // Criar coleções padrão
    await this.models.Collection.createDefaultCollections();
    
    console.log('🗄️ Tabelas SQLite criadas com sucesso!');
  }

  /**
   * Helper para executar queries
   */
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

  /**
   * Helper para buscar um registro
   */
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

  /**
   * Helper para buscar múltiplos registros
   */
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

  /**
   * Executar query em transação
   */
  async transaction(callback) {
    try {
      await this.run('BEGIN TRANSACTION');
      const result = await callback(this);
      await this.run('COMMIT');
      return result;
    } catch (error) {
      await this.run('ROLLBACK');
      throw error;
    }
  }

  /**
   * Verificar saúde do database
   */
  async healthCheck() {
    try {
      const result = await this.get('SELECT COUNT(*) as count FROM sqlite_master WHERE type="table"');
      const tableCount = result.count;
      
      const problems = await this.get('SELECT COUNT(*) as count FROM problems');
      const collections = await this.get('SELECT COUNT(*) as count FROM collections');
      
      return {
        status: 'healthy',
        tables: tableCount,
        problems: problems.count,
        collections: collections.count,
        dbSize: this.getDatabaseSize()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Obter tamanho do database
   */
  getDatabaseSize() {
    try {
      const stats = fs.statSync(this.dbPath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      return `${sizeInMB} MB`;
    } catch (error) {
      return 'Unknown';
    }
  }

  /**
   * Backup do database
   */
  async backup(backupPath = null) {
    if (!backupPath) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      backupPath = path.join(__dirname, '..', `backup_${timestamp}.db`);
    }

    return new Promise((resolve, reject) => {
      const backup = this.db.backup(backupPath);
      
      backup.step(-1, (err) => {
        if (err) {
          reject(err);
        } else {
          backup.finish((err) => {
            if (err) {
              reject(err);
            } else {
              console.log(`💾 Backup criado: ${backupPath}`);
              resolve(backupPath);
            }
          });
        }
      });
    });
  }

  /**
   * Limpar dados antigos
   */
  async cleanup(olderThanDays = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    try {
      // Limpar histórico antigo
      const historyResult = await this.run(
        'DELETE FROM history_log WHERE created_at < ?',
        [cutoffDate.toISOString()]
      );
      
      console.log(`🧹 Cleanup concluído: ${historyResult.changes} registros de histórico removidos`);
      
      return {
        historyRemoved: historyResult.changes
      };
    } catch (error) {
      console.error('❌ Erro no cleanup:', error.message);
      throw error;
    }
  }

  /**
   * Otimizar database
   */
  async optimize() {
    try {
      await this.run('VACUUM');
      await this.run('ANALYZE');
      console.log('⚡ Database otimizado');
    } catch (error) {
      console.error('❌ Erro na otimização:', error.message);
      throw error;
    }
  }

  /**
   * Fechar conexão
   */
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

  // Getters para acessar os modelos
  get Problem() {
    return this.models.Problem;
  }

  get Collection() {
    return this.models.Collection;
  }

  get Stats() {
    return this.models.Stats;
  }
}

module.exports = Database;