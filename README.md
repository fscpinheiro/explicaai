# ExplicaAI - Offline Mathematics Education System

> **🌎 English Version | 🇧🇷 [Versão em Português](./README_PTBR.md)**

---

## Overview

ExplicaAI is an offline mathematics education application specifically designed for Brazilian public schools, built to operate completely offline using Google's Gemma 3n model. The system provides step-by-step problem solving, collection management for study organization, and advanced pedagogical features.

## Problem Statement

Many Brazilian public schools have computer labs with limited or unstable internet connectivity. Mathematics teachers need digital tools that function offline while providing educational explanations to support the teaching-learning process.

## Solution

An offline-first web application was developed that runs locally, utilizing the Gemma 3n model via Ollama to provide:

- Step-by-step mathematical problem resolution
- Collection system for organizing content by topics
- Complete offline functionality
- Intuitive interface suitable for school environments
- History of solved problems
- Generation of similar exercises for practice

## Technical Architecture

### Backend (Node.js)
- **Framework:** Express.js
- **Database:** SQLite (for offline portability)
- **AI Integration:** Ollama API with Gemma 3n
- **Structure:** RESTful API with specialized endpoints

### Frontend (React)
- **Framework:** React 18 with Hooks
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Build:** Integrated within backend structure

### AI Model
- **Model:** Google Gemma 3n (gemma3n:e4b)
- **Runtime:** Local Ollama
- **Configuration:** Optimized for mathematical problem solving

## Key Features

### Problem Resolution
- Automatic complexity detection (simple, medium, complex)
- Specialized prompts for each difficulty level
- Validation and automatic retry to ensure consistent formatting
- Detailed pedagogical explanations

### Collection System
- Automatic organization by mathematical categories
- Custom collections for different topics
- Favorites system for important problems
- Intelligent categorization based on content analysis

### Educational Interface
- Design adapted for school environments
- Interactive mascot representing Gemma 3n
- Customizable visual themes (static and animated gradient)
- Visual feedback during processing

## Installation and Setup

### Complete Installation Guide

For detailed step-by-step installation instructions, including troubleshooting and school environment configuration, see:

**📖 [install_guide.md](./install_guide.md) - Complete Installation Guide**

### Quick Installation

```bash
# Clone repository
git clone [REPOSITORY_URL]
cd explicaai

# Install dependencies
npm install

# Initialize database
npm run init-db

# Start Ollama service (separate terminal)
ollama serve

# Start backend (terminal 2)
npm start

# Start frontend (terminal 3)
cd front
npm run dev
```
## Development Structure

ExplicaAI follows a monorepo structure:
explicaai/
├── server.js              # Backend entry point
├── package.json           # Backend dependencies
├── routes/                # API routes
├── services/              # Backend services
├── front/                 # Frontend application
│   ├── package.json       # Frontend dependencies
│   ├── src/               # React components
│   └── public/            # Static assets
└── database/              # SQLite database

**Running the application requires three terminals:**
1. **Ollama Service:** `ollama serve`
2. **Backend API:** `npm start` (root folder)
3. **Frontend:** `npm run dev` (front folder)

### Prerequisites

1. **Node.js** (version 16 or higher)
2. **Ollama** installed and configured
3. **Gemma 3n model** downloaded via Ollama

### Installation Verification

1. Access `http://localhost:3000`
2. Verify the application detects Ollama online
3. Test with simple problem: "2 + 2"

## Application Usage

### For Teachers

1. **Lesson Preparation:** Create thematic collections with specific problems
2. **Demonstration:** Use the system to explain concepts in real-time
3. **Exercises:** Generate similar problems for student practice

### For Students

1. **Guided Resolution:** Input problems and follow step-by-step solutions
2. **Directed Study:** Access collections organized by topic
3. **Practice:** Request generation of similar exercises
4. **Review:** Consult history of solved problems

## Technical Differentials

### Intelligent Complexity Detection

A system was implemented that analyzes mathematical problems and determines the resolution approach:

- **Simple Problems:** Basic operations solved in 1-2 direct steps
- **Medium Problems:** Equations and calculations requiring 3-6 steps
- **Complex Problems:** Advanced concepts with 5-10 detailed steps

### Validation and Retry System

Quality mechanism implementation that:
- Validates structured response format
- Executes automatic retry with stricter prompts
- Provides fallback in case of persistent failures

### Gemma 3n Optimization

The application was specifically optimized for the Gemma 3n model:
- Prompts adjusted for model characteristics
- Temperature parameters configured for mathematics
- Specific handling of multimodal responses

## File Structure

```
explicaai/
├── server.js                 # Main server
├── routes/                   # API endpoints
│   ├── problems.js          # Problem resolution
│   ├── collections.js       # Collection management
│   └── status.js            # System status
├── services/                 # Core services
│   ├── ollamaService.js     # Ollama/Gemma integration
│   └── categorizationService.js # Automatic categorization
├── models/                   # Data models
│   ├── Problem.js           # Problem model
│   └── Collection.js        # Collection model
├── utils/                    # Utilities
│   ├── mathParser.js        # Mathematical response parser
│   └── helpers.js           # Helper functions
├── front/                    # React frontend
│   ├── src/components/      # React components
│   ├── src/service/         # Frontend services
│   └── public/              # Static resources
└── database/                 # Database files
    └── explicaai.db         # SQLite database
```

## System Requirements

### Minimum
- **Processor:** Intel i3 or AMD equivalent
- **RAM:** 8GB
- **Storage:** 5GB free space
- **OS:** Windows 10/11, macOS 10.15+, Ubuntu 20.04+

### Recommended for Better Performance
- **Processor:** Intel i5 or AMD Ryzen 5
- **RAM:** 16GB
- **GPU:** Optional (improves Gemma 3n speed)

## Educational Impact

### Identified Benefits

1. **Democratization:** Access to educational AI without internet dependency
2. **Pedagogy:** Step-by-step explanations improve comprehension
3. **Autonomy:** Students can practice independently
4. **Inclusion:** Works in schools with limited infrastructure

### Validated Use Cases

- Mathematics laboratories in public schools
- Reinforcement and tutoring classes
- Home study without internet
- Assessment preparation

## Development and Contribution

### Future Roadmap

1. **OCR Integration:** Problem solving via image recognition
2. **Voice Synthesis:** Audio explanations
3. **Accessibility:** Brazilian Sign Language (LIBRAS) support
4. **Authentication:** Individual user system
5. **Portability:** Collection import/export

### Technologies Used

- **Backend:** Node.js, Express, SQLite
- **Frontend:** React, Tailwind CSS, Framer Motion  
- **AI:** Ollama, Google Gemma 3n
- **Build Tools:** Webpack, Babel
- **Testing:** Jest (planned)

## License and Usage

This project was developed for the Google Gemma 3n Impact Challenge with focus on educational and social impact. The code is available under a license that permits educational use and modification for similar purposes.

## Support and Documentation

For technical questions, consult the repository documentation or contact through official project channels.

---

**Developed with focus on Brazilian public education and utilizing Google Gemma 3n to democratize access to educational artificial intelligence.**