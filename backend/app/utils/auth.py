from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from app.database import get_db
from app.services.auth import AuthService
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"🔐 get_current_user called, token received: {token[:20] if token else 'None'}...")
    
    if not token:
        logger.error("❌ No token provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    user_id_str: Optional[str] = AuthService.verify_token(token)
    logger.info(f"🔍 Token verification result: user_id={user_id_str}")
    
    if not user_id_str:
        logger.error("❌ Token verification failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    # Convert string UUID to UUID object
    try:
        user_id = uuid.UUID(user_id_str)
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user
