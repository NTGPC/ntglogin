"""
Fingerprint routes - CRUD operations.
Note: Fingerprints might also be stored in Profile.fingerprint JSON field.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from db.database import get_db
from db.models import Fingerprint, User
from api.middleware import get_current_user

router = APIRouter(prefix="/fingerprints", tags=["fingerprints"])


class FingerprintCreate(BaseModel):
    name: str
    canvas_hash: Optional[str] = None
    webgl_vendor: Optional[str] = None
    webgl_renderer: Optional[str] = None
    user_agent: Optional[str] = None
    screen_width: Optional[int] = None
    screen_height: Optional[int] = None
    device_memory: Optional[int] = None
    hardware_concurrency: Optional[int] = None
    platform: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    plugins: Optional[dict] = None
    meta: Optional[dict] = None


class FingerprintUpdate(BaseModel):
    name: Optional[str] = None
    canvas_hash: Optional[str] = None
    webgl_vendor: Optional[str] = None
    webgl_renderer: Optional[str] = None
    user_agent: Optional[str] = None
    screen_width: Optional[int] = None
    screen_height: Optional[int] = None
    device_memory: Optional[int] = None
    hardware_concurrency: Optional[int] = None
    platform: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    plugins: Optional[dict] = None
    meta: Optional[dict] = None


@router.get("")
async def get_all_fingerprints(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all fingerprints."""
    try:
        fingerprints = db.query(Fingerprint).all()
    except Exception:
        # Table might not exist, return empty list
        return {"success": True, "data": []}
    
    return {
        "success": True,
        "data": [
            {
                "id": fp.id,
                "name": fp.name,
                "canvas_hash": fp.canvas_hash,
                "webgl_vendor": fp.webgl_vendor,
                "webgl_renderer": fp.webgl_renderer,
                "user_agent": fp.user_agent,
                "screen_width": fp.screen_width,
                "screen_height": fp.screen_height,
                "device_memory": fp.device_memory,
                "hardware_concurrency": fp.hardware_concurrency,
                "platform": fp.platform,
                "timezone": fp.timezone,
                "language": fp.language,
                "plugins": fp.plugins,
                "meta": fp.meta,
                "created_at": fp.created_at.isoformat() if fp.created_at else None,
            }
            for fp in fingerprints
        ],
    }


@router.get("/{fingerprint_id}")
async def get_fingerprint(
    fingerprint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get fingerprint by ID."""
    try:
        fingerprint = db.query(Fingerprint).filter(Fingerprint.id == fingerprint_id).first()
    except Exception:
        raise HTTPException(status_code=404, detail="Fingerprint table not found")
    
    if not fingerprint:
        raise HTTPException(status_code=404, detail="Fingerprint not found")
    
    return {
        "success": True,
        "data": {
            "id": fingerprint.id,
            "name": fingerprint.name,
            "canvas_hash": fingerprint.canvas_hash,
            "webgl_vendor": fingerprint.webgl_vendor,
            "webgl_renderer": fingerprint.webgl_renderer,
            "user_agent": fingerprint.user_agent,
            "screen_width": fingerprint.screen_width,
            "screen_height": fingerprint.screen_height,
            "device_memory": fingerprint.device_memory,
            "hardware_concurrency": fingerprint.hardware_concurrency,
            "platform": fingerprint.platform,
            "timezone": fingerprint.timezone,
            "language": fingerprint.language,
            "plugins": fingerprint.plugins,
            "meta": fingerprint.meta,
            "created_at": fingerprint.created_at.isoformat() if fingerprint.created_at else None,
        },
    }


@router.post("")
async def create_fingerprint(
    request: FingerprintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new fingerprint."""
    if not request.name:
        raise HTTPException(status_code=400, detail="Name is required")
    
    try:
        fingerprint = Fingerprint(
            name=request.name,
            canvas_hash=request.canvas_hash,
            webgl_vendor=request.webgl_vendor,
            webgl_renderer=request.webgl_renderer,
            user_agent=request.user_agent,
            screen_width=request.screen_width,
            screen_height=request.screen_height,
            device_memory=request.device_memory,
            hardware_concurrency=request.hardware_concurrency,
            platform=request.platform,
            timezone=request.timezone,
            language=request.language,
            plugins=request.plugins,
            meta=request.meta,
        )
        db.add(fingerprint)
        db.commit()
        db.refresh(fingerprint)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fingerprint table not available: {str(e)}")
    
    return {
        "success": True,
        "message": "Fingerprint created successfully",
        "data": {
            "id": fingerprint.id,
            "name": fingerprint.name,
            "created_at": fingerprint.created_at.isoformat() if fingerprint.created_at else None,
        },
    }


@router.put("/{fingerprint_id}")
async def update_fingerprint(
    fingerprint_id: int,
    request: FingerprintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update fingerprint."""
    try:
        fingerprint = db.query(Fingerprint).filter(Fingerprint.id == fingerprint_id).first()
    except Exception:
        raise HTTPException(status_code=404, detail="Fingerprint table not found")
    
    if not fingerprint:
        raise HTTPException(status_code=404, detail="Fingerprint not found")
    
    # Update fields
    for field, value in request.dict(exclude_unset=True).items():
        setattr(fingerprint, field, value)
    
    db.commit()
    db.refresh(fingerprint)
    
    return {
        "success": True,
        "message": "Fingerprint updated successfully",
        "data": {
            "id": fingerprint.id,
            "name": fingerprint.name,
            "created_at": fingerprint.created_at.isoformat() if fingerprint.created_at else None,
        },
    }


@router.delete("/{fingerprint_id}")
async def delete_fingerprint(
    fingerprint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete fingerprint."""
    try:
        fingerprint = db.query(Fingerprint).filter(Fingerprint.id == fingerprint_id).first()
    except Exception:
        raise HTTPException(status_code=404, detail="Fingerprint table not found")
    
    if not fingerprint:
        raise HTTPException(status_code=404, detail="Fingerprint not found")
    
    db.delete(fingerprint)
    db.commit()
    
    return {
        "success": True,
        "message": "Fingerprint deleted successfully",
    }

