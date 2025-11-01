import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'API route is working',
    nextauthSecret: process.env.NEXTAUTH_SECRET ? 'Set' : 'Missing',
    nextauthUrl: process.env.NEXTAUTH_URL || 'Missing'
  });
}

