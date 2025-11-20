from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine.url import make_url
from app.config import settings

# Database URL
DATABASE_URL = settings.DATABASE_URL

# Build engine with sqlite compatibility fallback
url_obj = make_url(DATABASE_URL)

engine_kwargs = {
    "echo": settings.SQLALCHEMY_ECHO,
}

# SQLite needs special connect_args and should not use pool sizing parameters
if url_obj.drivername.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        **engine_kwargs,
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        **engine_kwargs,
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all models
Base = declarative_base()


def get_db():
    """Dependency for getting database session in API routes"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
