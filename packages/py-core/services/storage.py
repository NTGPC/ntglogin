"""
File storage utilities for screenshots and other files.
"""
import os
from pathlib import Path
from datetime import datetime
from PIL import Image
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

SCREEN_DIR = os.getenv("SCREEN_DIR", "./data/screenshots")


def ensure_dir(path: str) -> None:
    """Ensure directory exists."""
    Path(path).mkdir(parents=True, exist_ok=True)


def save_screenshot(job_exec_id: int, screenshot_bytes: bytes, format: str = "png") -> str:
    """
    Save screenshot to disk.
    Args:
        job_exec_id: Job execution ID
        screenshot_bytes: Raw image bytes
        format: Image format (png, jpg, etc.)
    Returns:
        Relative path to saved screenshot
    """
    ensure_dir(SCREEN_DIR)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"job_exec_{job_exec_id}_{timestamp}.{format}"
    filepath = os.path.join(SCREEN_DIR, filename)
    
    # Save image
    with open(filepath, "wb") as f:
        f.write(screenshot_bytes)
    
    # Return relative path for storage in DB
    return os.path.join("screenshots", filename)


def get_screenshot_path(relative_path: str) -> Optional[str]:
    """Get full path to screenshot from relative path."""
    if not relative_path:
        return None
    
    # If already absolute, return as is
    if os.path.isabs(relative_path):
        return relative_path if os.path.exists(relative_path) else None
    
    # Otherwise, resolve from SCREEN_DIR
    full_path = os.path.join(SCREEN_DIR, relative_path)
    return full_path if os.path.exists(full_path) else None


def delete_screenshot(relative_path: str) -> bool:
    """Delete screenshot file."""
    full_path = get_screenshot_path(relative_path)
    if full_path and os.path.exists(full_path):
        try:
            os.remove(full_path)
            return True
        except Exception:
            return False
    return False

