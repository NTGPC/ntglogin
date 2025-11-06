import prisma from '../prismaClient';

export const getAllWorkflows = async () => {
  return prisma.workflow.findMany({
    orderBy: { createdAt: 'desc' },
  });
};

export const getWorkflowById = async (id: number) => {
  return prisma.workflow.findUnique({
    where: { id },
  });
};

export const createWorkflow = async (data: {
  name: string;
  data: any;
}) => {
  return prisma.workflow.create({
    data,
  });
};

export const updateWorkflow = async (
  id: number,
  data: {
    name?: string;
    data?: any;
  }
) => {
  return prisma.workflow.update({
    where: { id },
    data,
  });
};

export const deleteWorkflow = async (id: number) => {
  return prisma.workflow.delete({
    where: { id },
  });
};

