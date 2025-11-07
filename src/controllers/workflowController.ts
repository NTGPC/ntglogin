import { Request, Response } from 'express';
import * as workflowService from '../services/workflowService';
import { AppError, asyncHandler } from '../utils/errorHandler';

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const workflows = await workflowService.getAllWorkflows();

  res.json({
    success: true,
    data: workflows,
  });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const workflow = await workflowService.getWorkflowById(id);

  if (!workflow) {
    throw new AppError('Workflow not found', 404);
  }

  res.json({
    success: true,
    data: workflow,
  });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { name, data } = req.body;

  if (!name || !data) {
    throw new AppError('Name and data are required', 400);
  }

  const workflow = await workflowService.createWorkflow({
    name,
    data,
  });

  res.status(201).json({
    success: true,
    message: 'Workflow created successfully',
    data: workflow,
  });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { name, data } = req.body;

  const workflow = await workflowService.updateWorkflow(id, {
    name,
    data,
  });

  res.json({
    success: true,
    message: 'Workflow updated successfully',
    data: workflow,
  });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await workflowService.deleteWorkflow(id);

  res.json({
    success: true,
    message: 'Workflow deleted successfully',
  });
});

export const test = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const workflow = await workflowService.getWorkflowById(id);

  if (!workflow) {
    throw new AppError('Workflow not found', 404);
  }

  // Validate workflow structure
  const data = workflow.data as any;
  const nodes = data?.nodes || [];
  const edges = data?.edges || [];

  const issues: string[] = [];
  
  // Check for start node
  const startNodes = nodes.filter((n: any) => n.type === 'start');
  if (startNodes.length === 0) {
    issues.push('Workflow must have at least one Start node');
  } else if (startNodes.length > 1) {
    issues.push('Workflow should have exactly one Start node');
  }

  // Check for end node
  const endNodes = nodes.filter((n: any) => n.type === 'end');
  if (endNodes.length === 0) {
    issues.push('Workflow should have at least one End node');
  }

  // Check for orphaned nodes (no incoming edges except start)
  const nodeIds = new Set(nodes.map((n: any) => n.id));
  const hasIncoming: Set<string> = new Set();
  edges.forEach((e: any) => {
    if (nodeIds.has(e.target)) {
      hasIncoming.add(e.target);
    }
  });
  
  nodes.forEach((n: any) => {
    if (n.type !== 'start' && !hasIncoming.has(n.id)) {
      issues.push(`Node "${n.id}" (${n.type}) has no incoming edges`);
    }
  });

  // Check for cycles (simple check)
  const visited = new Set<string>();
  const recStack = new Set<string>();
  let hasCycle = false;

  const adj: Record<string, string[]> = {};
  nodes.forEach((n: any) => { adj[n.id] = []; });
  edges.forEach((e: any) => {
    if (adj[e.source]) {
      adj[e.source].push(e.target);
    }
  });

  function dfs(nodeId: string) {
    visited.add(nodeId);
    recStack.add(nodeId);
    for (const neighbor of adj[nodeId] || []) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        return true;
      }
    }
    recStack.delete(nodeId);
    return false;
  }

  for (const nodeId of Object.keys(adj)) {
    if (!visited.has(nodeId)) {
      if (dfs(nodeId)) {
        hasCycle = true;
        break;
      }
    }
  }

  if (hasCycle) {
    issues.push('Workflow contains cycles (circular dependencies)');
  }

  res.json({
    success: issues.length === 0,
    message: issues.length === 0 ? 'Workflow is valid' : 'Workflow has validation issues',
    issues,
    stats: {
      nodes: nodes.length,
      edges: edges.length,
      startNodes: startNodes.length,
      endNodes: endNodes.length,
    },
  });
});

