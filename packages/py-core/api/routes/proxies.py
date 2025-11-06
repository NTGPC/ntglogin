"""
Proxy routes - CRUD operations.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from db.database import get_db
from db.models import Proxy, User
from api.middleware import get_current_user
from services.crypto import encrypt, decrypt

router = APIRouter(prefix="/proxies", tags=["proxies"])


class ProxyCreate(BaseModel):
    host: str
    port: int
    username: Optional[str] = None
    password: Optional[str] = None
    type: str  # "http", "socks5"
    active: Optional[bool] = True


class ProxyUpdate(BaseModel):
    host: Optional[str] = None
    port: Optional[int] = None
    username: Optional[str] = None
    password: Optional[str] = None
    type: Optional[str] = None
    active: Optional[bool] = None


@router.get("")
async def get_all_proxies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all proxies."""
    proxies = db.query(Proxy).all()
    result = []
    for p in proxies:
        proxy_data = {
            "id": p.id,
            "host": p.host,
            "port": p.port,
            "username": p.username,
            "password": p.password if p.password else None,  # Return encrypted, client can decrypt if needed
            "type": p.type,
            "active": p.active,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        result.append(proxy_data)
    
    return {
        "success": True,
        "data": result,
    }


@router.get("/{proxy_id}")
async def get_proxy(
    proxy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get proxy by ID."""
    proxy = db.query(Proxy).filter(Proxy.id == proxy_id).first()
    if not proxy:
        raise HTTPException(status_code=404, detail="Proxy not found")
    
    return {
        "success": True,
        "data": {
            "id": proxy.id,
            "host": proxy.host,
            "port": proxy.port,
            "username": proxy.username,
            "password": proxy.password if proxy.password else None,
            "type": proxy.type,
            "active": proxy.active,
            "created_at": proxy.created_at.isoformat() if proxy.created_at else None,
        },
    }


@router.post("")
async def create_proxy(
    request: ProxyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new proxy."""
    if not request.host or not request.port or not request.type:
        raise HTTPException(status_code=400, detail="Host, port, and type are required")
    
    # Encrypt password if provided
    encrypted_password = None
    if request.password:
        encrypted_password = encrypt(request.password)
    
    proxy = Proxy(
        host=request.host,
        port=request.port,
        username=request.username,
        password=encrypted_password,
        type=request.type,
        active=request.active if request.active is not None else True,
    )
    db.add(proxy)
    db.commit()
    db.refresh(proxy)
    
    return {
        "success": True,
        "message": "Proxy created successfully",
        "data": {
            "id": proxy.id,
            "host": proxy.host,
            "port": proxy.port,
            "username": proxy.username,
            "password": proxy.password,
            "type": proxy.type,
            "active": proxy.active,
            "created_at": proxy.created_at.isoformat() if proxy.created_at else None,
        },
    }


@router.put("/{proxy_id}")
async def update_proxy(
    proxy_id: int,
    request: ProxyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update proxy."""
    proxy = db.query(Proxy).filter(Proxy.id == proxy_id).first()
    if not proxy:
        raise HTTPException(status_code=404, detail="Proxy not found")
    
    if request.host is not None:
        proxy.host = request.host
    if request.port is not None:
        proxy.port = request.port
    if request.username is not None:
        proxy.username = request.username
    if request.password is not None:
        proxy.password = encrypt(request.password)
    if request.type is not None:
        proxy.type = request.type
    if request.active is not None:
        proxy.active = request.active
    
    db.commit()
    db.refresh(proxy)
    
    return {
        "success": True,
        "message": "Proxy updated successfully",
        "data": {
            "id": proxy.id,
            "host": proxy.host,
            "port": proxy.port,
            "username": proxy.username,
            "password": proxy.password,
            "type": proxy.type,
            "active": proxy.active,
            "created_at": proxy.created_at.isoformat() if proxy.created_at else None,
        },
    }


@router.delete("/{proxy_id}")
async def delete_proxy(
    proxy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete proxy."""
    proxy = db.query(Proxy).filter(Proxy.id == proxy_id).first()
    if not proxy:
        raise HTTPException(status_code=404, detail="Proxy not found")
    
    db.delete(proxy)
    db.commit()
    
    return {
        "success": True,
        "message": "Proxy deleted successfully",
    }

