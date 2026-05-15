-- ============================================================
-- NexVision — Supabase Database Setup (v5)
-- ============================================================
-- BREAKING CHANGES from v4:
--   - recommendations: removed assigned_to, due_date, notes
--     (only status is tracked — no user assignment workflow)
--
-- Run this entire script ONCE in Supabase SQL Editor.
-- If migrating from v4, see the migration notes at the bottom.
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
-- No changes from v4
-- ------------------------------------------------------------
create table if not exists companies (
    id            uuid primary key default gen_random_uuid(),
    company_name  text not null,
    business_line text not null default 'custom business',
    created_at    timestamptz default now(),

    constraint companies_business_line_check check (
        business_line in (
            'hr/admin',
            'logistics',
            'retail',
            'clinic/aesthetic',
            'construction/equipment',
            'custom business'
        )
    )
);

comment on table companies is
    'Top-level company accounts. Every other record is scoped to a company. '
    'business_line is used as AI prompt context for more relevant responses.';


-- ------------------------------------------------------------
-- Table: users
-- No changes from v4
-- ------------------------------------------------------------
create table if not exists users (
    id            uuid primary key references auth.users(id) on delete cascade,
    company_id    uuid references companies(id) on delete cascade,
    name          text not null,
    email         text not null unique,
    role          text not null default 'admin',
    status        text not null default 'active',
    created_at    timestamptz default now(),

    constraint users_role_check check (
        role in ('superadmin', 'admin')
    ),
    constraint users_status_check check (
        status in ('active', 'inactive')
    )
);

comment on table users is
    'Application user profiles extending Supabase Auth. '
    'Only two roles exist: superadmin and admin.';

create index if not exists users_company_idx on users (company_id);
create index if not exists users_email_idx   on users (email);


-- ------------------------------------------------------------
-- Function: handle_new_auth_user
-- No changes from v4
-- ------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.users (
        id,
        company_id,
        name,
        email,
        role,
        status
    )
    values (
        new.id,
        nullif(new.raw_user_meta_data->>'company_id', '')::uuid,
        coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        new.email,
        coalesce(new.raw_user_meta_data->>'role', 'admin'),
        'active'
    );
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_auth_user();


-- ============================================================
-- DOCUMENT GROUP
-- ============================================================


-- ------------------------------------------------------------
-- Table: documents
-- No changes from v4
-- ------------------------------------------------------------
create table if not exists documents (
    id                 uuid primary key default gen_random_uuid(),
    company_id         uuid not null references companies(id) on delete cascade,
    uploaded_by        uuid not null references users(id) on delete cascade,
    file_name          text not null,
    file_type          text not null,
    file_url           text not null,
    tags               text[] default '{}',
    processing_status  text not null default 'Uploaded',
    summary            text,
    is_context_file    boolean not null default false,
    created_at         timestamptz default now(),

    constraint documents_status_check check (
        processing_status in ('Uploaded', 'Extracting', 'Chunking', 'Embedded', 'AI Ready', 'Failed')
    ),
    constraint documents_type_check check (
        file_type in ('PDF', 'DOCX', 'XLSX', 'CSV', 'TXT', 'MD')
    )
);

comment on table documents is
    'Metadata for every uploaded document. '
    'is_context_file = true means the file is a .md business context file '
    'injected directly into the AI prompt — not processed through RAG.';

create index if not exists documents_company_idx    on documents (company_id);
create index if not exists documents_status_idx     on documents (processing_status);
create index if not exists documents_uploader_idx   on documents (uploaded_by);
create index if not exists documents_context_idx    on documents (is_context_file);


-- ------------------------------------------------------------
-- Table: document_chunks
-- No changes from v4
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
    'plus its 1536-dimensional embedding for semantic similarity search. '
    'Context files (.md) do not produce rows here.';

create index if not exists document_chunks_embedding_idx
    on document_chunks using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);

create index if not exists document_chunks_document_idx on document_chunks (document_id);
create index if not exists document_chunks_company_idx  on document_chunks (company_id);


