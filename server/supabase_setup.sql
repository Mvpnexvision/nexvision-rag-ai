-- ============================================================
-- NexVision — Supabase Database Setup (v2)
-- ============================================================
-- Run this entire script ONCE in Supabase SQL Editor:
--   Supabase Dashboard → SQL Editor → New Query → Paste → Run
--
-- Table groups (per product spec):
--   AUTH GROUP       → companies, users (Supabase Auth)
--   DOCUMENT GROUP   → documents, document_chunks (pgvector)
--   AI GROUP         → ai_questions, recommendations, reports, structured_records
--
-- Prerequisites:
--   1. Supabase Auth must be enabled (it is by default)
--   2. Run this script before starting the backend server
--   3. Create a Storage bucket named "documents" (or your SUPABASE_STORAGE_BUCKET value)
-- ============================================================


-- ============================================================
-- STEP 0: Enable required extensions
-- ============================================================

-- pgvector: adds vector column type and cosine similarity operators
create extension if not exists vector;

-- uuid-ossp: for gen_random_uuid() — usually pre-installed in Supabase
create extension if not exists "uuid-ossp";


-- ============================================================
-- AUTH GROUP
-- ============================================================


-- ------------------------------------------------------------
-- Table: companies
-- Stores the top-level company accounts.
-- Each company owns its own documents, questions, and recommendations.
-- ------------------------------------------------------------
create table if not exists companies (
    id            uuid primary key default gen_random_uuid(),
    company_name  text not null,
    business_line text,                         -- e.g. "Retail", "Manufacturing", "Finance"
    industry      text,                         -- e.g. "FMCG", "Banking", "Healthcare"
    created_at    timestamptz default now()
);

comment on table companies is
    'Top-level company accounts. Every other record is scoped to a company.';


-- ------------------------------------------------------------
-- Table: users
-- Application user profiles, linked to Supabase Auth.
-- auth.users is Supabase's internal auth table — this table extends it
-- with application-specific fields (company, role, status).
-- ------------------------------------------------------------
create table if not exists users (
    id            uuid primary key references auth.users(id) on delete cascade,
    company_id    uuid not null references companies(id) on delete cascade,
    name          text not null,
    email         text not null unique,
    role          text not null default 'viewer',   -- 'admin' | 'analyst' | 'viewer'
    status        text not null default 'active',   -- 'active' | 'inactive' | 'suspended'
    created_at    timestamptz default now()
);

comment on table users is
    'Application user profiles extending Supabase Auth. '
    'Linked 1:1 to auth.users via the same UUID.';

create index if not exists users_company_idx on users (company_id);
create index if not exists users_email_idx   on users (email);


-- ============================================================
-- DOCUMENT GROUP
-- ============================================================


-- ------------------------------------------------------------
-- Table: documents
-- Metadata record for every uploaded document.
-- The file itself lives in Supabase Storage; file_url is the storage path.
--
-- processing_status tracks pipeline progress (per spec):
--   Uploaded → Extracting → Chunking → Embedded → AI Ready | Failed
-- ------------------------------------------------------------
create table if not exists documents (
    id                 uuid primary key default gen_random_uuid(),
    company_id         uuid not null references companies(id) on delete cascade,
    uploaded_by        uuid not null references users(id) on delete set null,
    file_name          text not null,
    file_type          text not null,         -- 'PDF' | 'DOCX' | 'XLSX' | 'CSV' | 'TXT'
    file_url           text not null,         -- Supabase Storage path, e.g. "company_id/doc_id/file.pdf"
    business_line      text,                  -- optional classification
    department         text,                  -- e.g. "Finance", "HR", "Operations"
    category           text,                  -- e.g. "Quarterly Report", "Contract", "Invoice"
    tags               text[] default '{}',   -- free-form tag array for filtering
    access_level       text not null default 'company',  -- 'company' | 'department' | 'private'
    processing_status  text not null default 'Uploaded', -- see pipeline statuses above
    summary            text,                  -- AI-generated summary (set on AI Ready)
    created_at         timestamptz default now(),

    -- Enforce valid processing_status values
    constraint documents_status_check check (
        processing_status in ('Uploaded', 'Extracting', 'Chunking', 'Embedded', 'AI Ready', 'Failed')
    ),
    -- Enforce valid file types
    constraint documents_type_check check (
        file_type in ('PDF', 'DOCX', 'XLSX', 'CSV', 'TXT')
    ),
    -- Enforce valid access levels
    constraint documents_access_check check (
        access_level in ('company', 'department', 'private')
    )
);

