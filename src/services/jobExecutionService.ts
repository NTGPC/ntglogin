import prisma from '../prismaClient';

export interface CreateJobExecutionData {
  job_id: number;
  profile_id: number;
  session_id?: number;
  status?: string;
}

export interface UpdateJobExecutionData {
  status?: string;
  started_at?: Date;
  completed_at?: Date;
  result?: any;
  error?: string;
}

export const getAllJobExecutions = async (jobId?: number) => {
  if (jobId) {
    return prisma.jobExecution.findMany({
      where: { job_id: jobId },
      include: {
        job: true,
        profile: true,
        session: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }
  
  return prisma.jobExecution.findMany({
    include: {
      job: true,
      profile: true,
      session: true,
    },
    orderBy: { created_at: 'desc' },
  });
};

export const getJobExecutionById = async (id: number) => {
  return prisma.jobExecution.findUnique({
    where: { id },
    include: {
      job: true,
      profile: true,
      session: true,
    },
  });
};

export const createJobExecution = async (data: CreateJobExecutionData) => {
  return prisma.jobExecution.create({
    data,
  });
};

export const createJobExecutionsForProfiles = async (jobId: number, profileIds: number[]) => {
  const executions = [];
  
  for (const profileId of profileIds) {
    const execution = await prisma.jobExecution.create({
      data: {
        job_id: jobId,
        profile_id: profileId,
        status: 'pending',
      },
    });
    executions.push(execution);
  }
  
  return executions;
};

export const updateJobExecution = async (id: number, data: UpdateJobExecutionData) => {
  return prisma.jobExecution.update({
    where: { id },
    data,
  });
};

export const deleteJobExecution = async (id: number) => {
  return prisma.jobExecution.delete({
    where: { id },
  });
};

export const getJobExecutionsByStatus = async (status: string) => {
  return prisma.jobExecution.findMany({
    where: { status },
    include: {
      job: true,
      profile: true,
      session: true,
    },
    orderBy: { created_at: 'desc' },
  });
};
