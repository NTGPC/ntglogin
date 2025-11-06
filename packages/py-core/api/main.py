"""
FastAPI main application - matches Node.js API contract exactly.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from api.routes import auth, profiles, proxies, sessions, jobs, logs, fingerprints, workflows, health, job_executions
from api.compat import setup_compat

app = FastAPI(title="NTG Login API", version="1.0.0")

# CORS middleware
# Note: When allow_credentials=True, cannot use allow_origins=["*"]
# Must specify explicit origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5175",
        "http://localhost:5174",
        "http://localhost:5173",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes with /api prefix to match Node.js structure
app.include_router(auth.router, prefix="/api")
app.include_router(profiles.router, prefix="/api")
app.include_router(proxies.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(job_executions.router, prefix="/api")
app.include_router(logs.router, prefix="/api")
app.include_router(fingerprints.router, prefix="/api")
app.include_router(workflows.router, prefix="/api")
app.include_router(health.router, prefix="/api")

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "NTG Login API Server",
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/health",
            "auth": "/api/auth",
            "profiles": "/api/profiles",
            "proxies": "/api/proxies",
            "sessions": "/api/sessions",
            "jobs": "/api/jobs",
            "logs": "/api/logs",
            "fingerprints": "/api/fingerprints",
            "workflows": "/api/workflows",
        },
    }

# Socket.IO setup for realtime events
sio = socketio.AsyncServer(cors_allowed_origins="*", async_mode="asgi")
socket_app = socketio.ASGIApp(sio, app)

# Store socketio instance for worker to emit events
app.sio = sio

# Compatibility layer setup
setup_compat(app)

# Export app for uvicorn (socket_app includes socketio, but app works too)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000, reload=True)

