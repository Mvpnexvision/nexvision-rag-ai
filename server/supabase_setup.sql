-- ============================================================
-- NexVision — Supabase Database Setup (v3)
-- ============================================================
-- Run this entire script ONCE in Supabase SQL Editor:
--   Supabase Dashboard → SQL Editor → New Query → Paste → Run
--
-- Table groups (per product spec):
--   AUTH GROUP       → companies, users (Supabase Auth)
--   DOCUMENT GROUP   → documents, document_chunks (pgvector)
--   AI GROUP         → ai_chats, ai_chat_documents, ai_questions,
--                      recommendations, reports, structured_records
--
-- Prerequisites:
--   1. Supabase Auth must be enabled (it is by default)
--   2. Run this script before starting the backend server
--   3. Create a Storage bucket named "documents" (or your SUPABASE_STORAGE_BUCKET value)
-- ============================================================


-- ============================================================
-- STEP 0: Enable required extensions
-- ============================================================

create extension if not exists vector;
create extension if not exists "uuid-ossp";


-- ============================================================
-- AUTH GROUP
-- ============================================================


-- ------------------------------------------------------------
-- Table: companies
-- ------------------------------------------------------------
create table if not exists companies (
    id            uuid primary key default gen_random_uuid(),
    company_name  text not null,
    business_line text,
    industry      text,
    created_at    timestamptz default now()
);

comment on table companies is
    'Top-level company accounts. Every other record is scoped to a company.';


-- ------------------------------------------------------------
-- Table: users
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
    'Application user profiles extending Supabase Auth.';

create index if not exists users_company_idx on users (company_id);
create index if not exists users_email_idx   on users (email);


-- ============================================================
-- DOCUMENT GROUP
-- ============================================================


-- ------------------------------------------------------------
-- Table: documents
-- ------------------------------------------------------------
create table if not exists documents (
    id                 uuid primary key default gen_random_uuid(),
    company_id         uuid not null references companies(id) on delete cascade,
    uploaded_by        uuid not null references users(id) on delete set null,
    file_name          text not null,
    file_type          text not null,
    file_url           text not null,
    business_line      text,
    department         text,
    category           text,
    tags               text[] default '{}',
    access_level       text not null default 'company',
    processing_status  text not null default 'Uploaded',
    summary            text,
    created_at         timestamptz default now(),

    constraint documents_status_check check (
        processing_status in ('Uploaded', 'Extracting', 'Chunking', 'Embedded', 'AI Ready', 'Failed')
    ),
    constraint documents_type_check check (
        file_type in ('PDF', 'DOCX', 'XLSX', 'CSV', 'TXT')
    ),
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
-- ------------------------------------------------------------
create table if not exists document_chunks (
    id             uuid primary key default gen_random_uuid(),
    document_id    uuid not null references documents(id) on delete cascade,
    company_id     uuid not null references companies(id) on delete cascade,
    chunk_text     text not null,
    chunk_index    int not null,
    page_number    int,
    embedding_id   text,
    metadata_json  jsonb,
    embedding      vector(1536),
    created_at     timestamptz default now()
);

comment on table document_chunks is
    'Vector database table. Each row is one text segment from a document '
    'plus its 1536-dimensional embedding for semantic similarity search.';

create index if not exists document_chunks_embedding_idx
    on document_chunks using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);

create index if not exists document_chunks_document_idx on document_chunks (document_id);
create index if not exists document_chunks_company_idx  on document_chunks (company_id);


