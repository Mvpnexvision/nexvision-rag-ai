Prompt #1

You are NexVision Reasoning AI.
You help businesses understand their own documents and company data.
Rules:

1. Use only the provided context and company data.
2. Do not invent facts.
3. If the data is missing, say what is missing.
4. Always explain your reasoning.
5. Always give practical business recommendations.
6. Always include risk level.
7. Always include next action.
8. Always cite the source document or record.
9. Write in clear business English.
10. Be direct, practical, and decision-focused.

Let's say I am a developer that is completely new to RAGs. How would you explain to me how the app will extract data, chunk, embed, store in a database vector (I am also new to vector databases), and feed that to AI to generate insights and decision options to the user in which the user can agree on.

This is the example of the JSON output of the AI for the insight and recommendations:

```
{
 "direct_answer": "",
 "evidence_found": [],
 "reasoning": "",
 "recommendation": "",
 "risk_level": "Low | Medium | High | Critical",
 "business_impact": "",
 "next_action": "",
 "missing_data": [],
 "sources": []
}
```

The modules of the backend server are as follows:
Module,Responsibilities
Auth Module,"Manages login, logout, role permissions, and company access control."
Document Module,"Handles file uploads and storage; executes text extraction, document chunking, and embedding; manages summarization, deletion, and reprocessing."
RAG Module,"Receives user questions, retrieves relevant chunks from the vector database, ranks chunks, and sends context to the AI to return answers with sources."
Reasoning Module,"Analyzes retrieved evidence to compare patterns, detect problems, explain underlying causes, and identify missing data."
Recommendation Module,"Generates recommendations, determines risk levels and business impact, suggests next actions, and tracks recommendation status."
Reports Module,"Generates summaries, exports AI-generated answers and recommendation lists, and manages PDF report creation."

While the tech stack are these:
Layer,Suggestion
Frontend,"Next.js, Tailwind CSS, ShadCN UI"
Backend,Python FastAPI
Database,PostgreSQL
Vector Database,"Qdrant for control, Supabase Vector for easier Supabase integration, or Pinecone for managed vector search"
AI,OpenAI API or approved AI model/API

You are part of creating the backend server and assigned to the Document Module and RAG Module utilizing Gemini API instead of OpenAI API.

The current file structure of the server is:
.
└── server/
├── .env.example
├── .gitignore
└── requirements.txt

The requirements.txt contains:

# Web Framework

fastapi[standard]==0.136.1
uvicorn

# AI & Reasoning (Gemini 2.5 / 3.1)

google-genai>=1.55.0

# Database & Storage

supabase
python-dotenv

# Document Processing

python-multipart
pypdf

Do the following tasks:

1. Create files for the two modules and organize the structure for those.
2. Give me an overview of what each module would do and the setup needed (especially for the Supabase Vector Database).
3. Create the files for the modules ensuring that it is modular so it can be easily integrated with other modules.
4. Make sure to add comprehensive code comments explaining the functions and also utilize the automated Swagger UI API Docs that FastAPI natively has.

Prompt #2
More specific information have been specified and these are as follows:

- Supported file formats: PDF, DOCX, XLSX, CSV, and TXT.
- File must be stored then uploaded (metadata and file path or URL).
- When processing the document, use these statuses that will be reflected in the database so that it can have specific actions depending on the status:
    - Uploaded: File was received and saved.
    - Extracting: The system is reading text or structured data from the file.
    - Chunking: The system is splitting content into smaller searchable parts.
    - Embedded: The system has created embeddings for the chunks.
    - AI Ready: The document can now be used by AI Chat and AI Insights.
    - Failed: Processing failed. The user should be allowed to reprocess or upload a cleaner file.
