"""
Job Execution routes - GET /api/job-executions
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
try:
    from db.database import get_db
    from db.models import JobExecution, User
    from api.middleware import get_current_user
except ImportError:
    # For relative imports
    import sys
    import os
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    from db.database import get_db
    from db.models import JobExecution, User
    from api.middleware import get_current_user

router = APIRouter(prefix="/job-executions", tags=["job-executions"])


@router.get("")
async def get_job_executions(
    job_id: Optional[int] = Query(None, alias="jobId"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get job executions, optionally filtered by job_id."""
    try:
        query = db.query(JobExecution)
        if job_id:
            query = query.filter(JobExecution.job_id == job_id)
        
        executions = query.all()
        
        return {
            "success": True,
            "data": [
                {
                    "id": je.id,
                    "job_id": je.job_id,
                    "profile_id": je.profile_id,
                    "session_id": je.session_id,
                    "status": je.status,
                    "started_at": je.started_at.isoformat() if je.started_at else None,
                    "completed_at": je.completed_at.isoformat() if je.completed_at else None,
                    "result": je.result,
                    "error": je.error,
                    "created_at": je.created_at.isoformat() if je.created_at else None,
                }
                for je in executions
            ],
        }
    except Exception:
        # Table might not exist
        return {
            "success": True,
            "data": [],
        }

