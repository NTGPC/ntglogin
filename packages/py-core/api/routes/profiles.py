"""
Profile routes - CRUD operations.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Any
from db.database import get_db
from db.models import Profile, User
from api.middleware import get_current_user

router = APIRouter(prefix="/profiles", tags=["profiles"])


class ProfileCreate(BaseModel):
    name: str
    user_agent: Optional[str] = None
    fingerprint: Optional[dict] = None


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    user_agent: Optional[str] = None
    fingerprint: Optional[dict] = None


@router.get("")
async def get_all_profiles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all profiles."""
    profiles = db.query(Profile).all()
    return {
        "success": True,
        "data": [
            {
                "id": p.id,
                "name": p.name,
                "user_agent": p.user_agent,
                "fingerprint": p.fingerprint,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in profiles
        ],
    }


@router.get("/{profile_id}")
async def get_profile(
    profile_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get profile by ID."""
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return {
        "success": True,
        "data": {
            "id": profile.id,
            "name": profile.name,
            "user_agent": profile.user_agent,
            "fingerprint": profile.fingerprint,
            "created_at": profile.created_at.isoformat() if profile.created_at else None,
        },
    }


@router.post("")
async def create_profile(
    request: ProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new profile."""
    if not request.name:
        raise HTTPException(status_code=400, detail="Name is required")
    
    profile = Profile(
        name=request.name,
        user_agent=request.user_agent,
        fingerprint=request.fingerprint,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    
    return {
        "success": True,
        "message": "Profile created successfully",
        "data": {
            "id": profile.id,
            "name": profile.name,
            "user_agent": profile.user_agent,
            "fingerprint": profile.fingerprint,
            "created_at": profile.created_at.isoformat() if profile.created_at else None,
        },
    }


@router.put("/{profile_id}")
async def update_profile(
    profile_id: int,
    request: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update profile."""
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    if request.name is not None:
        profile.name = request.name
    if request.user_agent is not None:
        profile.user_agent = request.user_agent
    if request.fingerprint is not None:
        profile.fingerprint = request.fingerprint
    
    db.commit()
    db.refresh(profile)
    
    return {
        "success": True,
        "message": "Profile updated successfully",
        "data": {
            "id": profile.id,
            "name": profile.name,
            "user_agent": profile.user_agent,
            "fingerprint": profile.fingerprint,
            "created_at": profile.created_at.isoformat() if profile.created_at else None,
        },
    }


@router.delete("/{profile_id}")
async def delete_profile(
    profile_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete profile."""
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    db.delete(profile)
    db.commit()
    
    return {
        "success": True,
        "message": "Profile deleted successfully",
    }

