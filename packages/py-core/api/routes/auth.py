"""
Authentication routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from db.database import get_db
from db.models import User
from api.auth import hash_password, verify_password, generate_token

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str = "admin"


class LoginResponse(BaseModel):
    success: bool
    message: str
    data: dict


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login and get JWT token."""
    if not request.username or not request.password:
        raise HTTPException(status_code=400, detail="Username and password are required")
    
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = generate_token(user.id, user.username)
    
    return {
        "success": True,
        "message": "Login successful",
        "data": {
            "token": token,
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role,
            },
        },
    }


@router.post("/register", response_model=dict)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register new user."""
    if not request.username or not request.password:
        raise HTTPException(status_code=400, detail="Username and password are required")
    
    existing_user = db.query(User).filter(User.username == request.username).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="Username already exists")
    
    hashed_password = hash_password(request.password)
    new_user = User(
        username=request.username,
        password=hashed_password,
        role=request.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "success": True,
        "message": "User registered successfully",
        "data": {
            "id": new_user.id,
            "username": new_user.username,
            "role": new_user.role,
        },
    }

