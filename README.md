# 🎓 NeshMap — AI-Driven Exam Prep & Handwritten Notes Orchestrator

> **Transform unstructured, handwritten student lecture notes into structured, interactive study roadmaps, clean LaTeX mathematical lectures, and enriched web research.**

---

## 📌 Table of Contents
- [🎓 NeshMap — AI-Driven Exam Prep \& Handwritten Notes Orchestrator](#-neshmap--ai-driven-exam-prep--handwritten-notes-orchestrator)
  - [📌 Table of Contents](#-table-of-contents)
  - [📖 Overview](#-overview)
  - [✨ Key Features](#-key-features)
  - [🏗️ System Architecture \& Workflow](#️-system-architecture--workflow)
  - [📚 Terminology \& Core Concepts](#-terminology--core-concepts)
  - [🛠️ Tech Stack \& Agent Matrix](#️-tech-stack--agent-matrix)
    - [Core Stack](#core-stack)
    - [Specialized Multi-Agent Matrix](#specialized-multi-agent-matrix)
  - [💾 Data Storage Strategy](#-data-storage-strategy)
  - [⚙️ Environment Configuration](#️-environment-configuration)
  - [🚀 Installation \& Local Setup](#-installation--local-setup)

---

## 📖 Overview

When preparing for university exams, students frequently rely on handwritten PDF notes shared by peers. Standard OCR tools and basic AI models often fail to process these notes accurately due to informal handwriting, smudged pages, multi-page mathematical derivations, and unformatted diagrams.

**NeshMap** solves this problem by using a multimodal **RAG + Agentic Architecture**:
1. It ingests handwritten PDF notes and parses them into structured HTML/Markdown and LaTeX math equations.
2. An AI **Curriculum Architect Agent** builds a chronologically ordered, de-duplicated study roadmap.
3. As the student studies a module, a **Web Research Agent** checks for thin or missing note explanations and fetches supplemental documentation from the web.
4. A **Pedagogical Instructor Agent** synthesizes local notes and web research into classroom-quality lectures complete with analogies, formula breakdowns, and exam practice problems.

---

## ✨ Key Features

* 📸 **Multimodal Vision Ingestion:** Converts raw handwritten PDF scans into clean Markdown/HTML with fully formatted LaTeX formulas ($E = mc^2$ and display equations).
* 🗺️ **Autonomous Roadmap Generation:** Groups multi-page topic continuations and structures a unit-by-unit syllabus with target page mappings.
* 🔍 **Hybrid Retrieval Engine:** Combines vector similarity search with page-window retrieval ($N-1$ and $N+1$ adjacent pages) to ensure mathematical and conceptual context isn't lost.
* 🌐 **Autonomous Web Enrichment:** Uses an ultra-fast agent to formulate web search queries via Tavily to fill in gaps in sparse notes.
* 🗄️ **Dual Storage Architecture:** Stores complete, loss-less HTML in a relational database for direct UI rendering, and chunk embeddings in a vector database for RAG matching.

---

## 🏗️ System Architecture & Workflow

```text
                                  [ User PDF Upload ]
                                           │
                                           ▼
                       ┌───────────────────────────────────────┐
                       │     Node.js Streaming Upload Route    │
                       │   Streams file to Cloudinary (`raw`) │
                       └───────────────────┬───────────────────┘
                                           │
                                           ▼
                       ┌───────────────────────────────────────┐
                       │       Multimodal Vision Ingestion     │
                       │    (pdf-img-convert ──► Qwen Vision) │
                       └───────────────────┬───────────────────┘
                                           │
                         ┌─────────────────┴─────────────────┐
                         ▼                                   ▼
             ┌───────────────────────┐           ┌───────────────────────┐
             │ Relational / Doc DB   │           │ Vector Database       │
             │ (PostgreSQL / Mongo)  │           │ (Qdrant)              │
             │ Stores raw HTML/LaTeX │           │ Chunks & Embeddings   │
             └───────────┬───────────┘           └───────────┬───────────┘
                         │                                   │
                         └─────────────────┬─────────────────┘
                                           │
                                           ▼
                       ┌───────────────────────────────────────┐
                       │        Agentic Orchestrator           │
                       └───────────────────┬───────────────────┘
                                           │
       ┌───────────────────────────────────┼───────────────────────────────────┐
       ▼                                   ▼                                   ▼
┌───────────────────────────┐ ┌───────────────────────────┐ ┌───────────────────────────┐
│ Curriculum Architect      │ │ Context Retriever         │ │ Web Research Agent        │
│ (Llama 3.3 70B + Zod)     │ │ (Qdrant + Page Windows)   │ │ (Llama 3.1 8B + Tavily)   │
└───────────────────────────┘ └───────────────────────────┘ └───────────────────────────┘
                                           │
                                           ▼
                       ┌───────────────────────────────────────┐
                       │  Pedagogical Instructor Synthesizer   │
                       │        (Llama 3.3 70B Versatile)      │
                       └───────────────────┬───────────────────┘
                                           │
                                           ▼
                             [ Dynamic Interactive Lesson ]
```

---

## 📚 Terminology & Core Concepts

To understand the codebase and system operations, familiarize yourself with these key terms:

1. **Agentic Architecture** — A software pattern where autonomous LLM instances ("Agents") are assigned specific roles, provided with tools (like search APIs or database access), and orchestrated to execute complex multi-step workflows.
2. **Retrieval-Augmented Generation (RAG)** — An AI architecture that grounds LLM responses by first retrieving relevant external documents or text chunks from a database, preventing hallucinated answers during exam prep.
3. **Page-Window Retrieval** — A specialized retrieval technique used in NeshMap. When a student views a specific chunk, the system retrieves the target chunk plus neighboring page chunks ($N-1$ and $N+1$). This ensures multi-page math derivations or long proofs remain continuous.
4. **Multimodal Vision Model** — An AI model capable of understanding both visual pixels and text simultaneously. NeshMap uses this to read handwritten strokes, informal diagrams, and handwritten equations directly from PDF image buffers.
5. **Vector Embeddings & Vector Database** — Numerical vector representations of text generated by an embedding model. A Vector Database (Qdrant) indexes these arrays to perform high-speed semantic similarity searches.
6. **Zod & Structured Outputs** — A TypeScript-first schema validation library. It is used to enforce strict JSON contracts on LLM outputs, ensuring the agents output zero conversational fluff and return valid data structures matching UI components.

---

## 🛠️ Tech Stack & Agent Matrix

### Core Stack
- **Language/Runtime:** TypeScript, Node.js, Next.js (App Router)
- **Agent Framework:** LangChain.js / `@langchain/openai`
- **File Processing:** Cloudinary (`resource_type: "raw"`), `pdf-img-convert`
- **Databases:** Qdrant (Vector DB), PostgreSQL (Relational DB)
- **Search API:** Tavily REST API

### Specialized Multi-Agent Matrix

| Agent Role | Model Choice | Responsibility |
|---|---|---|
| Vision Ingestion Agent | `qwen/qwen3.6-27b` / `qwen2.5-vl-72b` | Reads handwritten image buffers; extracts HTML, LaTeX formulas, and visual diagram captions. |
| Fast Utility Agent | `llama-3.1-8b-instant` | High-speed (~800+ tok/sec) query formulation, HTML sanitization, and web data formatting. |
| Curriculum Architect | `llama-3.3-70b-versatile` | Reads global page metadata arrays; produces de-duplicated, ordered syllabus JSON mapped to page ranges. |
| Web Research Agent | `llama-3.1-8b-instant` + Tavily | Detects missing information in notes and fetches clean external documentation and code snippets. |
| Pedagogical Synthesizer | `llama-3.3-70b-versatile` | Combines note vectors, web data, and page context into clean classroom-style lectures. |

---

## 💾 Data Storage Strategy

NeshMap implements a **Dual-Storage Pattern**:

**Relational Database (PostgreSQL / MongoDB):**
- Stores complete, loss-less HTML pages and LaTeX generated during the OCR pass.
- Stores document status, Cloudinary URLs, and the structured Syllabus JSON tree.
- Directly serves raw page views to the UI.

**Vector Database (Qdrant):**
- Stores smaller, chunked segments of page HTML.
- Payloads contain `documentId`, `pageNumber`, `moduleNumber`, and `hasEquations`.
- Used exclusively for semantic search matching when a student asks targeted questions.

---

## ⚙️ Environment Configuration

Create a `.env.local` file in your root directory and populate it with the following credentials:

```bash
# Application Settings
PORT=3000
NODE_ENV=development

# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Qdrant Vector DB
QDRANT_URL=https://your-qdrant-cluster-url.qdrant.tech
QDRANT_API_KEY=your_qdrant_api_key

# Database Connection
DATABASE_URL=postgresql://user:password@localhost:5432/neshmap_db

# Web Search API
TAVILY_API_KEY=your_tavily_api_key_here
```

---

## 🚀 Installation & Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/neshmap.git
cd neshmap

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Then populate .env.local with the credentials listed above

# 4. Run the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

```