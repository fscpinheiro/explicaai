# ExplicaAI - Sistema de Educação Matemática Offline

> **🌎 Versão em Português | 🇧🇷 [English Version](./README.md)**

---

## Visão Geral

ExplicaAI é uma aplicação de educação matemática desenvolvida especificamente para escolas públicas brasileiras, projetada para funcionar completamente offline utilizando o modelo Gemma 3n. O sistema oferece resolução passo a passo de problemas matemáticos, gerenciamento de coleções de estudos e funcionalidades pedagógicas avançadas.

## Problema Identificado

Muitas escolas públicas brasileiras possuem laboratórios de informática com conectividade limitada ou instável. Professores de matemática necessitam de ferramentas digitais que funcionem offline e ofereçam explicações didáticas para auxiliar no processo de ensino-aprendizagem.

## Solução Proposta

Foi desenvolvida uma aplicação web que executa localmente, utilizando o modelo Gemma 3n via Ollama para prover:

- Resolução passo a passo de problemas matemáticos
- Sistema de coleções para organização de conteúdo por tópicos
- Funcionalidade offline completa
- Interface intuitiva adequada para ambiente escolar
- Histórico de problemas resolvidos
- Geração de exercícios similares para prática

## Arquitetura Técnica

### Backend (Node.js)
- **Framework:** Express.js
- **Banco de Dados:** SQLite (para portabilidade offline)
- **IA Integration:** Ollama API com Gemma 3n
- **Estrutura:** API RESTful com endpoints especializados

### Frontend (React)
- **Framework:** React 18 com Hooks
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Build:** Integrado na estrutura do backend

### Modelo de IA
- **Modelo:** Google Gemma 3n (gemma3n:e4b)
- **Runtime:** Ollama local
- **Configuração:** Otimizado para resolução matemática

## Funcionalidades Principais

### Resolução de Problemas
- Detecção automática de complexidade (simples, médio, complexo)
- Prompts especializados para cada nível de dificuldade
- Validação e retry automático para garantir formato consistente
- Explicações pedagógicas detalhadas

### Sistema de Coleções
- Organização automática por categorias matemáticas
- Coleções personalizadas para diferentes tópicos
- Sistema de favoritos para problemas importantes
- Categorização inteligente baseada em análise de conteúdo

### Interface Educacional
- Design adaptado para ambiente escolar
- Mascote interativo representando o Gemma 3n
- Temas visuais customizáveis (estático e gradiente animado)
- Feedback visual durante processamento

## Instalação e Configuração

### Pré-requisitos

1. **Node.js** (versão 16 ou superior)
2. **Ollama** instalado e configurado
3. **Modelo Gemma 3n** baixado via Ollama

### Instalação do Ollama

```bash
# Linux/macOS
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Baixar instalador em https://ollama.com/download
```

### Download do Modelo Gemma 3n

```bash
# Baixar o modelo Gemma 3n
ollama pull gemma3n:e4b

# Verificar instalação
ollama list
```

### Guia de Instalação Completo

Para instruções detalhadas de instalação passo a passo, incluindo solução de problemas e configuração para ambiente escolar, consulte:

**📖 [install_guide_ptbr.md](./install_guide_ptbr.md) - Guia Completo de Instalação**

### Instalação Rápida

```bash
# Clonar o repositório
git clone [URL_DO_REPOSITORIO]
cd explicaai

# Instalar dependências
npm install

# Inicializar banco de dados
npm run init-db

# Iniciar Ollama service (terminal separado)
ollama serve

# Iniciar aplicação
npm start
```

### Verificação da Instalação

1. Acesse `http://localhost:3000`
2. Verifique se a aplicação detecta o Ollama online
3. Teste com problema simples: "2 + 2"

## Uso da Aplicação

### Para Professores

1. **Preparação de Aulas:** Criar coleções temáticas com problemas específicos
2. **Demonstração:** Utilizar o sistema para explicar conceitos em tempo real
3. **Exercícios:** Gerar problemas similares para prática dos alunos

### Para Alunos

