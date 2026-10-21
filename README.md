# neshmap 🚀

**neshmap** is an AI-powered, agentic, adaptive learning platform designed to turn standard PDF textbooks and study materials into interactive, personalized learning environments. By combining vector indexing (RAG), Socratic AI tutoring, dynamic syllabus generation, and student mastery analytics, **neshmap** guides learners through course materials at their own pace with tailored guidance and real-time feedback.

## ✨ Features

* **📄 Intelligent PDF Ingestion & Chunking**: Upload complex PDF documents and textbooks, automatically parsing and vector-indexing content for precise semantic retrieval.

* **🗺️ Agentic Curriculum & Roadmap Generation**: Generates structured course modules, topics, key learning points, and estimated completion times directly from study materials.

* **💬 Socratic AI Agent Workspace**: An interactive, split-screen workspace with SSE (Server-Sent Events) token streaming for real-time Socratic dialogue and topic explanation.

* **🛡️ Built-in Security & Domain Guardrails**: Protects against prompt injections and enforces strict context domain checks to keep interactions focused on study content.

* **📊 Student Mastery Analytics**: Interactive dashboard featuring overall progress scores, module completion tracking, weakness flags, and a radar chart visualization (via Recharts).

* **🛠️ Central Agent Orchestration**: Features a multi-tool gateway that orchestrates web searches, dynamic syllabus building, and targeted quiz assessments.

## 🛠️ Tech Stack

### Frontend

* **Framework**: Next.js 14+ (App Router, TypeScript)

* **Styling**: Tailwind CSS

* **Icons**: Lucide React

* **Data Visualization**: Recharts

* **HTTP Client**: Axios

### Backend

* **Runtime**: Node.js & Express (TypeScript)

* **Database**: MongoDB with Mongoose ORM

* **Streaming**: Server-Sent Events (SSE)

* **AI Integration**: Vector Store / Embedding Services & Multi-Agent Tool Orchestration

## 📁 Repository Structure

```
neshmap/
├── my-app/ (or root Next.js App)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                       # Onboarding & Document Upload Page
│   │   │   ├── workspace/[documentId]/        # Split-screen PDF & Chat Workspace
│   │   │   └── analytics/[documentId]/        # Student Mastery & Analytics Dashboard
│   │   ├── components/                        # UI Components (Interactive Roadmap, etc.)
│   │   ├── hooks/                             # SSE Streaming Custom Hooks (useAgentStream)
│   │   └── lib/                               # API Client Interceptors & Utils
│   ├── tsconfig.json
│   └── package.json
│
└── server/
    ├── src/
    │   ├── controllers/                       # Analytics, Agent, & Document Controllers
    │   ├── models/                            # Mongoose Schemas (Roadmap, Analytics, Student)
    │   ├── services/                          # RAG & AI Orchestration Logic
    │   └── app.ts                             # Express Server Entrypoint
    └── package.json

```

## 🚀 Getting Started

### Prerequisites

* Node.js (v18.x or higher)

* npm or yarn

* MongoDB Instance (Local or MongoDB Atlas)

### Installation & Setup

1. **Clone the Repository**

   ```
   git clone https://github.com/your-username/neshmap.git
   cd neshmap
   
   ```

2. **Backend Setup**

   ```
   cd server
   npm install
   
   ```

   Create a `.env` file in the `server/` directory:

   ```
   PORT=8000
   MONGODB_URI=mongodb://localhost:27017/neshmap
   OPENAI_API_KEY=your_openai_api_key_here
   
   ```

   Start the development backend server:

   ```
   npm run dev
   
   ```

3. **Frontend Setup**

   ```
   cd ../frontend
   npm install
   
   ```

   Create a `.env.local` file in the `frontend/` directory:

   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   
   ```

   Start the Next.js development server:

   ```
   npm run dev
   
   ```

4. **Access the Application**
   Open your browser and navigate to `http://localhost:3000`.

## 🤝 Usage Workflow

1. **Onboarding**: Enter your student profile details and upload a PDF textbook or study module.

2. **Roadmap Generation**: **neshmap** processes the file, builds a vector index, and extracts a structured syllabus roadmap.

3. **Interactive Socratic Dialogue**: Select topics from the roadmap or ask open-ended questions in the chat workspace.

4. **Track Performance**: Visit the Analytics tab to view mastery percentages, module progress bars, and active weakness radar areas.

## 📜 License

This project is licensed under the [MIT License](LICENSE).