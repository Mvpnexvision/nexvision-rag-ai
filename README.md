# NexVision Reasoning RAG AI

Monorepo structure:

- `client/` — Next.js + shadcn/ui + Tailwind CSS v4 frontend
- `server/` — FastAPI backend

## Goal

Build the MVP flow:

1. Upload company documents
2. Extract and store chunks in Supabase Vector
3. Ask questions in AI chat
4. Return source-based answers with reasoning, risk, and recommendations

---

## 1) Prerequisites

Make sure each collaborator has:

- Node.js 20+ and npm
- Python 3.14.5
- A Supabase project
- A Gemini API key
- Git installed

Windows-only requirement for Python packages with native builds:

- Install Visual Studio C++ Build Tools from https://visualstudio.microsoft.com/visual-cpp-build-tools/
- Select the Desktop development with C++ workload
- Make sure these components are included:
  - MSVC v143 or latest
  - Windows 10/11 SDK
  - C++ CMake tools (optional but helpful)

This is required because one of the Python dependencies can fail to build without the C++ toolchain, especially `pyiceberg`-related packages.

---

## 2) Clone and install

From the repo root:

```bash
npm install
cd client && npm install
cd ../server
```

Then set up the Python environment in `server/`:

```bash
python -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If PowerShell blocks script activation, run:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

If you prefer one command from the root, the current root `package.json` includes an install helper.

---

## 3) Environment setup

Copy the example env files and fill in values:

- `client/.env.example` -> `client/.env.local`
- `server/.env.example` -> `server/.env`

### Client env

Use these keys:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_ENV`

### Server env

Use these keys:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `SUPABASE_STORAGE_BUCKET`
- `SUPABASE_VECTOR_TABLE`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_EMBEDDING_MODEL`
- `CORS_ORIGINS`
- `UPLOAD_DIR`
- `MAX_UPLOAD_MB`

Important:

- Keep public keys only in the frontend.
- Keep service role and Gemini secrets only in the backend.
- Never commit real secrets.

---

## 4) Run locally

### Frontend

```bash
cd client
npm run dev
```

Open:

- http://localhost:3000

### Backend

Recommended command:

```bash
cd server
.venv\Scripts\activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

If you do not want to activate manually each time, you can use the full path to the venv Python executable:

```bash
server\.venv\Scripts\python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend health check:

- http://localhost:8000/health

---

## 5) Current stack decisions

- Frontend: Next.js, shadcn/ui, Tailwind CSS v4
- Backend: FastAPI
- Auth: Supabase Auth
- Database: Supabase Postgres
- Vector DB: Supabase Vector only
- AI: Google Gemini 2.5
- Hosting: Vercel for frontend, Render for backend

Note:

- We are using Supabase Vector only for the MVP.
- Qdrant is not part of the current plan.

---

## 6) MVP folder responsibilities

### `client/`

Frontend tasks:

- login page
- dashboard layout
- document library
- AI chat screen
- insight cards
- API calls to backend and Supabase auth

### `server/`

Backend tasks:

- upload endpoint
- document processing pipeline
- extraction and chunking
- Supabase Vector search
- Gemini response generation
- structured JSON response format

---

## 7) Suggested collaboration split for 6 people

### Frontend team — 2 people

**Frontend Dev 1**

- auth pages
- layout / sidebar / navigation
- dashboard shell

**Frontend Dev 2**

- document library
- upload UI
- AI chat UI
- insight cards

### Backend team — 3 people

**Backend Dev 1**

- document upload endpoint
- file storage
- metadata handling

**Backend Dev 2**

- extraction logic
- chunking logic
- Supabase Vector integration

**Backend Dev 3**

- Gemini prompt
- JSON response schema
- source formatting
- validation / fallback handling

### Project Lead

- scope control
- API contract review
- merge approval
- task priority
- deployment coordination
- free-tier cost control

---

---

## 8) Communication rules

- Use one channel for decisions.
- Put API changes in writing before coding.
- Do not add new scope without lead approval.
- Keep PRs small.
- Merge only when the feature is runnable.

---

## 9) Minimum deliverable for the Thursday finish line

If time gets tight, prioritize only these:

- login
- upload
- document library
- extraction
- Supabase Vector search
- AI chat
- source display
- recommendation output

Do not spend time on:

- billing
- mobile app
- advanced permissions
- polished animations
- extra reports

---

## 10) Deployment target

- Frontend: Vercel
- Backend: Render
- Database/Auth/Vector: Supabase
- AI: Gemini 2.5

Free-tier note:

- This can be demoed for free, but it is sensitive to limits and cold starts.
- Keep the dataset small and the demo focused.

---

## 11) Quick health checks

- Frontend should load on port 3000.
- Backend should respond on port 8000.
- `/health` should return OK.
- Upload should save a file.
- Chat should return structured JSON.

## 12) Windows setup summary for collaborators

Use this if you are setting up the repo on a new Windows machine.

1. Install Node.js 20+.
2. Install Python 3.14.5.
3. Install Visual Studio C++ Build Tools.
4. Select Desktop development with C++.
5. Confirm MSVC v143 or latest is installed.
6. Confirm Windows 10/11 SDK is installed.
7. Optionally include C++ CMake tools.
8. Run `npm install` at the root.
9. Run `cd client && npm install`.
10. Run the Python venv commands in `server/`.
11. Copy env templates into real env files.
12. Start frontend and backend separately.

## 13) What to do if `pyiceberg` or another Python package fails

- Make sure the venv is activated.
- Make sure the C++ Build Tools are installed.
- Make sure MSVC v143 and the Windows SDK are checked.
- Upgrade pip before reinstalling packages.
- Re-run `pip install -r requirements.txt`.
- If the build still fails, send the exact error to the project lead before changing dependencies.
