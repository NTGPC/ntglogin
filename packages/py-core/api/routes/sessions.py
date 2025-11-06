"""
Session routes - CRUD operations and control (start/stop).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from db.database import get_db
from db.models import Session as SessionModel, Profile, Proxy, User
from api.middleware import get_current_user
try:
    from worker.queue import enqueue_job
    REDIS_AVAILABLE = True
except Exception as e:
    import logging
    logging.error(f"Failed to import enqueue_job: {str(e)}")
    REDIS_AVAILABLE = False
    def enqueue_job(*args, **kwargs):
        raise RuntimeError("Redis queue is not available")

router = APIRouter(prefix="/sessions", tags=["sessions"])


class SessionCreate(BaseModel):
    profile_id: int
    proxy_id: Optional[int] = None
    status: Optional[str] = "idle"
    meta: Optional[dict] = None


class SessionUpdate(BaseModel):
    status: Optional[str] = None
    started_at: Optional[datetime] = None
    stopped_at: Optional[datetime] = None
    meta: Optional[dict] = None


@router.get("")
async def get_all_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all sessions."""
    sessions = db.query(SessionModel).all()
    result = []
    for s in sessions:
        session_data = {
            "id": s.id,
            "profile_id": s.profile_id,
            "proxy_id": s.proxy_id,
            "status": s.status,
            "started_at": s.started_at.isoformat() if s.started_at else None,
            "stopped_at": s.stopped_at.isoformat() if s.stopped_at else None,
            "meta": s.meta,
            "profile": {
                "id": s.profile.id,
                "name": s.profile.name,
            } if s.profile else None,
            "proxy": {
                "id": s.proxy.id,
                "host": s.proxy.host,
                "port": s.proxy.port,
            } if s.proxy else None,
        }
        result.append(session_data)
    
    return {
        "success": True,
        "data": result,
    }


@router.get("/{session_id}")
async def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get session by ID."""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "success": True,
        "data": {
            "id": session.id,
            "profile_id": session.profile_id,
            "proxy_id": session.proxy_id,
            "status": session.status,
            "started_at": session.started_at.isoformat() if session.started_at else None,
            "stopped_at": session.stopped_at.isoformat() if session.stopped_at else None,
            "meta": session.meta,
            "profile": {
                "id": session.profile.id,
                "name": session.profile.name,
            } if session.profile else None,
            "proxy": {
                "id": session.proxy.id,
                "host": session.proxy.host,
                "port": session.proxy.port,
            } if session.proxy else None,
        },
    }


@router.post("")
async def create_session(
    request: SessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new session and enqueue start job."""
    if not request.profile_id:
        raise HTTPException(status_code=400, detail="Profile ID is required")
    
    # Verify profile exists
    profile = db.query(Profile).filter(Profile.id == request.profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Verify proxy exists if provided
    if request.proxy_id:
        proxy = db.query(Proxy).filter(Proxy.id == request.proxy_id).first()
        if not proxy:
            raise HTTPException(status_code=404, detail="Proxy not found")
    
    session = SessionModel(
        profile_id=request.profile_id,
        proxy_id=request.proxy_id,
        status=request.status or "idle",
        meta=request.meta,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    # Enqueue job to start session
    enqueue_warning = None
    if request.status == "running" or not request.status:
        try:
            if REDIS_AVAILABLE:
                enqueue_job("start_session", {"session_id": session.id})
            else:
                enqueue_warning = "Redis queue is not available. Session created but job not enqueued."
        except Exception as e:
            import logging
            error_msg = f"Failed to enqueue start_session job: {str(e)}"
            logging.error(error_msg)
            enqueue_warning = error_msg
    
        response_data = {
        "success": True,
        "message": "Session created successfully",
        "data": {
            "id": session.id,
            "profile_id": session.profile_id,
            "proxy_id": session.proxy_id,
            "status": session.status,
            "started_at": session.started_at.isoformat() if session.started_at else None,                                                                       
            "stopped_at": session.stopped_at.isoformat() if session.stopped_at else None,                                                                       
            "meta": session.meta,
        },
    }
    
    if enqueue_warning:
        response_data["warning"] = enqueue_warning
        response_data["message"] = "Session created successfully, but job may not be enqueued"
    
    return response_data


@router.post("/{session_id}/stop")
async def stop_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Stop a running session."""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Enqueue stop job
    enqueue_warning = None
    try:
        if REDIS_AVAILABLE:
            enqueue_job("stop_session", {"session_id": session_id})
        else:
            enqueue_warning = "Redis queue is not available. Session stop job not enqueued."
    except Exception as e:
        import logging
        error_msg = f"Failed to enqueue stop_session job: {str(e)}"
        logging.error(error_msg)
        enqueue_warning = error_msg
    
    return {
        "success": True,
        "message": "Session stop requested",
    }


@router.put("/{session_id}")
async def update_session(
    session_id: int,
    request: SessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update session."""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if request.status is not None:
        session.status = request.status
    if request.started_at is not None:
        session.started_at = request.started_at
    if request.stopped_at is not None:
        session.stopped_at = request.stopped_at
    if request.meta is not None:
        session.meta = request.meta
    
    db.commit()
    db.refresh(session)
    
    return {
        "success": True,
        "message": "Session updated successfully",
        "data": {
            "id": session.id,
            "profile_id": session.profile_id,
            "proxy_id": session.proxy_id,
            "status": session.status,
            "started_at": session.started_at.isoformat() if session.started_at else None,
            "stopped_at": session.stopped_at.isoformat() if session.stopped_at else None,
            "meta": session.meta,
        },
    }


@router.delete("/{session_id}")
async def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete session."""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(session)
    db.commit()
    
    return {
        "success": True,
        "message": "Session deleted successfully",
    }

