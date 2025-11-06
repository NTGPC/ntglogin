"""
Job routes - CRUD operations and job execution management.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from db.database import get_db
from db.models import Job, JobExecution, Profile, User
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

router = APIRouter(prefix="/jobs", tags=["jobs"])


class JobCreate(BaseModel):
    type: str
    payload: dict
    status: Optional[str] = "queued"
    scheduled_at: Optional[datetime] = None
    profile_ids: Optional[list[int]] = None  # Create JobExecution for each profile


class JobUpdate(BaseModel):
    status: Optional[str] = None
    attempts: Optional[int] = None
    scheduled_at: Optional[datetime] = None


@router.get("")
async def get_all_jobs(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all jobs, optionally filtered by status."""
    query = db.query(Job)
    if status_filter:
        query = query.filter(Job.status == status_filter)
    
    jobs = query.all()
    return {
        "success": True,
        "data": [
            {
                "id": j.id,
                "type": j.type,
                "payload": j.payload,
                "status": j.status,
                "attempts": j.attempts,
                "scheduled_at": j.scheduled_at.isoformat() if j.scheduled_at else None,
                "created_at": j.created_at.isoformat() if j.created_at else None,
            }
            for j in jobs
        ],
    }


@router.get("/{job_id}")
async def get_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get job by ID."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {
        "success": True,
        "data": {
            "id": job.id,
            "type": job.type,
            "payload": job.payload,
            "status": job.status,
            "attempts": job.attempts,
            "scheduled_at": job.scheduled_at.isoformat() if job.scheduled_at else None,
            "created_at": job.created_at.isoformat() if job.created_at else None,
        },
    }


@router.post("")
async def create_job(
    request: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new job and optionally JobExecution records for each profile."""
    if not request.type or not request.payload:
        raise HTTPException(status_code=400, detail="Type and payload are required")
    
    job = Job(
        type=request.type,
        payload=request.payload,
        status=request.status or "queued",
        scheduled_at=request.scheduled_at,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    # Create JobExecution for each profile_id if provided
    if request.profile_ids:
        job_executions = []
        for profile_id in request.profile_ids:
            profile = db.query(Profile).filter(Profile.id == profile_id).first()
            if profile:
                job_exec = JobExecution(
                    job_id=job.id,
                    profile_id=profile_id,
                    status="pending",
                )
                db.add(job_exec)
                job_executions.append((job_exec, profile_id))
        db.commit()
        
        # Enqueue jobs to RQ worker
        enqueue_errors = []
        if not REDIS_AVAILABLE:
            enqueue_errors.append("Redis queue is not available. Jobs have been created but will not be executed automatically.")
        else:
            try:
                if job.type == "run_workflow":
                    workflow_id = request.payload.get("workflow_id")
                    if workflow_id:
                        for job_exec, profile_id in job_executions:
                            # Enqueue workflow job for each profile
                            try:
                                enqueue_job("run_workflow", {
                                    "workflow_id": workflow_id,
                                    "profile_id": profile_id,
                                })
                            except Exception as e:
                                # Log error and collect for response
                                import logging
                                error_msg = f"Failed to enqueue workflow job for profile {profile_id}: {str(e)}"
                                logging.error(error_msg)
                                enqueue_errors.append(error_msg)
                elif job.type == "run_job_execution":
                    for job_exec, profile_id in job_executions:
                        # Enqueue job execution
                        db.refresh(job_exec)  # Refresh to get the ID
                        try:
                            enqueue_job("run_job_execution", {
                                "job_execution_id": job_exec.id,
                            })
                        except Exception as e:
                            # Log error and collect for response
                            import logging
                            error_msg = f"Failed to enqueue job execution {job_exec.id}: {str(e)}"
                            logging.error(error_msg)
                            enqueue_errors.append(error_msg)
            except Exception as e:
                # Log error and collect for response
                import logging
                error_msg = f"Failed to enqueue jobs: {str(e)}"
                logging.error(error_msg)
                enqueue_errors.append(error_msg)
    
    response_data = {
        "success": True,
        "message": "Job created successfully",
        "data": {
            "id": job.id,
            "type": job.type,
            "payload": job.payload,
            "status": job.status,
            "attempts": job.attempts,
            "scheduled_at": job.scheduled_at.isoformat() if job.scheduled_at else None,
            "created_at": job.created_at.isoformat() if job.created_at else None,
        },
    }
    
    # Add enqueue errors to response if any
    if enqueue_errors:
        response_data["warnings"] = enqueue_errors
        response_data["message"] = "Job created successfully, but some jobs could not be enqueued"
    
    return response_data


@router.put("/{job_id}")
async def update_job(
    job_id: int,
    request: JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update job."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if request.status is not None:
        job.status = request.status
    if request.attempts is not None:
        job.attempts = request.attempts
    if request.scheduled_at is not None:
        job.scheduled_at = request.scheduled_at
    
    db.commit()
    db.refresh(job)
    
    return {
        "success": True,
        "message": "Job updated successfully",
        "data": {
            "id": job.id,
            "type": job.type,
            "payload": job.payload,
            "status": job.status,
            "attempts": job.attempts,
            "scheduled_at": job.scheduled_at.isoformat() if job.scheduled_at else None,
            "created_at": job.created_at.isoformat() if job.created_at else None,
        },
    }


@router.delete("/{job_id}")
async def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete job."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    db.delete(job)
    db.commit()
    
    return {
        "success": True,
        "message": "Job deleted successfully",
    }


# Note: Job executions endpoint is separate - see job_executions.py route

