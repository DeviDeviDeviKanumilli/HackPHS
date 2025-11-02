import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';
import { logInfo } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate username (alphanumeric and underscore, 3-20 chars)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    console.log('Checking for existing user...');

    // Check if user already exists - optimized with parallel unique queries (better index usage)
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.trim();
    
    const [existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      }),
      prisma.user.findUnique({
        where: { username: normalizedUsername },
        select: { id: true },
      }),
    ]);

    if (existingEmail) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }
    
    if (existingUsername) {
      return NextResponse.json(
        { error: 'This username is already taken' },
        { status: 400 }
      );
    }

    console.log('No existing user found, hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('Password hashed, creating user...');

    // Create user (PostgreSQL is much faster)
    const user = await prisma.user.create({
      data: {
        username: normalizedUsername,
        email: normalizedEmail,
        passwordHash,
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    console.log('User created successfully:', user.id);
    logInfo('User registered', { userId: user.id, username: user.username });

    // Send welcome email (don't await to avoid blocking response)
    sendWelcomeEmail(user.email, user.username).catch((error) => {
      console.error('Failed to send welcome email:', error);
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Log detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('❌ Registration error:', {
      message: errorMessage,
      stack: errorStack,
      name: error instanceof Error ? error.name : undefined,
    });

    // Provide more helpful error messages
    if (errorMessage.includes('timeout')) {
      return NextResponse.json(
        { error: 'Database connection timed out. Please try again in a moment.' },
        { status: 503 }
      );
    }

    if (errorMessage.includes('duplicate') || errorMessage.includes('E11000') || errorMessage.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 400 }
      );
    }

    if (errorMessage.includes('DATABASE_URL') || errorMessage.includes('connection')) {
      return NextResponse.json(
        { error: 'Database configuration error. Please check your DATABASE_URL environment variable.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        // Include error details in development
        ...(process.env.NODE_ENV === 'development' && { details: errorMessage })
      },
      { status: 500 }
    );
  }
}

