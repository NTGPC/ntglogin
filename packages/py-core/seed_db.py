"""
Seed database with sample data.
Run: python seed_db.py
"""
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.orm import Session
from db.database import SessionLocal, engine
from db.models import User, Profile, Proxy, Session, Job, Log
from api.auth import hash_password

def seed_database():
    db = SessionLocal()
    
    try:
        print("🌱 Starting seed...")
        
        # Create admin user
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin_password = hash_password("admin123")
            admin = User(
                username="admin",
                password=admin_password,
                role="admin"
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print("✅ Created admin user: admin / admin123")
        else:
            print("ℹ️  Admin user already exists")
        
        # Create sample profiles
        profiles_count = db.query(Profile).count()
        if profiles_count == 0:
            profile1 = Profile(
                name="Profile 1 - Chrome Windows",
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                fingerprint={
                    "canvas": "abc123",
                    "webgl": "def456",
                    "audio": "ghi789",
                }
            )
            profile2 = Profile(
                name="Profile 2 - Firefox MacOS",
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
                fingerprint={
                    "canvas": "xyz123",
                    "webgl": "uvw456",
                    "audio": "rst789",
                }
            )
            db.add_all([profile1, profile2])
            db.commit()
            db.refresh(profile1)
            db.refresh(profile2)
            print("✅ Created profiles:", profile1.name, profile2.name)
        else:
            print(f"ℹ️  {profiles_count} profiles already exist")
            profile1 = db.query(Profile).first()
            profile2 = db.query(Profile).offset(1).first()
        
        # Create sample proxies
        proxies_count = db.query(Proxy).count()
        if proxies_count == 0:
            proxy1 = Proxy(
                host="192.168.1.100",
                port=8080,
                username="proxyuser1",
                password=None,  # Will be encrypted if set
                type="http",
                active=True
            )
            proxy2 = Proxy(
                host="192.168.1.101",
                port=1080,
                username="proxyuser2",
                password=None,
                type="socks5",
                active=True
            )
            db.add_all([proxy1, proxy2])
            db.commit()
            db.refresh(proxy1)
            db.refresh(proxy2)
            print("✅ Created proxies:", f"{proxy1.host}:{proxy1.port}", f"{proxy2.host}:{proxy2.port}")
        else:
            print(f"ℹ️  {proxies_count} proxies already exist")
            proxy1 = db.query(Proxy).first()
            proxy2 = db.query(Proxy).offset(1).first()
        
        # Create sample sessions
        sessions_count = db.query(Session).count()
        if sessions_count == 0 and profile1 and proxy1:
            session1 = Session(
                profile_id=profile1.id,
                proxy_id=proxy1.id,
                status="idle",
                meta={"lastActivity": "2024-01-01T00:00:00Z"}
            )
            session2 = Session(
                profile_id=profile2.id if profile2 else profile1.id,
                proxy_id=proxy2.id if proxy2 else proxy1.id,
                status="running",
                meta={"lastActivity": "2024-01-01T00:00:00Z"}
            )
            db.add_all([session1, session2])
            db.commit()
            print("✅ Created sessions:", session1.id, session2.id)
        else:
            print(f"ℹ️  {sessions_count} sessions already exist")
        
        # Create sample jobs
        jobs_count = db.query(Job).count()
        if jobs_count == 0:
            from datetime import datetime
            job1 = Job(
                type="profile_sync",
                payload={"profileId": profile1.id if profile1 else 1, "action": "sync_cookies"},
                status="queued",
                attempts=0
            )
            job2 = Job(
                type="proxy_check",
                payload={"proxyIds": [proxy1.id if proxy1 else 1, proxy2.id if proxy2 else 2]},
                status="processing",
                attempts=1
            )
            db.add_all([job1, job2])
            db.commit()
            print("✅ Created jobs:", job1.type, job2.type)
        else:
            print(f"ℹ️  {jobs_count} jobs already exist")
        
        # Create sample logs
        logs_count = db.query(Log).count()
        if logs_count == 0:
            log1 = Log(
                level="info",
                message="Application started successfully",
                meta={"timestamp": "2024-01-01T00:00:00Z"}
            )
            log2 = Log(
                level="warn",
                message="High memory usage detected",
                meta={"usage": "85%"}
            )
            log3 = Log(
                level="error",
                message="Failed to connect to proxy",
                meta={"proxyId": proxy1.id if proxy1 else 1, "error": "Connection timeout"}
            )
            db.add_all([log1, log2, log3])
            db.commit()
            print("✅ Created logs")
        else:
            print(f"ℹ️  {logs_count} logs already exist")
        
        print("🎉 Seed completed successfully!")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

