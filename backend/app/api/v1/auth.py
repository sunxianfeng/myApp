from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserCreate, LoginRequest, LoginResponse, UserResponse
from app.services.auth import AuthService
from app.models.user import User
from app.utils.auth import get_current_user

router = APIRouter(tags=["authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_create: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user

    - **email**: User's email address
    - **password**: User's password (minimum 8 characters)
    """
    try:
        user = AuthService.register_user(db, user_create)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register user"
        )


@router.post("/login", response_model=LoginResponse)
async def login(
    login_request: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login user and return access token

    - **email**: User's email address
    - **password**: User's password
    """
    user = AuthService.login_user(db, login_request)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = AuthService.create_access_token(str(user.id))

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user information
    
    Returns the current user's profile information based on the JWT token
    """
    return current_user


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
):
    """
    Logout user (client should remove token)
    
    Note: Since we're using JWT tokens, actual logout happens client-side
    by removing the token. This endpoint is provided for compatibility.
    """
    return {"message": "Successfully logged out"}


@router.post("/refresh")
async def refresh_token(
    current_user: User = Depends(get_current_user)
):
    """
    Refresh access token
    
    Returns a new access token for the current user
    """
    new_token = AuthService.create_access_token(str(current_user.id))
    return {
        "access_token": new_token,
        "token_type": "bearer"
    }
