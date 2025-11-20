import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.api.v1.auth import router as auth_router
from app.api.v1.ocr import router as ocr_router
from app.api.v1.questions import router as questions_router
from app.database import engine, Base
from app.models import User

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle events"""
    # Startup
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.warning(f"Could not create database tables: {e}")
        logger.warning("Continuing without table creation...")
    
    yield
    
    # Shutdown (if needed)
    logger.info("Application shutdown")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(ocr_router, prefix="/api/v1/ocr")
app.include_router(questions_router, prefix="/api/v1/questions")

@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok", "version": settings.APP_VERSION}

@app.get("/docs")
async def get_docs():
    return {"message": "API documentation"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
