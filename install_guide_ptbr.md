# Guia de Instalação - ExplicaAI

> **🌎 Guia em Português | 🇧🇷 [English Installation Guide](./install_guide.md)**

**📖 [Voltar para Documentação do Projeto](./README_PTBR.md)**

---

## Visão Geral da Instalação

Este guia fornece instruções detalhadas para instalação e configuração do ExplicaAI em ambiente escolar. O processo envolve a configuração de três componentes principais: Node.js, Ollama com Gemma 3n, e a aplicação ExplicaAI.

## Pré-requisitos do Sistema

### Verificação de Compatibilidade

**Sistemas Operacionais Suportados:**
- Windows 10 (build 1909 ou superior)
- Windows 11 (todas as versões)
- macOS 10.15 Catalina ou superior
- Ubuntu 20.04 LTS ou superior
- Debian 11 ou superior

**Especificações Mínimas:**
- Processador: 64-bit com 2.4 GHz ou superior
- Memória RAM: 8GB (16GB recomendado para melhor performance)
- Espaço em disco: 10GB livres
- Conexão com internet apenas para instalação inicial

## Etapa 1: Instalação do Node.js

### Windows

1. Acesse o site oficial: https://nodejs.org
2. Baixe a versão LTS (Long Term Support) mais recente
3. Execute o instalador baixado
4. Durante a instalação, marque a opção "Add to PATH"
5. Aceite todas as configurações padrão
6. Reinicie o computador após a instalação

### macOS

```bash
# Opção 1: Download direto
# Baixe o instalador em https://nodejs.org e execute

# Opção 2: Via Homebrew (se disponível)
brew install node
```

### Linux (Ubuntu/Debian)

```bash
# Atualizar repositórios
sudo apt update

# Instalar Node.js e npm
sudo apt install nodejs npm

# Verificar versões instaladas
node --version
npm --version
```

### Verificação da Instalação

Abra um terminal/prompt de comando e execute:

```bash
node --version
# Deve retornar: v18.x.x ou superior

npm --version
# Deve retornar: 9.x.x ou superior
```

## Etapa 2: Instalação do Ollama

### Windows

1. Acesse: https://ollama.com/download
2. Baixe o instalador para Windows
3. Execute o arquivo baixado como administrador
4. Aguarde a conclusão da instalação
5. O Ollama será instalado como serviço do Windows

### macOS

```bash
# Download e instalação automática
curl -fsSL https://ollama.com/install.sh | sh

# Ou baixar o instalador visual em ollama.com/download
```

### Linux

```bash
# Instalação via script oficial
curl -fsSL https://ollama.com/install.sh | sh

# Verificar se o serviço está ativo
systemctl status ollama
```

### Verificação do Ollama

```bash
# Testar conectividade
ollama --version

# Iniciar serviço (se não iniciou automaticamente)
ollama serve
```

## Etapa 3: Download do Modelo Gemma 3n

### Download e Configuração

```bash
# Baixar o modelo Gemma 3n (aproximadamente 2GB)
ollama pull gemma3n:e4b

# Verificar se o modelo foi baixado corretamente
ollama list

# Testar o modelo
ollama run gemma3n:e4b "Teste: 2 + 2 = ?"
```

**Nota:** O download pode demorar entre 5-20 minutos dependendo da velocidade da conexão.

### Configuração de Memória (Opcional)

Para sistemas com RAM limitada, configure o Ollama:

```bash
# Criar arquivo de configuração
echo 'OLLAMA_NUM_PARALLEL=1' >> ~/.ollama/config

# Reduzir uso de memória
echo 'OLLAMA_MAX_LOADED_MODELS=1' >> ~/.ollama/config
```

## Etapa 4: Instalação do ExplicaAI

### Download do Código

```bash
# Opção 1: Via Git (recomendado)
git clone [URL_DO_REPOSITORIO]
cd explicaai

# Opção 2: Download direto
# Baixe e extraia o arquivo ZIP do repositório
```

### Instalação de Dependências

```bash
# Instalar dependências do backend
npm install

# Instalar dependências do frontend
cd front
npm install
cd ..
```

### Configuração do Banco de Dados

```bash
# Criar e inicializar banco SQLite
npm run init-db

# Verificar criação das tabelas
npm run check-db
```

### Configuração de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
# Configurações do servidor
PORT=3000
NODE_ENV=development

# Configurações do Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma3n:e4b

