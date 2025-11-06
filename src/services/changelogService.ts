import prisma from '../prismaClient';

export interface ChangelogData {
  version: string;
  title: string;
  type: 'Added' | 'Changed' | 'Fixed' | 'Removed' | 'Security';
  category?: string;
  description?: string;
  files?: string[];
  author?: string;
}

export const createChangelog = async (data: ChangelogData) => {
  return prisma.changelog.create({
    data: {
      version: data.version,
      title: data.title,
      type: data.type,
      category: data.category || null,
      description: data.description || null,
      files: data.files ? data.files : null,
      author: data.author || null,
    },
  });
};

export const getAllChangelogs = async (limit?: number) => {
  return prisma.changelog.findMany({
    orderBy: { created_at: 'desc' },
    take: limit,
  });
};

export const getChangelogsByVersion = async (version: string) => {
  return prisma.changelog.findMany({
    where: { version },
    orderBy: { created_at: 'desc' },
  });
};

export const getChangelogsByType = async (type: string) => {
  return prisma.changelog.findMany({
    where: { type },
    orderBy: { created_at: 'desc' },
  });
};

export const getChangelogsByCategory = async (category: string) => {
  return prisma.changelog.findMany({
    where: { category },
    orderBy: { created_at: 'desc' },
  });
};

export const updateChangelog = async (id: number, data: Partial<ChangelogData>) => {
  return prisma.changelog.update({
    where: { id },
    data: {
      version: data.version,
      title: data.title,
      type: data.type,
      category: data.category,
      description: data.description,
      files: data.files ? data.files : undefined,
      author: data.author,
    },
  });
};

export const deleteChangelog = async (id: number) => {
  return prisma.changelog.delete({
    where: { id },
  });
};

