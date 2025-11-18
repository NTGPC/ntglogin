import prisma from '../prismaClient'

export const listWorkflows = async () => {
  return prisma.workflow.findMany({ 
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      source: true,
      description: true,
      updatedAt: true,
      createdAt: true,
    }
  })
}

export const createWorkflow = async (data: { name: string; description?: string }) => {
  return prisma.workflow.create({ data: { name: data.name, description: data.description, source: 'local' } })
}

export const updateWorkflow = async (id: number, data: { name?: string; description?: string }) => {
  return prisma.workflow.update({ where: { id }, data })
}

export const deleteWorkflow = async (id: number) => {
  return prisma.workflow.delete({ where: { id } })
}

export const assignProfiles = async (workflowId: number, profileIds: number[]) => {
  const created: any[] = []
  for (const profileId of profileIds) {
    const row = await prisma.workflowAssignment.upsert({
      where: { profileId_workflowId: { profileId, workflowId } },
      update: {},
      create: { profileId, workflowId },
    })
    created.push(row)
  }
  return created
}

export const createJobExecution = async (params: { profileId: number; workflowId: number; payload?: any }) => {
  return prisma.jobExecution.create({
    data: {
      job: { create: { type: 'workflow.run', payload: params.payload || {}, status: 'queued' } },
      profile: { connect: { id: params.profileId } },
      workflow: { connect: { id: params.workflowId } },
      status: 'queued',
      payload: params.payload || {},
    },
    include: { job: true },
  })
}

export const listExecutions = async (filter: { profileId?: number; workflowId?: number; status?: string }, skip = 0, take = 50) => {
  return prisma.jobExecution.findMany({
    where: {
      ...(filter.profileId ? { profile_id: filter.profileId } : {}),
      ...(filter.workflowId ? { workflow_id: filter.workflowId } : {}),
      ...(filter.status ? { status: filter.status } : {}),
    },
    orderBy: { created_at: 'desc' },
    skip,
    take,
    include: { profile: true, workflow: true },
  })
}

export const getExecutionById = async (id: number) => {
  return prisma.jobExecution.findUnique({ where: { id }, include: { profile: true, workflow: true, job: true } })
}

export const getAssignmentsByProfileId = async (profileId: number) => {
  return prisma.workflowAssignment.findMany({
    where: { profileId },
    include: { workflow: true },
  }).catch((err) => {
    console.error('Error fetching assignments by profileId:', err)
    return []
  })
}

export const getAssignmentsByProfileIds = async (profileIds: number[]) => {
  if (!profileIds || profileIds.length === 0) return []
  return prisma.workflowAssignment.findMany({
    where: { profileId: { in: profileIds } },
    include: { workflow: true },
  }).catch((err) => {
    console.error('Error fetching assignments by profileIds:', err)
    return []
  })
}


