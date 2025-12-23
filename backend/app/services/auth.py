from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
import hashlib
import base64
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, LoginRequest
from app.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Service for authentication operations"""

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using SHA-256 then bcrypt

        SHA-256 preprocessing allows bcrypt to handle passwords longer than 72 bytes
        while maintaining security. We truncate the SHA-256 hex to exactly 72 characters.
        """
        # First hash with SHA-256 to handle long passwords
        sha_hash = hashlib.sha256(password.encode()).hexdigest()
        # Truncate to exactly 72 characters to satisfy bcrypt limit
        sha_truncated = sha_hash[:72]
        # Then hash with bcrypt
        return pwd_context.hash(sha_truncated)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash

        Uses the same SHA-256 preprocessing as hash_password for consistency.
        Includes backward compatibility for passwords hashed with the old method.
        """
        # Try new method first (SHA-256 + truncate to 72 chars)
        try:
            # First hash with SHA-256 to handle long passwords
            sha_hash = hashlib.sha256(plain_password.encode()).hexdigest()
            # Truncate to exactly 72 characters to satisfy bcrypt limit
            sha_truncated = sha_hash[:72]
            
            if pwd_context.verify(sha_truncated, hashed_password):
                return True
        except Exception:
            pass
        
        # Fallback to old method (hex string) for backward compatibility
        try:
            sha_hash_hex = hashlib.sha256(plain_password.encode()).hexdigest()
            return pwd_context.verify(sha_hash_hex, hashed_password)
        except Exception:
            return False

    @staticmethod
    def create_access_token(user_id: str, expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token"""
        if expires_delta is None:
            expires_delta = timedelta(hours=settings.JWT_EXPIRATION_HOURS)

        expire = datetime.now(timezone.utc) + expires_delta
        payload = {
            "sub": str(user_id),
            "exp": expire,
            "iat": datetime.now(timezone.utc)
        }

        encoded_jwt = jwt.encode(
            payload,
            settings.JWT_SECRET,
            algorithm=settings.JWT_ALGORITHM
        )
        return encoded_jwt

    @staticmethod
    def verify_token(token: str) -> Optional[str]:
        """Verify a JWT token and return the user_id"""
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM]
            )
            user_id: str = payload.get("sub")
            if user_id is None:
                return None
            return user_id
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
        except Exception:
            return None

    @staticmethod
    def register_user(db: Session, user_create: UserCreate) -> User:
        """Register a new user"""
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_create.email).first()
        if existing_user:
            raise ValueError(f"User with email {user_create.email} already exists")

        # Create new user
        hashed_password = AuthService.hash_password(user_create.password)
        db_user = User(
            email=user_create.email,
            password_hash=hashed_password
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        return db_user

    @staticmethod
    def login_user(db: Session, login_request: LoginRequest) -> Optional[User]:
        """Authenticate user and return user if credentials are valid"""
        user = db.query(User).filter(User.email == login_request.email).first()

        if not user:
            return None

        if not AuthService.verify_password(login_request.password, user.password_hash):
            return None

        return user
