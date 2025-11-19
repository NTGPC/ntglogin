-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_agents" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "os" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "uaPlatform" TEXT,
    "uaPlatformVersion" TEXT,
    "uaFullVersion" TEXT,
    "browserVersion" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webgl_renderers" (
    "id" SERIAL NOT NULL,
    "vendor" TEXT NOT NULL,
    "renderer" TEXT NOT NULL,
    "os" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webgl_renderers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userAgentId" INTEGER,
    "userAgent" TEXT,
    "platform" TEXT NOT NULL DEFAULT 'Win32',
    "hardwareConcurrency" INTEGER NOT NULL DEFAULT 8,
    "deviceMemory" INTEGER NOT NULL DEFAULT 8,
    "languages" TEXT[] DEFAULT ARRAY['en-US', 'en']::TEXT[],
    "canvasMode" TEXT NOT NULL DEFAULT 'noise',
    "clientRectsMode" TEXT,
    "webglRendererId" INTEGER,
    "webglRenderer" TEXT,
    "webglVendor" TEXT,
    "webglImageMode" TEXT,
    "webglMetaMode" TEXT,
    "audioContextMode" TEXT NOT NULL DEFAULT 'noise',
    "webrtcMode" TEXT NOT NULL DEFAULT 'fake',
    "webrtcMainIP" BOOLEAN DEFAULT false,
    "geolocationMode" TEXT NOT NULL DEFAULT 'fake',
    "geolocationEnabled" BOOLEAN,
    "geolocationLat" DOUBLE PRECISION,
    "geolocationLon" DOUBLE PRECISION,
    "timezone" TEXT,
    "timezoneId" TEXT,
    "language" TEXT,
    "macAddress" TEXT,
    "screenWidth" INTEGER,
    "screenHeight" INTEGER,
    "osName" TEXT,
    "os" TEXT,
    "osArch" TEXT,
    "browserVersion" INTEGER,
    "user_agent" TEXT,
    "fingerprint" JSONB,
    "fingerprintId" INTEGER,
    "fingerprintJson" JSONB,
    "proxyRefId" TEXT,
    "proxyManual" JSONB,
    "proxyId" INTEGER,
    "workflowId" INTEGER,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fingerprints" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "data" JSONB NOT NULL,
    "ownerId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fingerprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proxies" (
    "id" SERIAL NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "type" TEXT NOT NULL DEFAULT 'http',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proxies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "proxy_id" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "started_at" TIMESTAMP(3),
    "stopped_at" TIMESTAMP(3),
    "meta" JSONB,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "scheduled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_executions" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "session_id" INTEGER,
    "workflow_id" INTEGER,
    "provider" TEXT NOT NULL DEFAULT 'workflow',
    "externalId" TEXT,
    "payload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "result" JSONB,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs" (
    "id" SERIAL NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflows" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "data" JSONB,
    "source" TEXT NOT NULL DEFAULT 'local',
    "n8nWorkflowId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowAssignment" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "workflowId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "changelogs" (
    "id" SERIAL NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "files" JSONB,
    "author" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "changelogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_agents_name_key" ON "user_agents"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_agents_value_key" ON "user_agents"("value");

-- CreateIndex
CREATE INDEX "user_agents_os_idx" ON "user_agents"("os");

-- CreateIndex
CREATE INDEX "user_agents_browserVersion_idx" ON "user_agents"("browserVersion");

-- CreateIndex
CREATE UNIQUE INDEX "webgl_renderers_renderer_key" ON "webgl_renderers"("renderer");

-- CreateIndex
CREATE INDEX "webgl_renderers_os_idx" ON "webgl_renderers"("os");

-- CreateIndex
CREATE INDEX "webgl_renderers_vendor_idx" ON "webgl_renderers"("vendor");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userAgent_key" ON "profiles"("userAgent");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_macAddress_key" ON "profiles"("macAddress");

-- CreateIndex
CREATE INDEX "profiles_name_idx" ON "profiles"("name");

-- CreateIndex
CREATE INDEX "profiles_workflowId_idx" ON "profiles"("workflowId");

-- CreateIndex
CREATE INDEX "profiles_userAgent_idx" ON "profiles"("userAgent");

-- CreateIndex
CREATE INDEX "profiles_userAgentId_idx" ON "profiles"("userAgentId");

-- CreateIndex
CREATE INDEX "profiles_webglRendererId_idx" ON "profiles"("webglRendererId");

-- CreateIndex
CREATE INDEX "proxies_active_idx" ON "proxies"("active");

-- CreateIndex
CREATE INDEX "sessions_profile_id_idx" ON "sessions"("profile_id");

-- CreateIndex
CREATE INDEX "sessions_status_idx" ON "sessions"("status");

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- CreateIndex
CREATE INDEX "jobs_scheduled_at_idx" ON "jobs"("scheduled_at");

-- CreateIndex
CREATE INDEX "job_executions_job_id_idx" ON "job_executions"("job_id");

-- CreateIndex
CREATE INDEX "job_executions_profile_id_idx" ON "job_executions"("profile_id");

-- CreateIndex
CREATE INDEX "job_executions_status_idx" ON "job_executions"("status");

-- CreateIndex
CREATE INDEX "logs_level_idx" ON "logs"("level");

-- CreateIndex
CREATE INDEX "logs_created_at_idx" ON "logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowAssignment_profileId_workflowId_key" ON "WorkflowAssignment"("profileId", "workflowId");

-- CreateIndex
CREATE INDEX "changelogs_version_idx" ON "changelogs"("version");

-- CreateIndex
CREATE INDEX "changelogs_type_idx" ON "changelogs"("type");

-- CreateIndex
CREATE INDEX "changelogs_created_at_idx" ON "changelogs"("created_at");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userAgentId_fkey" FOREIGN KEY ("userAgentId") REFERENCES "user_agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_webglRendererId_fkey" FOREIGN KEY ("webglRendererId") REFERENCES "webgl_renderers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_fingerprintId_fkey" FOREIGN KEY ("fingerprintId") REFERENCES "fingerprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_proxyId_fkey" FOREIGN KEY ("proxyId") REFERENCES "proxies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_proxy_id_fkey" FOREIGN KEY ("proxy_id") REFERENCES "proxies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_executions" ADD CONSTRAINT "job_executions_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_executions" ADD CONSTRAINT "job_executions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_executions" ADD CONSTRAINT "job_executions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_executions" ADD CONSTRAINT "job_executions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowAssignment" ADD CONSTRAINT "WorkflowAssignment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowAssignment" ADD CONSTRAINT "WorkflowAssignment_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

