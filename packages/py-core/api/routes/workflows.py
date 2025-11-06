"""
Workflow routes - CRUD operations.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from db.database import get_db
from db.models import Workflow, User
from api.middleware import get_current_user

router = APIRouter(prefix="/workflows", tags=["workflows"])


class WorkflowCreate(BaseModel):
    name: str
    data: Optional[dict] = None  # React Flow graph {nodes, edges, version}


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    data: Optional[dict] = None  # React Flow graph {nodes, edges, version}


@router.get("")
async def get_all_workflows(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all workflows."""
    try:
        workflows = db.query(Workflow).all()
    except Exception:
        # Table might not exist
        return {"success": True, "data": []}
    
    return {
        "success": True,
        "data": [
            {
                "id": w.id,
                "name": w.name,
                "data": w.data,
                "createdAt": w.created_at.isoformat() if w.created_at else None,
                "updatedAt": w.updated_at.isoformat() if w.updated_at else None,
            }
            for w in workflows
        ],
    }


@router.get("/{workflow_id}")
async def get_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get workflow by ID."""
    try:
        workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    except Exception:
        raise HTTPException(status_code=404, detail="Workflow table not found")
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    return {
        "success": True,
        "data": {
            "id": workflow.id,
            "name": workflow.name,
            "data": workflow.data,
            "createdAt": workflow.created_at.isoformat() if workflow.created_at else None,
            "updatedAt": workflow.updated_at.isoformat() if workflow.updated_at else None,
        },
    }


@router.post("")
async def create_workflow(
    request: WorkflowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new workflow."""
    if not request.name:
        raise HTTPException(status_code=400, detail="Name is required")
    
    try:
        workflow = Workflow(
            name=request.name,
            data=request.data,
        )
        db.add(workflow)
        db.commit()
        db.refresh(workflow)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Workflow table not available: {str(e)}")
    
    return {
        "success": True,
        "message": "Workflow created successfully",
        "data": {
            "id": workflow.id,
            "name": workflow.name,
            "data": workflow.data,
            "createdAt": workflow.created_at.isoformat() if workflow.created_at else None,
            "updatedAt": workflow.updated_at.isoformat() if workflow.updated_at else None,
        },
    }


@router.put("/{workflow_id}")
async def update_workflow(
    workflow_id: int,
    request: WorkflowUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update workflow."""
    try:
        workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    except Exception:
        raise HTTPException(status_code=404, detail="Workflow table not found")
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Update fields
    if request.name is not None:
        workflow.name = request.name
    if request.data is not None:
        workflow.data = request.data
    
    db.commit()
    db.refresh(workflow)
    
    return {
        "success": True,
        "message": "Workflow updated successfully",
        "data": {
            "id": workflow.id,
            "name": workflow.name,
            "data": workflow.data,
            "createdAt": workflow.created_at.isoformat() if workflow.created_at else None,
            "updatedAt": workflow.updated_at.isoformat() if workflow.updated_at else None,
        },
    }


@router.delete("/{workflow_id}")
async def delete_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete workflow."""
    try:
        workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    except Exception:
        raise HTTPException(status_code=404, detail="Workflow table not found")
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    db.delete(workflow)
    db.commit()
    
    return {
        "success": True,
        "message": "Workflow deleted successfully",
    }

