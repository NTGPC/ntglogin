"""
Log routes - read and create logs.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from db.database import get_db
from db.models import Log, User
from api.middleware import get_current_user

router = APIRouter(prefix="/logs", tags=["logs"])


class LogCreate(BaseModel):
    level: str  # "info", "warn", "error"
    message: str
    meta: Optional[dict] = None


@router.get("")
async def get_all_logs(
    level: Optional[str] = Query(None),
    job_exec_id: Optional[int] = Query(None, alias="jobExecId"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all logs, optionally filtered by level or job_exec_id."""
    query = db.query(Log)
    if level:
        query = query.filter(Log.level == level)
    if job_exec_id:
        # If meta contains jobExecId, filter by it
        # This assumes meta is JSON and might contain jobExecId
        query = query.filter(Log.meta.contains({"jobExecId": job_exec_id}))
    
    logs = query.order_by(Log.created_at.desc()).limit(1000).all()
    return {
        "success": True,
        "data": [
            {
                "id": l.id,
                "level": l.level,
                "message": l.message,
                "meta": l.meta,
                "created_at": l.created_at.isoformat() if l.created_at else None,
            }
            for l in logs
        ],
    }


@router.post("")
async def create_log(
    request: LogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new log entry."""
    if not request.level or not request.message:
        raise HTTPException(status_code=400, detail="Level and message are required")
    
    log = Log(
        level=request.level,
        message=request.message,
        meta=request.meta,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    
    return {
        "success": True,
        "message": "Log created successfully",
        "data": {
            "id": log.id,
            "level": log.level,
            "message": log.message,
            "meta": log.meta,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        },
    }

