"""
RQ worker job handler - processes jobs using Playwright.
"""
import os
import time
import traceback
from datetime import datetime
from typing import Dict, Any
from pathlib import Path
from playwright.sync_api import sync_playwright, Browser, BrowserContext, Page
from sqlalchemy.orm import Session
from db.database import SessionLocal
from db.models import Session as SessionModel, Profile, Proxy, JobExecution, Job, Log, Workflow
from services.fingerprint_injection import build_injection
from services.crypto import decrypt
from services.storage import save_screenshot
from worker.workflow_executor import execute_workflow

# Load fingerprint patch and audio spoof scripts
_fingerprint_patch_path = Path(__file__).parent.parent.parent / "src" / "inject" / "fingerprintPatch.js"
_audio_spoof_path = Path(__file__).parent.parent.parent / "src" / "inject" / "audioSpoof.js"

if _fingerprint_patch_path.exists():
    with open(_fingerprint_patch_path, 'r', encoding='utf-8') as f:
        FINGERPRINT_PATCH_SCRIPT = f.read()
else:
    FINGERPRINT_PATCH_SCRIPT = ""

if _audio_spoof_path.exists():
    with open(_audio_spoof_path, 'r', encoding='utf-8') as f:
        AUDIO_SPOOF_SCRIPT = f.read()
else:
    AUDIO_SPOOF_SCRIPT = ""

# Import socketio for emitting events
import socketio

# Socket.IO client for emitting events
sio_client = socketio.Client()


def get_db_session() -> Session:
    """Get database session."""
    return SessionLocal()


def emit_event(event_name: str, data: Dict[str, Any]):
    """Emit socket event (if socketio server is running)."""
    try:
        # Try to connect and emit (non-blocking)
        # In production, use Redis pub/sub or message queue
        print(f"[Socket Event] {event_name}: {data}")
        # TODO: Implement proper socket emission via Redis pub/sub or HTTP request to API
    except Exception as e:
        print(f"Failed to emit event: {e}")


def log_to_db(level: str, message: str, meta: Dict[str, Any] = None, db: Session = None):
    """Log message to database."""
    if db is None:
        db = get_db_session()
    
    try:
        log = Log(level=level, message=message, meta=meta)
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"Failed to log to DB: {e}")
    finally:
        if db:
            db.close()


def process_job(job_type: str, payload: Dict[str, Any]):
    """
    Main job processing function called by RQ worker.
    Args:
        job_type: Type of job (start_session, stop_session, run_job_execution)
        payload: Job payload dictionary
    """
    db = get_db_session()
    
    try:
        if job_type == "start_session":
            handle_start_session(payload, db)
        elif job_type == "stop_session":
            handle_stop_session(payload, db)
        elif job_type == "run_job_execution":
            handle_run_job_execution(payload, db)
        elif job_type == "run_workflow":
            handle_run_workflow(payload, db)
        else:
            log_to_db("error", f"Unknown job type: {job_type}", {"payload": payload}, db)
    except Exception as e:
        error_msg = f"Job processing failed: {str(e)}\n{traceback.format_exc()}"
        log_to_db("error", error_msg, {"job_type": job_type, "payload": payload}, db)
        raise
    finally:
        db.close()


def handle_start_session(payload: Dict[str, Any], db: Session):
    """Handle start_session job."""
    session_id = payload.get("session_id")
    if not session_id:
        raise ValueError("session_id required")
    
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise ValueError(f"Session {session_id} not found")
    
    # Get profile and proxy
    profile = db.query(Profile).filter(Profile.id == session.profile_id).first()
    if not profile:
        raise ValueError(f"Profile {session.profile_id} not found")
    
    proxy = None
    if session.proxy_id:
        proxy = db.query(Proxy).filter(Proxy.id == session.proxy_id).first()
    
    # Update session status
    session.status = "running"
    session.started_at = datetime.utcnow()
    db.commit()
    
    emit_event("session:update", {
        "id": session.id,
        "status": session.status,
        "started_at": session.started_at.isoformat() if session.started_at else None,
    })
    
    log_to_db("info", f"Session {session_id} started", {"session_id": session_id}, db)
    
    # Launch browser and navigate (simplified - actual implementation would keep browser alive)
    # For now, we'll just update status
    # In production, you'd maintain browser instances and keep them running


def handle_stop_session(payload: Dict[str, Any], db: Session):
    """Handle stop_session job."""
    session_id = payload.get("session_id")
    if not session_id:
        raise ValueError("session_id required")
    
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise ValueError(f"Session {session_id} not found")
    
    session.status = "stopped"
    session.stopped_at = datetime.utcnow()
    db.commit()
    
    emit_event("session:update", {
        "id": session.id,
        "status": session.status,
        "stopped_at": session.stopped_at.isoformat() if session.stopped_at else None,
    })
    
    log_to_db("info", f"Session {session_id} stopped", {"session_id": session_id}, db)


