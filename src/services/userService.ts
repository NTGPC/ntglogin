import prisma from '../prismaClient';
import { hashPassword, comparePassword } from '../utils/auth';

export const createUser = async (username: string, password: string, fullName: string, role: string = 'USER') => {
  const hashedPassword = await hashPassword(password);
  return prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      fullName,
      role,
    },
  });
};

export const getUserByUsername = async (username: string) => {
  return prisma.user.findUnique({
    where: { username },
  });
};

export const getAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
      // Don't return password
    },
  });
};

export const verifyUserCredentials = async (username: string, password: string) => {
  const user = await getUserByUsername(username);
  if (!user) {
    return null;
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    return null;
  }

  return user;
};