comment on table documents is
    'Metadata for every uploaded document. '
    'File content is stored in Supabase Storage (file_url). '
    'processing_status tracks the ingestion pipeline stage.';

create index if not exists documents_company_idx    on documents (company_id);
create index if not exists documents_status_idx     on documents (processing_status);
create index if not exists documents_uploader_idx   on documents (uploaded_by);
create index if not exists documents_dept_idx       on documents (department);


-- ------------------------------------------------------------
-- Table: document_chunks
-- The vector database table — core of the RAG pipeline.
-- Each row = one text chunk + its 768-dimensional embedding.
--
-- `embedding` is the pgvector column used for cosine similarity search.
-- `metadata_json` holds source_file, page_number, sheet_name, etc.
-- ------------------------------------------------------------
create table if not exists document_chunks (
    id             uuid primary key default gen_random_uuid(),
    document_id    uuid not null references documents(id) on delete cascade,
    company_id     uuid not null references companies(id) on delete cascade,
    chunk_text     text not null,             -- the actual text content of the chunk
    chunk_index    int not null,              -- 0-based position in the parent document
    page_number    int,                       -- page/row number for citation (nullable)
    embedding_id   text,                     -- label: "gemini/{chunk_id}" tracks which model made this
    metadata_json  jsonb,                    -- source_file, sheet_name, extra context
    embedding      vector(768),              -- 768-dim vector from Gemini text-embedding-004
    created_at     timestamptz default now()
);

comment on table document_chunks is
    'Vector database table. Each row is one text segment from a document '
    'plus its 768-dimensional embedding for semantic similarity search.';

-- IVFFlat index for fast approximate nearest-neighbour vector search
-- lists=100 is appropriate for up to ~1M rows. Increase for larger datasets.
create index if not exists document_chunks_embedding_idx
    on document_chunks using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);

create index if not exists document_chunks_document_idx on document_chunks (document_id);
create index if not exists document_chunks_company_idx  on document_chunks (company_id);


-- ------------------------------------------------------------
-- Function: match_documents
-- Called by the RAG module's vector_search() to find the top-K
-- most semantically similar chunks for a given query vector.
--
-- Parameters:
--   query_embedding  — 768-float vector of the user's question
--   match_count      — top-K results to return
--   filter_company   — UUID of the company (access control boundary)
--
-- Returns rows ordered by cosine similarity descending (most relevant first).
-- `similarity` = 1 - cosine_distance (range 0–1; 1.0 = identical).
-- ------------------------------------------------------------
create or replace function match_documents(
    query_embedding  vector(768),
    match_count      int,
    filter_company   text          -- accepts UUID as text for flexible casting
)
returns table (
    id             uuid,
    document_id    uuid,
    company_id     uuid,
    chunk_text     text,
    chunk_index    int,
    page_number    int,
    metadata_json  jsonb,
    similarity     float
)
language sql stable
as $$
    select
        id,
        document_id,
        company_id,
        chunk_text,
        chunk_index,
        page_number,
        metadata_json,
        1 - (embedding <=> query_embedding) as similarity
    from document_chunks
    where company_id = filter_company::uuid
    order by embedding <=> query_embedding    -- ascending distance = descending similarity
    limit match_count;
$$;

comment on function match_documents is
    'Cosine similarity vector search over document_chunks, scoped by company. '
    'Called by the RAG module retriever via Supabase RPC.';


-- ============================================================
-- AI GROUP
-- ============================================================


-- ------------------------------------------------------------
-- Table: ai_questions
-- Audit log of every AI question asked and its full structured answer.
-- Written by the RAG module after every /ai/chat or /insights/generate call.
-- ------------------------------------------------------------
create table if not exists ai_questions (
    id              uuid primary key default gen_random_uuid(),
    company_id      uuid not null references companies(id) on delete cascade,
    user_id         uuid references users(id) on delete set null,
    question        text not null,
    answer          text,                  -- direct_answer from NexVisionInsight
    reasoning       text,
    recommendation  text,
    risk_level      text,                  -- 'Low' | 'Medium' | 'High' | 'Critical'
    sources_json    jsonb,                 -- array of source citation strings
    created_at      timestamptz default now()
);

