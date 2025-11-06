"""
RQ queue setup for background job processing.
"""
import os
from redis import Redis
from rq import Queue
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Connect to Redis
redis_conn = Redis.from_url(REDIS_URL)

# Create queue
ntg_queue = Queue("ntg_jobs", connection=redis_conn)


def enqueue_job(job_type: str, payload: dict, **kwargs):
    """
    Enqueue a job to the RQ queue.
    Args:
        job_type: Type of job (start_session, stop_session, run_job_execution, etc.)
        payload: Job payload dictionary
        **kwargs: Additional RQ job options (timeout, retry, etc.)
    """
    from worker.run_job import process_job
    
    return ntg_queue.enqueue(
        process_job,
        job_type,
        payload,
        job_timeout="30m",  # 30 minutes timeout
        result_ttl=3600,  # Keep result for 1 hour
        failure_ttl=86400,  # Keep failures for 24 hours
        **kwargs
    )