1. **Resolução Guiada:** Inserir problemas e acompanhar resolução passo a passo
2. **Estudo Dirigido:** Acessar coleções organizadas por tópico
3. **Prática:** Solicitar geração de exercícios similares
4. **Revisão:** Consultar histórico de problemas resolvidos

## Diferencial Técnico

### Detecção Inteligente de Complexidade

Foi implementado um sistema que analisa o problema matemático e determina a abordagem de resolução:

- **Problemas Simples:** Operações básicas resolvidas em 1-2 passos diretos
- **Problemas Médios:** Equações e cálculos que requerem 3-6 passos
- **Problemas Complexos:** Conceitos avançados com 5-10 passos detalhados

### Sistema de Validação e Retry

Implementado mecanismo de qualidade que:
- Valida formato de resposta estruturada
- Executa retry automático com prompt mais rígido
- Oferece fallback em caso de falhas persistentes

### Otimização para Gemma 3n

A aplicação foi especificamente otimizada para o modelo Gemma 3n:
- Prompts ajustados para características do modelo
- Parâmetros de temperatura configurados para matemática
- Tratamento específico de respostas multimodais

## Estrutura de Arquivos

```
explicaai/
├── server.js                 # Servidor principal
├── routes/                   # Endpoints da API
│   ├── problems.js          # Resolução de problemas
│   ├── collections.js       # Gerenciamento de coleções
│   └── status.js            # Status do sistema
├── services/                 # Serviços core
│   ├── ollamaService.js     # Integração com Ollama/Gemma
│   └── categorizationService.js # Categorização automática
├── models/                   # Modelos de dados
│   ├── Problem.js           # Modelo de problemas
│   └── Collection.js        # Modelo de coleções
├── utils/                    # Utilitários
│   ├── mathParser.js        # Parser de respostas matemáticas
│   └── helpers.js           # Funções auxiliares
├── front/                    # Frontend React
│   ├── src/components/      # Componentes React
│   ├── src/service/         # Serviços do frontend
│   └── public/              # Recursos estáticos
└── database/                 # Arquivos de banco
    └── explicaai.db         # SQLite database
```

## Requisitos de Sistema

### Mínimos
- **Processador:** Intel i3 ou AMD equivalente
- **Memória RAM:** 8GB
- **Armazenamento:** 5GB livres
- **Sistema:** Windows 10/11, macOS 10.15+, Ubuntu 20.04+

### Recomendados para Melhor Performance
- **Processador:** Intel i5 ou AMD Ryzen 5
- **Memória RAM:** 16GB
- **GPU:** Opcional (melhora velocidade do Gemma 3n)

## Impacto Educacional

### Benefícios Identificados

1. **Democratização:** Acesso a IA educacional sem dependência de internet
2. **Pedagogia:** Explicações passo a passo melhoram compreensão
3. **Autonomia:** Estudantes podem praticar independentemente
4. **Inclusão:** Funciona em escolas com infraestrutura limitada

### Casos de Uso Validados

- Laboratórios de matemática em escolas públicas
- Aulas de reforço e monitoria
- Estudo domiciliar sem internet
- Preparação para avaliações

## Contribuição e Desenvolvimento

### Roadmap Futuro

1. **OCR Integration:** Resolução de problemas via imagem
2. **Síntese de Voz:** Explicações em áudio
3. **Acessibilidade:** Suporte a LIBRAS
4. **Autenticação:** Sistema de usuários individuais
5. **Portabilidade:** Import/export de coleções

### Tecnologias Utilizadas

- **Backend:** Node.js, Express, SQLite
- **Frontend:** React, Tailwind CSS, Framer Motion  
- **IA:** Ollama, Google Gemma 3n
- **Build Tools:** Webpack, Babel
- **Testing:** Jest (planejado)

## Licença e Uso

Este projeto foi desenvolvido para o Google Gemma 3n Impact Challenge com foco em impacto educacional e social. O código é disponibilizado sob licença que permite uso educacional e modificação para fins similares.

## Suporte e Documentação

Para questões técnicas, consulte a documentação no repositório ou entre em contato através dos canais oficiais do projeto.

---

**Desenvolvido com foco em educação pública brasileira e utilizando Google Gemma 3n para democratizar acesso à inteligência artificial educacional.**