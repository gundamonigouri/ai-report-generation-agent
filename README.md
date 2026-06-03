# Autonomous AI Report Generation Agent

A production-ready full-stack application that generates professional, citation-backed research reports using a multi-agent LangGraph workflow, RAG over ChromaDB, and the Groq API.

## Features

### Multi-Agent Pipeline

1. Planning Agent - analyzes the topic and creates a structured report outline.
2. Research Agent - retrieves context from uploaded documents and the vector store.
3. Writer Agent - generates citation-backed report sections.
4. Reviewer Agent - improves readability, grammar, consistency, and hallucination risk.
5. Citation Verifier Agent - maps claims to source references.

### Core Platform

- JWT authentication with Admin/User RBAC.
- Document upload for PDF, DOCX, and TXT files.
- Automatic parsing, chunking, embeddings, ChromaDB indexing, and semantic search.
- Report history with PDF and DOCX export.
- Admin analytics dashboard for users, reports, topics, documents, and agent execution.
- AI evaluation metrics: relevance, faithfulness, hallucination risk, citation coverage, retrieval accuracy, quality, and feedback.
- LLMOps: prompt logs, token tracking, cost monitoring, latency, failures, and model analytics.

### Security

- Prompt injection detection.
- Input validation and sanitization.
- Secure file validation and size limits.
- Rate limiting, Helmet, mongo-sanitize, audit logs, and sensitive data masking.

## Project Structure

```text
client/              React + Vite + Tailwind frontend for Vercel
server/              Express API for Render
docs/                Architecture and deployment docs
docker-compose.yml   Local ChromaDB service
```

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas connection string
- Groq API key
- Docker, if you want local ChromaDB

### ChromaDB

```bash
docker compose up -d chromadb
```

### Backend

```bash
cd server
copy .env.example .env
npm install
npm run seed:admin
npm run dev
```

Set `MONGODB_URI`, `JWT_SECRET`, `GROQ_API_KEY`, and `CLIENT_URL` in `server/.env`.

### Frontend

```bash
cd client
copy .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

Default seeded admin: `admin@reportagent.com` with the value from `ADMIN_PASSWORD`.

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/documents` | List documents |
| POST | `/api/documents/upload` | Upload document |
| POST | `/api/reports/generate` | Generate report |
| GET | `/api/reports/:id/export/pdf` | Download PDF |
| GET | `/api/reports/:id/export/docx` | Download DOCX |
| GET | `/api/analytics/dashboard` | Dashboard stats |
| GET | `/api/analytics/llm-ops` | LLMOps logs |

## Deployment

- Frontend: deploy `client/` to Vercel.
- Backend: deploy `server/` to Render.
- Database: MongoDB Atlas.
- Vector store: ChromaDB Cloud or a hosted Chroma instance.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for details.

## License

MIT