def handle_run_job_execution(payload: Dict[str, Any], db: Session):
    """
    Handle run_job_execution - main Playwright automation job.
    Creates browser, applies fingerprint, navigates, takes screenshot.
    """
    job_exec_id = payload.get("job_execution_id") or payload.get("jobExecId")
    if not job_exec_id:
        raise ValueError("job_execution_id required")
    
    job_exec = db.query(JobExecution).filter(JobExecution.id == job_exec_id).first()
    if not job_exec:
        raise ValueError(f"JobExecution {job_exec_id} not found")
    
    profile = db.query(Profile).filter(Profile.id == job_exec.profile_id).first()
    if not profile:
        raise ValueError(f"Profile {job_exec.profile_id} not found")
    
    # Update status
    job_exec.status = "running"
    job_exec.started_at = datetime.utcnow()
    db.commit()
    
    emit_event("jobExecution:update", {
        "id": job_exec.id,
        "status": job_exec.status,
        "started_at": job_exec.started_at.isoformat() if job_exec.started_at else None,
    })
    
    browser = None
    context = None
    page = None
    
    try:
        # Get proxy config if available
        proxy_config = None
        if job_exec.profile_id and profile:
            # Check if profile has associated proxy (via session)
            session = db.query(SessionModel).filter(
                SessionModel.profile_id == job_exec.profile_id,
                SessionModel.status == "running"
            ).first()
            
            if session and session.proxy_id:
                proxy = db.query(Proxy).filter(Proxy.id == session.proxy_id).first()
                if proxy and proxy.active:
                    # Decrypt proxy password
                    proxy_password = None
                    if proxy.password:
                        try:
                            proxy_password = decrypt(proxy.password)
                        except Exception as e:
                            log_to_db("warn", f"Failed to decrypt proxy password: {e}", {}, db)
                    
                    proxy_config = {
                        "server": f"{proxy.type}://{proxy.host}:{proxy.port}",
                        "username": proxy.username,
                        "password": proxy_password,
                    }
        
        # Get fingerprint data
        fingerprint_data = profile.fingerprint or {}
        if profile.user_agent:
            fingerprint_data["user_agent"] = profile.user_agent
        
        # Build injection script
        injection_script = build_injection(fingerprint_data)
        
        # Launch Playwright
        playwright = sync_playwright().start()
        
        # Launch browser with proxy if configured
        browser = playwright.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--disable-dev-shm-usage",
                "--no-sandbox",
                "--use-fake-device-for-media-stream",
                "--use-fake-ui-for-media-stream",
                "--disable-webgpu",
                "--disable-features=WebRtcHideLocalIpsWithMdns",
                "--force-webrtc-ip-handling-policy=disable_non_proxied_udp",
                "--no-first-run",
                "--no-default-browser-check",
                "--autoplay-policy=no-user-gesture-required",
            ]
        )
        
        # Create context with proxy
        context_options = {
            "viewport": {
                "width": fingerprint_data.get("screen_width", 1920),
                "height": fingerprint_data.get("screen_height", 1080),
            },
            "user_agent": fingerprint_data.get("user_agent") or profile.user_agent,
        }
        
        if proxy_config:
            context_options["proxy"] = proxy_config
        
        context = browser.new_context(**context_options)
        
        # Add scripts as early as possible: fingerprint patch, audio spoof, then fingerprint injection
        if FINGERPRINT_PATCH_SCRIPT:
            context.add_init_script(FINGERPRINT_PATCH_SCRIPT)
        if AUDIO_SPOOF_SCRIPT:
            context.add_init_script(AUDIO_SPOOF_SCRIPT)
        context.add_init_script(injection_script)
        
        # Create page
        page = context.new_page()
        
        # Get URL from job payload or default test URL
        job = db.query(Job).filter(Job.id == job_exec.job_id).first()
        test_url = "https://example.com"
        if job and job.payload:
            test_url = job.payload.get("url") or test_url
        
        # Navigate
        log_to_db("info", f"Navigating to {test_url}", {"job_exec_id": job_exec_id}, db)
        page.goto(test_url, wait_until="networkidle", timeout=30000)
        
        # Wait a bit for page to settle
        page.wait_for_timeout(2000)
        
        # Take screenshot
        screenshot_bytes = page.screenshot(full_page=True)
        
        # Save screenshot
        screenshot_path = save_screenshot(job_exec_id, screenshot_bytes)
        
        # Update job execution
        job_exec.status = "completed"
        job_exec.completed_at = datetime.utcnow()
        job_exec.result = {
            "screenshot": screenshot_path,
            "url": test_url,
        }
        db.commit()
        
        emit_event("jobExecution:update", {
            "id": job_exec.id,
            "status": job_exec.status,
            "completed_at": job_exec.completed_at.isoformat() if job_exec.completed_at else None,
            "result": job_exec.result,
        })
        
        log_to_db("info", f"JobExecution {job_exec_id} completed", {
            "job_exec_id": job_exec_id,
            "screenshot": screenshot_path,
        }, db)
        
    except Exception as e:
        error_msg = f"JobExecution {job_exec_id} failed: {str(e)}\n{traceback.format_exc()}"
        log_to_db("error", error_msg, {"job_exec_id": job_exec_id}, db)
        
        job_exec.status = "failed"
        job_exec.completed_at = datetime.utcnow()
        job_exec.error = str(e)
        db.commit()
        
        emit_event("jobExecution:update", {
            "id": job_exec.id,
            "status": job_exec.status,
            "error": job_exec.error,
        })
        
        raise
    
    finally:
        # Cleanup
        if page:
            try:
                page.close()
            except:
                pass
        if context:
            try:
                context.close()
            except:
                pass
        if browser:
            try:
                browser.close()
            except:
                pass
        try:
            playwright.stop()
        except:
            pass