# Configurações do banco
DB_PATH=./database/explicaai.db
```

## Etapa 5: Execução e Verificação

### Iniciando os Serviços

**Terminal 1 - Ollama Service:**
```bash
ollama serve
```

**Terminal 2 - ExplicaAI Application:**
```bash
# Na pasta raiz do projeto
# Terminal 2 - Backend (ExplicaAI API)
npm start

# Terminal 3 - Frontend (Interface Web)
cd front
npm run dev
```

### Verificação Completa do Sistema

1. **Acesse a aplicação:** http://localhost:3000
2. **Aguarde verificação automática** dos componentes
3. **Status esperado:**
   - API do ExplicaAI: Online
   - Banco de dados: Conectado
   - Ollama: Online
   - Modelo Gemma 3n: Carregado

### Teste de Funcionalidade

Execute os seguintes testes para validar a instalação:

```
Teste 1: 5 + 3
Resultado esperado: Resolução em 1 passo direto

Teste 2: 2x + 5 = 13
Resultado esperado: Resolução em 2-3 passos estruturados

Teste 3: Criar coleção "Teste"
Resultado esperado: Coleção criada com sucesso
```

## Solução de Problemas Comuns

### Ollama Não Conecta

```bash
# Verificar se o serviço está rodando
ps aux | grep ollama

# Reiniciar serviço
killall ollama
ollama serve

# Verificar porta
lsof -i :11434
```

### Modelo Gemma 3n Não Encontrado

```bash
# Verificar modelos instalados
ollama list

# Reinstalar modelo se necessário
ollama rm gemma3n:e4b
ollama pull gemma3n:e4b
```

### Erro de Dependências Node.js

```bash
# Limpar cache npm
npm cache clean --force

# Remover node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Banco de Dados Corrompido

```bash
# Recriar banco de dados
rm database/explicaai.db
npm run init-db
```

### Performance Baixa

1. **Verificar RAM disponível** (mínimo 8GB)
2. **Fechar aplicações desnecessárias**
3. **Configurar Ollama para usar menos memória:**

```bash
# Adicionar ao arquivo de configuração do Ollama
echo 'OLLAMA_NUM_PARALLEL=1' >> ~/.ollama/config
```

## Configuração para Ambiente Escolar

### Instalação em Múltiplos Computadores

1. **Prepare uma máquina mestre** seguindo todos os passos
2. **Crie script de instalação automatizada:**

```bash
#!/bin/bash
# install_explicaai.sh

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "Instalando Node.js..."
    # [comandos de instalação específicos do OS]
fi

# Verificar se Ollama está instalado
if ! command -v ollama &> /dev/null; then
    echo "Instalando Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
fi

# Baixar modelo
echo "Baixando Gemma 3n..."
ollama pull gemma3n:e4b

# Clonar e configurar aplicação
git clone [URL_REPO] explicaai
cd explicaai
npm install
npm run init-db

echo "Instalação concluída! Execute: npm start"
```

### Configuração de Rede Local

Para utilização em rede local escolar:

```env
# No arquivo .env
HOST=0.0.0.0
PORT=3000
```

Acesso via: `http://[IP_DO_SERVIDOR]:3000`

## Manutenção e Atualizações

### Backup de Dados

```bash
# Backup do banco de dados
cp database/explicaai.db backup/explicaai_backup_$(date +%Y%m%d).db

# Backup de configurações
cp .env backup/config_backup_$(date +%Y%m%d).env
```

### Atualizações do Sistema

```bash
# Atualizar código da aplicação
git pull origin main

# Atualizar dependências
npm update

# Atualizar modelo Gemma (quando disponível)
ollama pull gemma3n:e4b
```

### Monitoramento de Performance

```bash
# Verificar uso de recursos
htop

# Monitorar logs da aplicação
tail -f logs/explicaai.log

# Verificar status do Ollama
ollama ps
```

## Suporte Técnico

### Logs do Sistema

Localizações dos arquivos de log:

- **ExplicaAI:** `logs/explicaai.log`
- **Ollama:** `~/.ollama/logs/server.log`
- **Sistema:** `/var/log/syslog` (Linux) ou Event Viewer (Windows)

### Comandos de Diagnóstico

```bash
# Verificação completa do sistema
npm run system-check

# Teste de conectividade
npm run test-ollama

# Validação do banco
npm run validate-db

# Teste de performance
npm run benchmark
```

### Contato para Suporte

Para questões técnicas específicas ou reportar problemas, utilize os canais oficiais do projeto no repositório GitHub.

---

**Nota:** Este guia foi desenvolvido especificamente para ambiente educacional brasileiro, considerando as limitações de infraestrutura típicas de escolas públicas.