import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);
    return session?.user;
  } catch (error) {
    return null;
  }
}

export class AuthError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'AuthError';
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError('Unauthorized');
  }
  return user;
}

