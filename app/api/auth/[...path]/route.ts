import { getAuth } from '@/lib/auth/server';
import type { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return getAuth().handler().GET(request, context);
}
export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return getAuth().handler().POST(request, context);
}
