# Installation Guide - ExplicaAI

> **🌎 English Installation Guide | 🇧🇷 [Guia em Português](./install_guide_ptbr.md)**

**← [Back to Project Overview](./README.md)**

---

## Installation Overview

This guide provides detailed instructions for installing and configuring ExplicaAI in a school environment. The process involves setting up three main components: Node.js, Ollama with Gemma 3n, and the ExplicaAI application.

## System Prerequisites

### Compatibility Check

**Supported Operating Systems:**
- Windows 10 (build 1909 or higher)
- Windows 11 (all versions)
- macOS 10.15 Catalina or higher
- Ubuntu 20.04 LTS or higher
- Debian 11 or higher

**Minimum Specifications:**
- Processor: 64-bit with 2.4 GHz or higher
- RAM: 8GB (16GB recommended for better performance)
- Disk space: 10GB free
- Internet connection only required for initial installation

## Step 1: Node.js Installation

### Windows

1. Visit the official website: https://nodejs.org
2. Download the latest LTS (Long Term Support) version
3. Run the downloaded installer
4. During installation, check "Add to PATH"
5. Accept all default settings
6. Restart computer after installation

### macOS

```bash
# Option 1: Direct download
# Download installer from https://nodejs.org and run

# Option 2: Via Homebrew (if available)
brew install node
```

### Linux (Ubuntu/Debian)

```bash
# Update repositories
sudo apt update

# Install Node.js and npm
sudo apt install nodejs npm

# Verify installed versions
node --version
npm --version
```

### Installation Verification

Open a terminal/command prompt and execute:

```bash
node --version
# Should return: v18.x.x or higher

npm --version
# Should return: 9.x.x or higher
```

## Step 2: Ollama Installation

### Windows

1. Go to: https://ollama.com/download
2. Download the Windows installer
3. Run the downloaded file as administrator
4. Wait for installation completion
5. Ollama will be installed as a Windows service

### macOS

```bash
# Automatic download and installation
curl -fsSL https://ollama.com/install.sh | sh

# Or download visual installer from ollama.com/download
```

### Linux

```bash
# Installation via official script
curl -fsSL https://ollama.com/install.sh | sh

# Check if service is active
systemctl status ollama
```

### Ollama Verification

```bash
# Test connectivity
ollama --version

# Start service (if not started automatically)
ollama serve
```

## Step 3: Gemma 3n Model Download

### Download and Configuration

```bash
# Download Gemma 3n model (approximately 2GB)
ollama pull gemma3n:e4b

# Verify model was downloaded correctly
ollama list

# Test the model
ollama run gemma3n:e4b "Test: 2 + 2 = ?"
```

**Note:** Download may take 5-20 minutes depending on connection speed.

### Memory Configuration (Optional)

For systems with limited RAM, configure Ollama:

```bash
# Create configuration file
echo 'OLLAMA_NUM_PARALLEL=1' >> ~/.ollama/config

# Reduce memory usage
echo 'OLLAMA_MAX_LOADED_MODELS=1' >> ~/.ollama/config
```

## Step 4: ExplicaAI Installation

### Code Download

```bash
# Option 1: Via Git (recommended)
git clone [REPOSITORY_URL]
cd explicaai

# Option 2: Direct download
# Download and extract ZIP file from repository
```

### Dependencies Installation

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd front
npm install
cd ..
```

### Database Configuration

```bash
# Create and initialize SQLite database
npm run init-db

# Verify table creation
npm run check-db
```

### Environment Configuration

Create `.env` file in project root:

```env
# Server settings
PORT=3000
NODE_ENV=development

# Ollama settings
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma3n:e4b

# Database settings
DB_PATH=./database/explicaai.db
```

## Step 5: Execution and Verification

### Starting Services

**Terminal 1 - Ollama Service:**
```bash
ollama serve
```

**Terminal 2 - ExplicaAI Application:**
```bash
# In project root folder
npm start
```

### Complete System Verification

1. **Access application:** http://localhost:3000
2. **Wait for automatic verification** of components
3. **Expected status:**
   - ExplicaAI API: Online
   - Database: Connected
   - Ollama: Online
   - Gemma 3n Model: Loaded

### Functionality Testing

Execute the following tests to validate installation:

```
Test 1: 5 + 3
Expected result: Resolution in 1 direct step

Test 2: 2x + 5 = 13
Expected result: Resolution in 2-3 structured steps

Test 3: Create "Test" collection
Expected result: Collection created successfully
```

## Common Problem Solutions

### Ollama Won't Connect

```bash
# Check if service is running
ps aux | grep ollama

# Restart service
killall ollama
ollama serve

# Check port
lsof -i :11434
```

### Gemma 3n Model Not Found

```bash
# Check installed models
ollama list

# Reinstall model if necessary
ollama rm gemma3n:e4b
ollama pull gemma3n:e4b
```

### Node.js Dependencies Error

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Corrupted Database

```bash
# Recreate database
rm database/explicaai.db
npm run init-db
```

### Low Performance

1. **Check available RAM** (minimum 8GB)
2. **Close unnecessary applications**
3. **Configure Ollama to use less memory:**

```bash
# Add to Ollama configuration file
echo 'OLLAMA_NUM_PARALLEL=1' >> ~/.ollama/config
```

## School Environment Configuration

### Multi-Computer Installation

1. **Prepare a master machine** following all steps
2. **Create automated installation script:**

```bash
#!/bin/bash
# install_explicaai.sh

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    # [OS-specific installation commands]
fi

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
fi

# Download model
echo "Downloading Gemma 3n..."
ollama pull gemma3n:e4b

# Clone and configure application
git clone [REPO_URL] explicaai
cd explicaai
npm install
npm run init-db

echo "Installation complete! Run: npm start"
```

### Local Network Configuration

For school local network usage:

```env
# In .env file
HOST=0.0.0.0
PORT=3000
```

Access via: `http://[SERVER_IP]:3000`

## Maintenance and Updates

### Data Backup

```bash
# Database backup
cp database/explicaai.db backup/explicaai_backup_$(date +%Y%m%d).db

# Configuration backup
cp .env backup/config_backup_$(date +%Y%m%d).env
```

### System Updates

```bash
# Update application code
git pull origin main

# Update dependencies
npm update

# Update Gemma model (when available)
ollama pull gemma3n:e4b
```

### Performance Monitoring

```bash
# Check resource usage
htop

# Monitor application logs
tail -f logs/explicaai.log

# Check Ollama status
ollama ps
```

## Technical Support

### System Logs

Log file locations:

- **ExplicaAI:** `logs/explicaai.log`
- **Ollama:** `~/.ollama/logs/server.log`
- **System:** `/var/log/syslog` (Linux) or Event Viewer (Windows)

### Diagnostic Commands

```bash
# Complete system check
npm run system-check

# Connectivity test
npm run test-ollama

# Database validation
npm run validate-db

# Performance test
npm run benchmark
```

### Support Contact

For specific technical questions or to report problems, use the official project channels on the GitHub repository.

---

**Note:** This guide was developed specifically for Brazilian educational environments, considering typical infrastructure limitations of public schools.