export const execute = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { profileIds, vars } = req.body;

  if (!profileIds || !Array.isArray(profileIds) || profileIds.length === 0) {
    throw new AppError('profileIds array is required', 400);
  }

  const workflow = await workflowService.getWorkflowById(id);
  if (!workflow) {
    throw new AppError('Workflow not found', 404);
  }

  // Check if workflow has n8nWorkflowId (n8n workflow) or local data (local editor workflow)
  const isN8nWorkflow = !!(workflow as any).n8nWorkflowId;
  
  if (isN8nWorkflow) {
    throw new AppError('Use /api/n8n-workflows/:id/run endpoint for n8n workflows', 400);
  }

  // Build workflow JSON from workflow.data
  const workflowJson = workflow.data as any || { nodes: [], edges: [] };
  if (vars) {
    workflowJson.vars = vars;
  }

  // Create Job and JobExecution records for local editor workflows
  const prisma = (await import('../prismaClient')).default;
  const created = [];

  // Try to enqueue to worker queue (check if worker queue is available)
  // const WORKER_QUEUE_URL = process.env.WORKER_QUEUE_URL;

  for (const profileId of profileIds) {
    // Create Job
    const job = await prisma.job.create({
      data: {
        type: 'workflow.run', // Changed to match worker processor
        payload: { workflow_id: id, workflowJson, vars: vars || {} },
        status: 'queued',
      },
    });

    // Create JobExecution
    const execution = await prisma.jobExecution.create({
      data: {
        job_id: job.id,
        profile_id: Number(profileId),
        workflow_id: id,
        status: 'pending',
        provider: 'local',
        payload: vars ? { vars } : undefined,
      },
    });

    created.push({
      jobId: job.id,
      executionId: execution.id,
      profileId: Number(profileId),
    });

    // Try to process immediately using Node.js worker
    try {
      // Import and run processor directly
      // Use relative path from backend src to worker src
      // @ts-ignore - Dynamic import may not resolve at compile time
      const workflowRunProcessor = (await import('../../../packages/worker/src/processors/workflowRunProcessor')).default;
      
      console.log(`🔄 [Workflow] Starting processor for job ${job.id}, profile ${profileId}, execution ${execution.id}`);
      
      // Process job in background (don't await to avoid blocking)
      workflowRunProcessor({
        data: {
          profileId: Number(profileId),
          workflowJson,
          vars: vars || {},
          executionId: execution.id,
        },
      }).then((_result: any) => {
        console.log(`✅ [Workflow] Completed job ${job.id}`);
      }).catch((err: any) => {
        console.error(`❌ [Workflow] Failed to process workflow job ${job.id}:`, err?.message || err);
        console.error(`❌ [Workflow] Error stack:`, err?.stack);
        // Update execution status to failed
        prisma.jobExecution.update({
          where: { id: execution.id },
          data: {
            status: 'failed',
            error: err?.message || String(err),
            completed_at: new Date(),
          },
        }).catch((updateErr: any) => {
          console.error(`❌ [Workflow] Failed to update execution status:`, updateErr?.message);
        });
      });
      
      console.log(`✅ [Workflow] Started processing job ${job.id} for profile ${profileId}`);
    } catch (processorError: any) {
      console.error(`⚠️ [Workflow] Failed to import/start processor for job ${job.id}:`, processorError?.message);
      console.error(`⚠️ [Workflow] Error stack:`, processorError?.stack);
      // Continue - job is in DB, can be processed later
    }
  }

  res.json({
    success: true,
    message: `Created ${created.length} job execution(s). Jobs will be processed by worker.`,
    data: created,
  });
});

