"""
NexVision Backend Server — main.py
==================================
Entry point for the FastAPI application.

Registers all module routers. Adding a new module = import its router
and call app.include_router(). Nothing else needs to change.

Specified API surface (from product spec):
    POST   /auth/login                  ← Auth Module (future)
    POST   /documents/upload            ← Document Module
    POST   /documents/{id}/process      ← Document Module
    GET    /documents                   ← Document Module
    POST   /ai/chat                     ← Reasoning Module
    GET    /ai/questions                ← Reasoning Module
    POST   /insights/generate           ← Reasoning Module (Insights)
    GET    /recommendations             ← Recommendation Module (future)
    PATCH  /recommendations/{id}        ← Recommendation Module (future)
    POST   /reports/generate            ← Reports Module (future)

Run with:
    uvicorn main:app --reload

Swagger UI:  http://localhost:8000/docs
ReDoc:       http://localhost:8000/redoc
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from app.document.router import router as document_router
from app.insight.router import router as insight_router
from app.dashboard.router import router as dashboard_router
from app.auth.router import router as auth_router
# from app.reports.router import router as reports_router

# ---------------------------------------------------------------------------
# App initialisation
# ---------------------------------------------------------------------------

app = FastAPI(
    title="NexVision Reasoning AI — Backend",
    description=(
        "Backend server for NexVision: a RAG-powered business intelligence platform.\n\n"
        "**Workflow:**\n"
        "1. Upload company documents (`POST /documents/upload`)\n"
        "2. Trigger processing pipeline (`POST /documents/{id}/process`)\n"
        "3. Ask business questions (`POST /ai/chat`)\n"
        "4. Review AI insights and recommendations\n\n"
        "All AI reasoning is grounded in your uploaded company documents only."
    ),
    version="0.2.0",
    contact={"name": "NexVision Engineering"},
)

# ---------------------------------------------------------------------------
# CORS — adjust origins for production
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Register module routers
#
# Each module owns its prefix — matching the spec'd API endpoint paths.
# Swagger groups endpoints by the `tags` value set inside each router.
# ---------------------------------------------------------------------------

# Document Module: /documents/upload, /documents/{id}/process, /documents/list, etc.
app.include_router(document_router, prefix="/documents", tags=["Document Module"])

# Insight Module: /insights/chat/new, insights/chat/{chat_id}/documents/link, /insights/chat/{chat_id}/messages, etc.
app.include_router(insight_router, prefix="/insights", tags=["Insight Module"])

# Dashboard Module: /dashboard/stats
app.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard Module"])

# Auth Module: /auth/me
app.include_router(auth_router, prefix="/auth", tags=["Auth Module"])

# Reports Module: /reports/generate, GET /reports
# app.include_router(reports_router, prefix="/reports", tags=["Reports Module"])


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"], summary="Server health check")
async def root():
    """
    Returns server status.
    Useful for deployment readiness probes and confirming the server is running.
    """
    return {
        "status": "ok",
        "service": "NexVision Backend",
        "version": "0.2.0",
        "docs": "/docs",
    }