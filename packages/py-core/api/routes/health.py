"""
Health check route.
"""
from fastapi import APIRouter
from sqlalchemy import text
from db.database import SessionLocal

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        # Test database connection
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        db_status = "ok"
    except Exception:
        db_status = "error"
    
    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "database": db_status,
        "version": "1.0.0",
    }

