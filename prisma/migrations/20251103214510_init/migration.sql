-- CreateTable
CREATE TABLE "job_executions" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "session_id" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "result" JSONB,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_executions_job_id_idx" ON "job_executions"("job_id");

-- CreateIndex
CREATE INDEX "job_executions_profile_id_idx" ON "job_executions"("profile_id");

-- CreateIndex
CREATE INDEX "job_executions_status_idx" ON "job_executions"("status");

-- AddForeignKey
ALTER TABLE "job_executions" ADD CONSTRAINT "job_executions_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_executions" ADD CONSTRAINT "job_executions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_executions" ADD CONSTRAINT "job_executions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