- The suggested database tables are as follows:
    - companies: company_name, business_line, industry, created_at
    - users: company_id, name, email, role, status, created_at (uses Supabase Auth)
    - Before this point, the tables are generally for Auth
    - documents: company_id, uploaded_by, file_name, file_type, file_url, business_line, department, category, tags, access_level, processing_status, summary, created_at
    - documents: company_id, uploaded_by, file_name, file_type, file_url, business_line, department, category, tags, access_level, processing_status, summary, created_at
    - document_chunks: document_id, company_id, chunk_text, chunk_index, page_number, embedding_id, metadata_json, created_at
    - After this point, the other tables are generally for other modules
    - ai_questions: company_id, user_id, question, answer, reasoning, recommendation, risk_level, sources_json, created_at
    - recommendations: company_id, business_line, title, problem, evidence, reasoning, recommendation, risk_level, business_impact, next_action, status, created_by_ai, created_at
    - reports: company_id, report_type, title, content, generated_by, created_at
    - structured_records: company_id, business_line, record_type, record_json, created_at
- The suggested API endpoints are as follows:
    - POST /auth/login
    - POST documents/upload
    - POST /documents/{id}/process
    - GET /documents
    - POST /ai/chat
    - GET /ai/questions
    - POST /insights/generate
    - GET /recommendations
    - PATCH /recommendations/{id}
    - POST /reports/generate

<!-- prettier-ignore -->
server/
├── main.py                          ← FastAPI app entry point, registers all routers
├── .env.example                     ← All environment variables documented
├── supabase_setup.sql               ← Run once in Supabase SQL Editor
│
├── core/                            ← Shared infrastructure (no business logic)
│   ├── config.py                    ← Typed settings loaded from .env
│   ├── gemini_client.py             ← Gemini SDK init + model accessors
│   └── supabase_client.py           ← Supabase singleton client
│
└── modules/
    ├── shared/
    │   └── schemas.py               ← DocumentChunk and ErrorResponse (shared types)
    │
    ├── document_module/
    │   ├── router.py                ← 5 HTTP endpoints (upload, list, delete, reprocess, summarise)
    │   ├── schemas.py               ← Request/response types for this module
    │   └── services/
    │       ├── extractor.py         ← STAGE 1: PDF/TXT → plain text
    │       ├── chunker.py           ← STAGE 2: text → overlapping word chunks
    │       ├── embedder.py          ← STAGE 3: chunks → 768-float vectors (Gemini)
    │       └── vector_store.py      ← STAGE 4 & 5: store + retrieve from Supabase pgvector
    │
    └── rag_module/
        ├── router.py                ← 3 HTTP endpoints (query, decision, health)
        ├── schemas.py               ← RAGQueryRequest, NexVisionInsight, UserDecision
        └── services/
            ├── retriever.py         ← Embed query → cosine search → return chunks
            └── generator.py         ← Chunks + question → Gemini → NexVisionInsight JSON

<!-- prettier-ignore -->
Updated file tree:
server/
├── main.py                          ← Updated router prefixes to match spec paths
├── requirements.txt                 ← Added: python-docx, openpyxl, pandas
├── .env.example                     ← Added: SUPABASE_STORAGE_BUCKET
├── supabase_setup.sql               ← Complete rewrite — all 8 spec tables
│
├── core/
│   ├── config.py                    ← Added: SUPABASE_STORAGE_BUCKET setting
│   ├── gemini_client.py             ← Unchanged
│   └── supabase_client.py           ← Unchanged
│
└── modules/
    ├── document_module/
    │   ├── schemas.py               ← Rewritten — new fields, status enum, FileType
    │   ├── router.py                ← Rewritten — upload and process now separate endpoints
    │   └── services/
    │       ├── extractor.py         ← Rewritten — adds DOCX, XLSX, CSV parsers
    │       ├── chunker.py           ← Updated — [SHEET:] and [ROW N] markers, extra_metadata
    │       ├── embedder.py          ← Unchanged
    │       ├── vector_store.py      ← Rewritten — aligned to new column names (chunk_text, metadata_json)
    │       ├── storage.py           ← NEW — Supabase Storage upload/download/delete/signed URL
    │       └── status.py            ← NEW — set_status() updates processing_status in DB
    │
    └── rag_module/
        ├── schemas.py               ← Rewritten — AIChatRequest/Response, InsightGenerate, ai_questions
        ├── router.py                ← Rewritten — /ai/chat, /ai/questions, /insights/generate
        └── services/
            ├── retriever.py         ← Updated — reads chunk_text and metadata_json
            └── generator.py         ← Updated — chunk.chunk_text, [SHEET] in citations, insight mode
