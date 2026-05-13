# NexVision Deployment Checklist

This checklist is written for a free-tier MVP with:

- Frontend: Next.js + shadcn/ui + Tailwind CSS v4
- Backend: FastAPI
- Database/Auth: Supabase Postgres + Supabase Auth
- Vector database: Supabase Vector only
- AI: Google Gemini 2.5
- Hosting: Vercel for frontend, Render for backend

## 1) Before deployment

- [ ] Confirm one source of truth for environment variables.
- [ ] Confirm the frontend and backend use separate `.env` files.
- [ ] Confirm no real secrets are committed to git.
- [ ] Confirm the team knows who owns frontend, backend, auth, DB, and deployment.
- [ ] Confirm the project lead has final approval for architecture changes.

## 2) Frontend readiness

- [ ] Keep the Next.js app in `client/`.
- [ ] Verify `client/package.json` has the correct scripts for `dev`, `build`, and `start`.
- [ ] Verify Tailwind CSS v4 is configured.
- [ ] Add or confirm `tailwind.config.*` exists if shadcn components need it.
- [ ] Confirm shadcn/ui setup is complete.
- [ ] Confirm `client/.env.example` contains only public-safe variables.
- [ ] Confirm the frontend uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] Confirm the frontend points to the backend API with `NEXT_PUBLIC_API_BASE_URL`.
- [ ] Replace starter landing page content with the actual app shell.
- [ ] Test build locally before pushing to Vercel.

## 3) Backend readiness

- [ ] Keep the FastAPI app in `server/main.py`.
- [ ] Confirm `server/requirements.txt` contains all runtime dependencies.
- [ ] Confirm `python-dotenv` is used for local env loading.
- [ ] Confirm the FastAPI app has a `/health` endpoint.
- [ ] Confirm the FastAPI app has CORS configured for Vercel and local dev.
- [ ] Confirm upload handling is safe and size-limited.
- [ ] Confirm document extraction flow is planned or implemented.
- [ ] Confirm chunking logic is planned or implemented.
- [ ] Confirm the chat endpoint returns a stable JSON shape.
- [ ] Confirm the backend can run on Render with `uvicorn`.

## 4) Supabase setup

- [ ] Create or confirm one Supabase project.
- [ ] Enable authentication providers needed for the MVP.
- [ ] Set up user roles or a simple company role field.
- [ ] Create the tables needed for documents, chunks, questions, and recommendations.
- [ ] Enable the vector extension in Supabase.
- [ ] Create the embedding storage structure for document chunks.
- [ ] Confirm row-level security rules if the app will be multi-tenant.
- [ ] Decide which keys are public and which stay server-only.
- [ ] Store only the anon key in the frontend.
- [ ] Store the service role key only in the backend.

## 5) Supabase Vector plan

- [ ] Use Supabase Vector only, not Qdrant, for the MVP.
- [ ] Define one consistent embedding table or RPC search function.
- [ ] Decide the metadata fields for each chunk: document name, page, row, chunk index, company, and business line.
- [ ] Confirm the backend can upsert embeddings into Supabase.
- [ ] Confirm the backend can search by similarity before Gemini generation.
- [ ] Confirm source metadata is returned with every answer.

## 6) Gemini setup

- [ ] Create or confirm the Google AI / Gemini key.
- [ ] Store Gemini credentials only in the backend environment.
- [ ] Choose one model name for the MVP.
- [ ] Confirm the prompt forces JSON output.
- [ ] Confirm the prompt forbids invented facts.
- [ ] Confirm the model response is validated before sending to the frontend.
- [ ] Confirm fallback behavior exists when the model fails or returns invalid JSON.

## 7) Free-tier hosting plan

- [ ] Host the frontend on Vercel free tier.
- [ ] Host the backend on Render free tier only if the app is acceptable with sleep/cold starts.
- [ ] Confirm whether the backend must stay online continuously.
- [ ] Confirm whether any background jobs will run 24/7.
- [ ] Avoid hosting a separate vector database service unless it is also free.
- [ ] Prefer Supabase Vector to reduce infrastructure cost.
- [ ] Check Supabase free tier limits before demo day.
- [ ] Check Gemini free usage limits or trial quotas before demo day.
- [ ] Confirm the demo will still work after inactivity sleep or cold start delays.

## 8) CI / build checks

- [ ] Run frontend lint locally.
- [ ] Run frontend production build locally.
- [ ] Run backend syntax check locally.
- [ ] Confirm the backend imports resolve.
- [ ] Confirm environment variables are documented.
- [ ] Confirm the repo has a clear README or setup note.

## 9) Deployment steps

### Frontend on Vercel

- [ ] Connect the `client` project to Vercel.
- [ ] Set production environment variables in Vercel.
- [ ] Configure the build command and output path if needed.
- [ ] Deploy a preview and verify the login page loads.
- [ ] Test Supabase auth from the deployed site.
- [ ] Test API calls to the Render backend.

### Backend on Render

- [ ] Connect the `server` project to Render.
- [ ] Set the start command to run `uvicorn main:app`.
- [ ] Set production environment variables in Render.
- [ ] Verify the `/health` endpoint after deploy.
- [ ] Verify CORS allows the Vercel domain.
- [ ] Verify uploads work with the Render filesystem rules.
- [ ] Confirm any generated files are acceptable to keep or temporary only.

## 10) Demo readiness

- [ ] Prepare one strong demo company.
- [ ] Upload sample files that clearly answer demo questions.
- [ ] Test at least three questions end-to-end.
- [ ] Verify every answer shows sources.
- [ ] Verify the answer includes reasoning, risk, recommendation, and next action.
- [ ] Verify the UI can show a basic insight card.
- [ ] Prepare a fallback answer if a file has no relevant source.
- [ ] Prepare a short demo script for the team.

## 11) Team execution plan for 6 people

### Frontend team of 2

- [ ] Member A: auth screens, layout, navigation, and dashboard.
- [ ] Member B: upload flow, document library, AI chat UI, and insight cards.

### Backend team of 3

- [ ] Member A: document upload and storage.
- [ ] Member B: extraction, chunking, and Supabase Vector integration.
- [ ] Member C: Gemini prompt, response JSON schema, and source formatting.

### Project lead

- [ ] Review architecture decisions.
- [ ] Track free-tier limits.
- [ ] Review API contracts.
- [ ] Approve merges that affect deployment or data model.
- [ ] Keep the MVP scope small.

## 12) Final go-live checklist

- [ ] Frontend deploy succeeds.
- [ ] Backend deploy succeeds.
- [ ] Login works.
- [ ] Upload works.
- [ ] Vector search works.
- [ ] AI answer returns structured JSON.
- [ ] Source references are visible.
- [ ] Recommendations appear.
- [ ] Demo questions pass.
- [ ] Nothing critical depends on paid infrastructure.

## 13) Important free-tier warning

A completely free stack is possible for a demo, but it is fragile. The main risk points are:

- Render free sleep/cold starts
- Supabase limits
- Gemini free quota or billing requirements
- File storage growth

If the team needs a reliable live demo, keep the traffic tiny and the document set small.
