import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Application
    APP_NAME = "Question Generator API"
    APP_VERSION = "1.0.0"
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

    # ===== Database Configuration (Supabase PostgreSQL) =====
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:8kOZxQK8DSJX1aUB@db.zjxmeozlbjcirvbrakui.supabase.co:5432/postgres"
    )

    # PostgreSQL Connection
    SQLALCHEMY_ECHO = os.getenv("SQLALCHEMY_ECHO", "False").lower() == "true"

    # ===== Redis Configuration (Upstash REST API) =====
    # Using REST API instead of socket for better cloud compatibility
    REDIS_URL = os.getenv("REDIS_URL", "https://token@region.upstash.io")

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

    # ===== Supabase Configuration (Storage) =====
    SUPABASE_URL = os.getenv("SUPABASE_URL", "https://zjxmeozlbjcirvbrakui.supabase.co")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqeG1lb3psYmpjaXJ2YnJha3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0OTU2NTEsImV4cCI6MjA3ODA3MTY1MX0.RUGImFoDG3R263VNIBKZBIG067awg05sS8BW8tv0GyQ")
    SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "question-uploads")

    # DashScope API (Qwen-VL) for OCR
    DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "sk-cf7028f008864ce3b4605704f51f7726")
    QWEN_MODEL = os.getenv("QWEN_MODEL", "qwen-vl-plus")

settings = Settings()