comment on table ai_questions is
    'Audit log of all AI questions and structured answers. '
    'Populated by /ai/chat and /insights/generate endpoints.';

create index if not exists ai_questions_company_idx    on ai_questions (company_id);
create index if not exists ai_questions_user_idx       on ai_questions (user_id);
create index if not exists ai_questions_risk_idx       on ai_questions (risk_level);


-- ------------------------------------------------------------
-- Table: recommendations
-- Formal recommendation records created from AI insights.
-- Managed by the Recommendation Module (future).
-- Users can update status (e.g. pending → in_progress → resolved).
-- ------------------------------------------------------------
create table if not exists recommendations (
    id               uuid primary key default gen_random_uuid(),
    company_id       uuid not null references companies(id) on delete cascade,
    business_line    text,
    title            text not null,
    problem          text,                 -- description of the identified problem
    evidence         text,                 -- supporting evidence from documents
    reasoning        text,
    recommendation   text not null,
    risk_level       text not null,        -- 'Low' | 'Medium' | 'High' | 'Critical'
    business_impact  text,
    next_action      text,
    status           text not null default 'pending',  -- 'pending' | 'in_progress' | 'resolved' | 'dismissed'
    created_by_ai    boolean default true,
    created_at       timestamptz default now(),

    constraint recommendations_risk_check check (
        risk_level in ('Low', 'Medium', 'High', 'Critical')
    ),
    constraint recommendations_status_check check (
        status in ('pending', 'in_progress', 'resolved', 'dismissed')
    )
);

comment on table recommendations is
    'Formal recommendations created from AI insights. '
    'Status is updated by users via PATCH /recommendations/{id}.';

create index if not exists recommendations_company_idx  on recommendations (company_id);
create index if not exists recommendations_status_idx   on recommendations (status);
create index if not exists recommendations_risk_idx     on recommendations (risk_level);


-- ------------------------------------------------------------
-- Table: reports
-- Generated reports (PDF summaries, recommendation exports, etc.).
-- Managed by the Reports Module (future).
-- ------------------------------------------------------------
create table if not exists reports (
    id            uuid primary key default gen_random_uuid(),
    company_id    uuid not null references companies(id) on delete cascade,
    report_type   text not null,           -- 'summary' | 'recommendation_list' | 'ai_answers' | 'pdf'
    title         text not null,
    content       text,                   -- report body (markdown or HTML)
    generated_by  uuid references users(id) on delete set null,
    created_at    timestamptz default now()
);

comment on table reports is
    'Generated reports and exports. Managed by the Reports Module.';

create index if not exists reports_company_idx on reports (company_id);
create index if not exists reports_type_idx    on reports (report_type);


-- ------------------------------------------------------------
-- Table: structured_records
-- Stores structured data extracted from XLSX/CSV files as typed JSON records.
-- Used when a document contains tabular data that should be queryable
-- as records (e.g. sales figures, inventory, HR data) rather than just text.
-- ------------------------------------------------------------
create table if not exists structured_records (
    id             uuid primary key default gen_random_uuid(),
    company_id     uuid not null references companies(id) on delete cascade,
    business_line  text,
    record_type    text not null,          -- e.g. 'sales', 'inventory', 'headcount', 'invoice'
    record_json    jsonb not null,         -- the structured record data
    created_at     timestamptz default now()
);

comment on table structured_records is
    'Typed JSON records extracted from structured files (XLSX, CSV). '
    'Enables record-level queries beyond full-text vector search.';

create index if not exists structured_records_company_idx on structured_records (company_id);
create index if not exists structured_records_type_idx    on structured_records (record_type);
-- GIN index for efficient JSONB field queries (e.g. record_json->>'vendor' = 'ACME')
create index if not exists structured_records_json_idx
    on structured_records using gin (record_json);


-- ============================================================
-- SUPABASE STORAGE: create the documents bucket
-- ============================================================
-- Run this separately in Supabase Dashboard → Storage → New Bucket
-- OR uncomment the line below if your Supabase project supports it:
--
-- insert into storage.buckets (id, name, public)
-- values ('documents', 'documents', false)
-- on conflict (id) do nothing;
--
-- The bucket must be PRIVATE (public = false).
-- Files are accessed via signed URLs generated by the backend.


-- ============================================================
-- Setup complete.
-- Your Supabase database is ready for NexVision v2.
-- ============================================================