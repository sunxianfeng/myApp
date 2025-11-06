import os


class Settings:
    # Application
    APP_NAME = "Question Generator API"
    APP_VERSION = "1.0.0"
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    
    # Database (PostgreSQL)
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://question_user:question_password@localhost:5432/question_generator")

    # PostgreSQL Connection
    SQLALCHEMY_ECHO = os.getenv("SQLALCHEMY_ECHO", "False").lower() == "true"
    
    # Redis
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # JWT
    JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", 24))
    
    # CORS
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    
    # File Upload
    MAX_UPLOAD_SIZE = int(os.getenv("MAX_UPLOAD_SIZE", 52428800))  # 50MB
    ALLOWED_EXTENSIONS = set(os.getenv("ALLOWED_EXTENSIONS", ".docx,.pdf,.txt").split(","))
    UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
    
    # MinIO
    MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ROOT_USER = os.getenv("MINIO_ROOT_USER", "minioadmin")
    MINIO_ROOT_PASSWORD = os.getenv("MINIO_ROOT_PASSWORD", "minioadmin")
    MINIO_BUCKET = os.getenv("MINIO_BUCKET", "question-uploads")
    MINIO_USE_SSL = os.getenv("MINIO_USE_SSL", "False").lower() == "true"

settings = Settings()
