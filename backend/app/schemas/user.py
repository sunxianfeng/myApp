from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from typing import Optional
from uuid import UUID


class UserCreate(BaseModel):
    """Schema for user registration"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=1000, description="Password must be 8-1000 characters")

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password requirements"""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if len(v) > 1000:
            raise ValueError("Password must not exceed 1000 characters")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "securepassword123"
            }
        }


class LoginRequest(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "securepassword123"
            }
        }


class UserResponse(BaseModel):
    """Schema for user response"""
    id: UUID
    email: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Schema for token response"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class LoginResponse(BaseModel):
    """Schema for login response"""
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    """Schema for forgot password request"""
    email: EmailStr

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com"
            }
        }


class ResetPasswordRequest(BaseModel):
    """Schema for reset password request"""
    email: EmailStr
    new_password: str = Field(..., min_length=8, max_length=1000, description="New password must be 8-1000 characters")
    confirm_password: str = Field(..., min_length=8, max_length=1000, description="Confirm password must match new password")

    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        """Validate that passwords match"""
        if 'new_password' in info.data and v != info.data['new_password']:
            raise ValueError("Passwords do not match")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "new_password": "newsecurepassword123",
                "confirm_password": "newsecurepassword123"
            }
        }
