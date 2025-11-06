"""
SQLAlchemy models mapping to Prisma schema.
Maps exactly to existing database tables: users, profiles, proxies, sessions, jobs, logs.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)  # hashed
    role = Column(String, default="admin")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False, index=True)
    user_agent = Column(String, nullable=True)
    fingerprint = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    sessions = relationship("Session", back_populates="profile", cascade="all, delete-orphan")


class Proxy(Base):
    __tablename__ = "proxies"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    host = Column(String, nullable=False)
    port = Column(Integer, nullable=False)
    username = Column(String, nullable=True)
    password = Column(String, nullable=True)  # encrypted
    type = Column(String, nullable=False)  # "http", "socks5"
    active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    sessions = relationship("Session", back_populates="proxy")


class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    proxy_id = Column(Integer, ForeignKey("proxies.id", ondelete="SET NULL"), nullable=True)
    status = Column(String, default="idle", index=True)  # "idle", "running", "stopped"
    started_at = Column(DateTime(timezone=True), nullable=True)
    stopped_at = Column(DateTime(timezone=True), nullable=True)
    meta = Column(JSON, nullable=True)
    
    profile = relationship("Profile", back_populates="sessions")
    proxy = relationship("Proxy", back_populates="sessions")


class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    type = Column(String, nullable=False)
    payload = Column(JSON, nullable=False)
    status = Column(String, default="queued", index=True)  # "queued", "processing", "done", "failed"
    attempts = Column(Integer, default=0)
    scheduled_at = Column(DateTime(timezone=True), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Log(Base):
    __tablename__ = "logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    level = Column(String, nullable=False, index=True)  # "info", "warn", "error"
    message = Column(Text, nullable=False)
    meta = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


# Optional: JobExecution model (if table exists, otherwise we'll work with Job+Session)
# This represents an execution of a job for a specific profile
class JobExecution(Base):
    __tablename__ = "job_executions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True)
    status = Column(String, default="pending")  # "pending", "running", "completed", "failed"
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    result = Column(JSON, nullable=True)  # screenshot path, logs, etc.
    error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    job = relationship("Job")
    profile = relationship("Profile")
    session = relationship("Session")


# Optional: Fingerprint model (if separate table exists)
class Fingerprint(Base):
    __tablename__ = "fingerprints"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    canvas_hash = Column(String, nullable=True)
    webgl_vendor = Column(String, nullable=True)
    webgl_renderer = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    screen_width = Column(Integer, nullable=True)
    screen_height = Column(Integer, nullable=True)
    device_memory = Column(Integer, nullable=True)
    hardware_concurrency = Column(Integer, nullable=True)
    platform = Column(String, nullable=True)
    timezone = Column(String, nullable=True)
    language = Column(String, nullable=True)
    plugins = Column(JSON, nullable=True)
    meta = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# Optional: Workflow model
class Workflow(Base):
    __tablename__ = "workflows"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    data = Column(JSON, nullable=True)  # React Flow graph {nodes, edges}
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