-- ------------------------------------------------------------
-- Function: match_documents
-- No changes from v4
-- ------------------------------------------------------------
create or replace function match_documents(
    query_embedding   vector(1536),
    match_count       int,
    filter_company    text,
    filter_documents  uuid[] default null
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
      and (
          filter_documents is null
          or document_id = any(filter_documents)
      )
    order by embedding <=> query_embedding
    limit match_count;
$$;

comment on function match_documents is
    'Cosine similarity vector search over document_chunks, scoped by company. '
    'Pass filter_documents to search only within a specific chat context. '
    'Pass filter_documents => NULL to search all company documents.';


-- ============================================================
-- AI GROUP
-- ============================================================


-- ------------------------------------------------------------
-- Table: ai_chats
-- No changes from v4
-- ------------------------------------------------------------
create table if not exists ai_chats (
    id            uuid primary key default gen_random_uuid(),
    company_id    uuid not null references companies(id) on delete cascade,
    user_id       uuid not null references users(id) on delete cascade,
    title         text not null default 'New Chat',
    document_ids  jsonb not null default '[]'::jsonb,
    created_at    timestamptz default now(),
    updated_at    timestamptz default now()
);

comment on table ai_chats is
    'A conversation session. '
    'document_ids caches the UUIDs of documents attached to this chat '
    'so the RAG pipeline can scope vector search without a join. '
    'updated_at is bumped on every new ai_question in this chat.';

create index if not exists ai_chats_company_idx on ai_chats (company_id);
create index if not exists ai_chats_user_idx    on ai_chats (user_id);
create index if not exists ai_chats_updated_idx on ai_chats (updated_at desc);


-- ------------------------------------------------------------
-- Table: ai_chat_documents
-- No changes from v4
-- ------------------------------------------------------------
create table if not exists ai_chat_documents (
    id          uuid primary key default gen_random_uuid(),
    chat_id     uuid not null references ai_chats(id) on delete cascade,
    document_id uuid not null references documents(id) on delete cascade,
    added_at    timestamptz default now(),

    constraint ai_chat_documents_unique unique (chat_id, document_id)
);

comment on table ai_chat_documents is
    'Junction table: documents attached to a chat session as RAG context. '
    'Adding a document here also updates ai_chats.document_ids cache. '
    'The RAG pipeline uses document_ids to scope match_documents() calls.';

create index if not exists ai_chat_documents_chat_idx     on ai_chat_documents (chat_id);
create index if not exists ai_chat_documents_document_idx on ai_chat_documents (document_id);


-- ------------------------------------------------------------
-- Table: ai_questions
-- NO CHANGES from v4:
-- ------------------------------------------------------------
create table if not exists ai_questions (
    id                  uuid primary key default gen_random_uuid(),
    chat_id             uuid not null references ai_chats(id) on delete cascade,
    company_id          uuid not null references companies(id) on delete cascade,
    user_id             uuid references users(id) on delete set null,

    -- The user's input
    question            text not null,

    -- Complete AI output JSON — all 10 fields stored individually
    answer              text,                      -- direct_answer
    evidence_found      jsonb default '[]'::jsonb, -- evidence_found[]
    reasoning           text,
    recommendation      text,
    risk_level          text,
    business_impact     text,
    next_action         text,
    missing_data        jsonb default '[]'::jsonb, -- missing_data[]
    sources_json        jsonb default '[]'::jsonb,

    -- Insight flag — set by AI when data is sufficient for an actionable recommendation
    has_insight         boolean not null default false,
    title               text,
    created_at          timestamptz default now(),

    constraint ai_questions_risk_check check (
        risk_level in ('Low', 'Medium', 'High', 'Critical') or risk_level is null
    )
);

comment on table ai_questions is
    'One row per question/answer exchange within a chat session. '
    'Stores the complete AI output (all 10 JSON fields). '
    'has_insight = true means the AI had enough data to generate an '
    'actionable recommendation — a recommendations row is created for these. '

create index if not exists ai_questions_chat_idx     on ai_questions (chat_id);
create index if not exists ai_questions_company_idx  on ai_questions (company_id);
create index if not exists ai_questions_user_idx     on ai_questions (user_id);
create index if not exists ai_questions_risk_idx     on ai_questions (risk_level);
create index if not exists ai_questions_insight_idx  on ai_questions (has_insight)
    where has_insight = true;


-- ------------------------------------------------------------
-- Table: recommendations
-- CHANGED from v4:
--   - removed assigned_to (no user assignment workflow)
--   - removed due_date    (was always null; not part of current workflow)
--   - removed notes       (no free-text annotation workflow)
--
-- Only status is tracked here. All content is read from
-- ai_questions via ai_question_id FK.
-- ------------------------------------------------------------
create table if not exists recommendations (
    id               uuid primary key default gen_random_uuid(),
    company_id       uuid not null references companies(id) on delete cascade,
    ai_question_id   uuid not null references ai_questions(id) on delete cascade,
    status           text not null default 'New',

    created_at       timestamptz default now(),
    updated_at       timestamptz default now(),

    constraint recommendations_status_check check (
        status in ('New', 'In Review', 'Accepted', 'Rejected', 'Completed')
    ),
    constraint recommendations_question_unique unique (ai_question_id)
);

comment on table recommendations is
    'Thin tracking table for actionable AI insights. '
    'Created only when ai_questions.has_insight = true. '
    'All content (answer, reasoning, risk_level, etc.) is read from '
    'ai_questions via ai_question_id FK — nothing is duplicated here. '
    'Only status is tracked; there is no assignee or due date workflow.';

create index if not exists recommendations_company_idx  on recommendations (company_id);
create index if not exists recommendations_status_idx   on recommendations (status);
create index if not exists recommendations_question_idx on recommendations (ai_question_id);


-- ------------------------------------------------------------
-- Table: reports
-- No changes from v4
-- ------------------------------------------------------------
create table if not exists reports (
    id            uuid primary key default gen_random_uuid(),
    company_id    uuid not null references companies(id) on delete cascade,
    report_type   text not null,
    title         text not null,
    content       jsonb,
    generated_by  uuid references users(id) on delete set null,
    created_at    timestamptz default now()
);

comment on table reports is
    'Generated business reports. content is jsonb to allow structured '
    'report data (summary, findings, risks, recommendations).';

create index if not exists reports_company_idx on reports (company_id);
create index if not exists reports_type_idx    on reports (report_type);
