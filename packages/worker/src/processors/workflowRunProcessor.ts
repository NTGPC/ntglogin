import { WorkflowEngine } from '../utils/workflowEngine';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3000';

export default async function workflowRunProcessor(job: any) {
  const { profileId, workflowJson, vars } = job.data;

  if (!profileId) {
    throw new Error('profileId is required');
  }

  if (!workflowJson) {
    throw new Error('workflowJson is required');
  }

  const engine = new WorkflowEngine(profileId, vars || {});

  try {
    await engine.init();

    const result = await engine.run(workflowJson);

    // Update JobExecution with result
    const executionId = job.data.executionId;
    if (executionId) {
      try {
        await axios.put(`${BACKEND_URL}/api/job-executions/${executionId}`, {
          status: result.status === 'success' ? 'completed' : 'failed',
          result: {
            status: result.status,
            message: result.message,
            screenshots: result.screenshots,
          },
          completed_at: new Date().toISOString(),
        });
      } catch (err: any) {
        console.error(`Failed to update JobExecution ${executionId}:`, err?.message);
      }
    }

    await engine.teardown();

    return result;
  } catch (error: any) {
    // Update JobExecution with error
    const executionId = job.data.executionId;
    if (executionId) {
      try {
        await axios.put(`${BACKEND_URL}/api/job-executions/${executionId}`, {
          status: 'failed',
          error: error?.message || String(error),
          completed_at: new Date().toISOString(),
        });
      } catch (err: any) {
        console.error(`Failed to update JobExecution ${executionId}:`, err?.message);
      }
    }

    await engine.teardown().catch(() => {});

    throw error;
  }
}