def handle_run_workflow(payload: Dict[str, Any], db: Session):
    """
    Handle run_workflow - execute workflow using React Flow graph.
    """
    workflow_id = payload.get("workflow_id")
    profile_id = payload.get("profile_id")
    
    if not workflow_id:
        raise ValueError("workflow_id required")
    if not profile_id:
        raise ValueError("profile_id required")
    
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise ValueError(f"Workflow {workflow_id} not found")
    
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise ValueError(f"Profile {profile_id} not found")
    
    log_to_db("info", f"Starting workflow {workflow.name} for profile {profile_id}", {
        "workflow_id": workflow_id,
        "profile_id": profile_id,
    }, db)
    
    browser = None
    context = None
    page = None
    playwright = None
    
    try:
        # Get proxy config if available
        proxy_config = None
        session = db.query(SessionModel).filter(
            SessionModel.profile_id == profile_id,
            SessionModel.status == "running"
        ).first()
        
        if session and session.proxy_id:
            proxy = db.query(Proxy).filter(Proxy.id == session.proxy_id).first()
            if proxy and proxy.active:
                proxy_password = None
                if proxy.password:
                    try:
                        proxy_password = decrypt(proxy.password)
                    except Exception as e:
                        log_to_db("warn", f"Failed to decrypt proxy password: {e}", {}, db)
                
                proxy_config = {
                    "server": f"{proxy.type}://{proxy.host}:{proxy.port}",
                    "username": proxy.username,
                    "password": proxy_password,
                }
        
        # Get fingerprint data
        fingerprint_data = profile.fingerprint or {}
        if profile.user_agent:
            fingerprint_data["user_agent"] = profile.user_agent
        
        # Build injection script
        injection_script = build_injection(fingerprint_data)
        
        # Launch Playwright
        playwright = sync_playwright().start()
        
        # Run in non-headless mode so user can see automation
        browser = playwright.chromium.launch(
            headless=False,  # Show browser window for visibility
            args=[
                "--disable-blink-features=AutomationControlled",
                "--disable-dev-shm-usage",
                "--no-sandbox",
                "--disable-infobars",  # Hide "Chrome is being controlled" message
                "--use-fake-device-for-media-stream",
                "--use-fake-ui-for-media-stream",
                "--disable-webgpu",
                "--disable-features=WebRtcHideLocalIpsWithMdns",
                "--force-webrtc-ip-handling-policy=disable_non_proxied_udp",
                "--no-first-run",
                "--no-default-browser-check",
                "--autoplay-policy=no-user-gesture-required",
            ]
        )
        
        # Create context with proxy
        context_options = {
            "viewport": {
                "width": fingerprint_data.get("screen_width", 1920),
                "height": fingerprint_data.get("screen_height", 1080),
            },
            "user_agent": fingerprint_data.get("user_agent") or profile.user_agent,
        }
        
        if proxy_config:
            context_options["proxy"] = proxy_config
        
        context = browser.new_context(**context_options)
        # Add scripts as early as possible: fingerprint patch, audio spoof, then fingerprint injection
        if FINGERPRINT_PATCH_SCRIPT:
            context.add_init_script(FINGERPRINT_PATCH_SCRIPT)
        if AUDIO_SPOOF_SCRIPT:
            context.add_init_script(AUDIO_SPOOF_SCRIPT)
        context.add_init_script(injection_script)
        page = context.new_page()
        
        # Execute workflow
        workflow_data = workflow.data or {}
        result = execute_workflow(page, workflow_data)
        
        log_to_db("info", f"Workflow {workflow_id} completed", {
            "workflow_id": workflow_id,
            "profile_id": profile_id,
            "result": result,
        }, db)
        
        return result
        
    except Exception as e:
        error_msg = f"Workflow {workflow_id} failed: {str(e)}\n{traceback.format_exc()}"
        log_to_db("error", error_msg, {"workflow_id": workflow_id, "profile_id": profile_id}, db)
        raise
    
    finally:
        # Cleanup
        if page:
            try:
                page.close()
            except:
                pass
        if context:
            try:
                context.close()
            except:
                pass
        if browser:
            try:
                browser.close()
            except:
                pass
        if playwright:
            try:
                playwright.stop()
            except:
                pass

