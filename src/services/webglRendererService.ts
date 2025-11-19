import prisma from '../prismaClient';

export const getAllWebglRenderers = async () => {
  return prisma.webglRenderer.findMany({
    orderBy: [
      { os: 'asc' },
      { vendor: 'asc' },
      { renderer: 'asc' },
    ],
  });
};

export const getWebglRendererById = async (id: number) => {
  return prisma.webglRenderer.findUnique({
    where: { id },
  });
};

export const createWebglRenderer = async (data: {
  vendor: string;
  renderer: string;
  os?: string;
}) => {
  // Loại bỏ 'id' nếu có
  const { id: _id, ...cleanData } = data as any;
  
  return prisma.webglRenderer.create({
    data: cleanData,
  });
};

export const updateWebglRenderer = async (id: number, data: {
  vendor?: string;
  renderer?: string;
  os?: string;
}) => {
  // Loại bỏ 'id' nếu có
  const { id: _id, ...cleanData } = data as any;
  
  return prisma.webglRenderer.update({
    where: { id },
    data: cleanData,
  });
};

export const deleteWebglRenderer = async (id: number) => {
  // Kiểm tra xem có profile nào đang sử dụng WebglRenderer này không
  const profilesUsing = await prisma.profile.count({
    where: { webglRendererId: id },
  });
  
  if (profilesUsing > 0) {
    throw new Error(`Cannot delete WebglRenderer: ${profilesUsing} profile(s) are using it`);
  }
  
  return prisma.webglRenderer.delete({
    where: { id },
  });
};

export const getWebglRenderersByOS = async (os: string) => {
  return prisma.webglRenderer.findMany({
    where: { os },
    orderBy: [
      { vendor: 'asc' },
      { renderer: 'asc' },
    ],
  });
};

export const getWebglRenderersByVendor = async (vendor: string) => {
  return prisma.webglRenderer.findMany({
    where: { vendor },
    orderBy: [
      { os: 'asc' },
      { renderer: 'asc' },
    ],
  });
};

