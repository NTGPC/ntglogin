-- AlterTable
ALTER TABLE "job_executions" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "payload" JSONB,
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'n8n',
ADD COLUMN     "workflow_id" INTEGER;

-- AlterTable
ALTER TABLE "workflows" ADD COLUMN     "description" TEXT,
ADD COLUMN     "n8nWorkflowId" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'local',
ALTER COLUMN "data" DROP NOT NULL;

-- CreateTable
CREATE TABLE "WorkflowAssignment" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "workflowId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowAssignment_profileId_workflowId_key" ON "WorkflowAssignment"("profileId", "workflowId");

-- AddForeignKey
ALTER TABLE "job_executions" ADD CONSTRAINT "job_executions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowAssignment" ADD CONSTRAINT "WorkflowAssignment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowAssignment" ADD CONSTRAINT "WorkflowAssignment_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
