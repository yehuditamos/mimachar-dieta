import 'server-only';
import { createNeonAuth } from '@neondatabase/auth/next/server';

let instance: ReturnType<typeof createNeonAuth> | undefined;
export function getAuth() {
  if (instance) return instance;
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl || !secret || secret.length < 32) {
    throw new Error('Authentication environment is incomplete');
  }
  instance = createNeonAuth({
    baseUrl,
    cookies: { secret, sameSite: 'lax', sessionDataTtl: 60 },
  });
  return instance;
}

export async function getCurrentUser() {
  const { data, error } = await getAuth().getSession();
  if (error) throw new Error('Session service unavailable');
  const user = data?.user;
  if (!user || !user.emailVerified) return null;
  return { userId: user.id, email: user.email };
}
