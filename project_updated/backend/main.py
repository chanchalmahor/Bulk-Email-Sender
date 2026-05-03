"""
Bulk Email Sender — FastAPI Backend
Run: uvicorn backend.main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import init_db
from backend.routes import emails, templates, analytics, ai
from backend.scheduler import scheduler

app = FastAPI(title="Bulk Email Sender API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await init_db()
    scheduler.start()

@app.on_event("shutdown")
async def shutdown():
    scheduler.shutdown()

app.include_router(emails.router,    prefix="/api/emails",    tags=["Emails"])
app.include_router(templates.router, prefix="/api/templates", tags=["Templates"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(ai.router,        prefix="/api/ai",        tags=["AI"])

@app.get("/")
async def root():
    return {"status": "running", "version": "2.0.0"}