export const runWorkflowForProfile = asyncHandler(async (req: Request, res: Response) => {
  const { profileId, workflowId, email, password, proxyId } = req.body;

  if (!profileId) {
    throw new AppError('profileId is required', 400);
  }

  if (!workflowId) {
    throw new AppError('workflowId is required', 400);
  }

  // Get profile from database
  const prisma = (await import('../prismaClient')).default;
  const profile = await prisma.profile.findUnique({ 
    where: { id: Number(profileId) },
  });

  if (!profile) {
    throw new AppError('Profile not found', 404);
  }

  // Build userDataDir (persistent profile directory)
  const path = (await import('path')).default;
  const fs = (await import('fs')).default;
  const profilesDir = path.join(process.cwd(), 'browser_profiles');
  if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
  }
  const userDataDir = path.join(profilesDir, `profile_${profileId}`);

  // Get executable path from environment or use default Chrome path
  // You can store this in profile.meta or use environment variable
  let executablePath = process.env.CHROME_EXECUTABLE_PATH || '';
  
  // Try to get from profile fingerprint or meta
  if (profile.fingerprint && typeof profile.fingerprint === 'object') {
    const fp = profile.fingerprint as any;
    if (fp.executablePath) {
      executablePath = fp.executablePath;
    }
  }

  // Default Chrome paths for Windows
  if (!executablePath) {
    const os = (await import('os')).default;
    const platform = os.platform();
    if (platform === 'win32') {
      executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      // Try alternative paths
      if (!fs.existsSync(executablePath)) {
        executablePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
      }
    } else if (platform === 'darwin') {
      executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    } else {
      executablePath = 'google-chrome'; // Linux
    }
  }

  // Get proxy config - try from request body, or from most recent session
  let proxy: { host: string; port: number; username?: string; password?: string } | undefined = undefined;
  
  try {
    let proxyIdToUse = proxyId;
    
    // If no proxyId in request, try to get from most recent session
    if (!proxyIdToUse) {
      const recentSession = await prisma.session.findFirst({
        where: { profile_id: Number(profileId) },
        orderBy: { started_at: 'desc' },
        include: { proxy: true },
      });
      
      if (recentSession?.proxy) {
        proxyIdToUse = recentSession.proxy.id;
      }
    }
    
    // Fetch proxy if we have proxyId
    if (proxyIdToUse) {
      const proxyRecord = await prisma.proxy.findUnique({
        where: { id: Number(proxyIdToUse) },
      });
      
      if (proxyRecord && proxyRecord.active) {
        proxy = {
          host: proxyRecord.host,
          port: proxyRecord.port,
          username: proxyRecord.username || undefined,
          password: proxyRecord.password || undefined,
        };
        console.log(`✅ [Workflow] Using proxy: ${proxy.host}:${proxy.port}`);
      }
    }
  } catch (proxyErr) {
    console.warn(`⚠️ [Workflow] Could not load proxy for profile ${profileId}:`, proxyErr);
    // Continue without proxy
  }

  // Build vars from request
  const vars: Record<string, any> = {};
  if (email) vars.email = email;
  if (password) vars.password = password;

  // Import and run profileStartProcessor
  try {
    // @ts-ignore - Dynamic import may not resolve at compile time
    const profileStartProcessor = (await import('../../../packages/worker/src/processors/profileStartProcessor')).default;
    
    console.log(`🔄 [Workflow] Starting profile ${profileId} with workflow ${workflowId}`);
    
    // Process in background (don't await to avoid blocking)
    profileStartProcessor({
      data: {
        profileId: Number(profileId),
        executablePath,
        userDataDir,
        proxy,
        workflowId: Number(workflowId),
        vars,
      },
    }).then((_result: any) => {
      console.log(`✅ [Workflow] Profile started successfully`);
    }).catch((err: any) => {
      console.error(`❌ [Workflow] Failed to start profile:`, err?.message || err);
      console.error(`❌ [Workflow] Error stack:`, err?.stack);
    });

    res.json({
      success: true,
      message: `Profile ${profileId} started with workflow ${workflowId}. Browser should open shortly.`,
    });
  } catch (processorError: any) {
    console.error(`⚠️ [Workflow] Failed to import/start profileStartProcessor:`, processorError?.message);
    console.error(`⚠️ [Workflow] Error stack:`, processorError?.stack);
    throw new AppError(`Failed to start profile: ${processorError?.message}`, 500);
  }
});