-- ------------------------------------------------------------
-- Function: match_documents
-- ------------------------------------------------------------
create or replace function match_documents(
    query_embedding  vector(1536),
    match_count      int,
    filter_company   text,
    filter_documents  uuid[] default null   -- optional: scope to specific document IDs
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
language sql STABLE
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
      and (
          filter_documents is null              -- no filter = search all company docs
          or document_id = ANY(filter_documents) -- filter = search only chat's docs
      )
    order by embedding <=> query_embedding
    limit match_count;
$$;

comment on function match_documents is
    'Cosine similarity vector search over document_chunks, scoped by company. '
    'Optionally scoped to a specific set of document IDs (for per-chat context). '
    'Pass filter_documents => NULL to search all company documents.';


-- ============================================================
-- AI GROUP
-- ============================================================


-- ------------------------------------------------------------
-- Table: ai_chats
-- One row per conversation session (like a Claude or ChatGPT thread).
-- A chat belongs to one user and one company.
-- Documents are linked via ai_chat_documents (many-to-many).
-- All messages (ai_questions) in a chat share the same document context.
-- ------------------------------------------------------------
create table if not exists ai_chats (
    id          uuid primary key default gen_random_uuid(),
    company_id  uuid not null references companies(id) on delete cascade,
    user_id     uuid not null references users(id) on delete cascade,
    title       text not null default 'New Chat',
                                            -- auto-generated from first message or user-defined
    created_at  timestamptz default now(),
    updated_at  timestamptz default now()   -- bumped on every new message
);

comment on table ai_chats is
    'A conversation session. Holds a title, owner, and links to context documents. '
    'Messages are stored in ai_questions with a chat_id FK.';

create index if not exists ai_chats_company_idx on ai_chats (company_id);
create index if not exists ai_chats_user_idx    on ai_chats (user_id);
create index if not exists ai_chats_updated_idx on ai_chats (updated_at desc);


-- ------------------------------------------------------------
-- Table: ai_chat_documents
-- Junction table — links documents to a chat as context sources.
-- A chat can have many documents; a document can appear in many chats.
-- The RAG retriever filters vector search to only these document IDs
-- when answering questions in that chat.
-- ------------------------------------------------------------
create table if not exists ai_chat_documents (
    id          uuid primary key default gen_random_uuid(),
    chat_id     uuid not null references ai_chats(id) on delete cascade,
    document_id uuid not null references documents(id) on delete cascade,
    added_at    timestamptz default now(),

    -- prevent the same document being added to the same chat twice
    constraint ai_chat_documents_unique unique (chat_id, document_id)
);

comment on table ai_chat_documents is
    'Junction table linking documents to chat sessions as context sources. '
    'The RAG pipeline uses these document IDs to scope vector search per chat.';

create index if not exists ai_chat_documents_chat_idx     on ai_chat_documents (chat_id);
create index if not exists ai_chat_documents_document_idx on ai_chat_documents (document_id);


-- ------------------------------------------------------------
-- Table: ai_questions
-- One row per message exchange (user question + AI answer).
-- Now linked to a chat via chat_id so messages belong to a thread.
-- ------------------------------------------------------------
create table if not exists ai_questions (
    id              uuid primary key default gen_random_uuid(),
    chat_id         uuid references ai_chats(id) on delete cascade,
                                            -- nullable for backwards compat with direct /ai/chat calls
    company_id      uuid not null references companies(id) on delete cascade,
    user_id         uuid references users(id) on delete set null,
    question        text not null,
    answer          text,
    reasoning       text,
    recommendation  text,
    risk_level      text,                   -- 'Low' | 'Medium' | 'High' | 'Critical'
    sources_json    jsonb,
    created_at      timestamptz default now()
);

comment on table ai_questions is
    'One row per question/answer exchange. Linked to a chat session via chat_id. '
    'chat_id is nullable to support legacy direct /ai/chat calls without a session.';

create index if not exists ai_questions_chat_idx    on ai_questions (chat_id);
create index if not exists ai_questions_company_idx on ai_questions (company_id);
create index if not exists ai_questions_user_idx    on ai_questions (user_id);
create index if not exists ai_questions_risk_idx    on ai_questions (risk_level);


-- ------------------------------------------------------------
-- Table: recommendations
-- ------------------------------------------------------------
create table if not exists recommendations (
    id               uuid primary key default gen_random_uuid(),
    company_id       uuid not null references companies(id) on delete cascade,
    business_line    text,
    title            text not null,
    problem          text,
    evidence         text,
    reasoning        text,
    recommendation   text not null,
    risk_level       text not null,
    business_impact  text,
    next_action      text,
    status           text not null default 'pending',
    created_by_ai    boolean default true,
    created_at       timestamptz default now(),

    constraint recommendations_risk_check check (
        risk_level in ('Low', 'Medium', 'High', 'Critical')
    ),
    constraint recommendations_status_check check (
        status in ('pending', 'in_progress', 'resolved', 'dismissed')
    )
);

create index if not exists recommendations_company_idx on recommendations (company_id);
create index if not exists recommendations_status_idx  on recommendations (status);
create index if not exists recommendations_risk_idx    on recommendations (risk_level);


-- ------------------------------------------------------------
-- Table: reports
-- ------------------------------------------------------------
create table if not exists reports (
    id            uuid primary key default gen_random_uuid(),
    company_id    uuid not null references companies(id) on delete cascade,
    report_type   text not null,
    title         text not null,
    content       text,
    generated_by  uuid references users(id) on delete set null,
    created_at    timestamptz default now()
);

create index if not exists reports_company_idx on reports (company_id);
create index if not exists reports_type_idx    on reports (report_type);


-- ------------------------------------------------------------
-- Table: structured_records
-- ------------------------------------------------------------
create table if not exists structured_records (
    id             uuid primary key default gen_random_uuid(),
    company_id     uuid not null references companies(id) on delete cascade,
    business_line  text,
    record_type    text not null,
    record_json    jsonb not null,
    created_at     timestamptz default now()
);

create index if not exists structured_records_company_idx on structured_records (company_id);
create index if not exists structured_records_type_idx    on structured_records (record_type);
create index if not exists structured_records_json_idx
    on structured_records using gin (record_json);