# 🐘 PostgreSQL Setup Guide

## Quick Start

### Step 1: Choose a PostgreSQL Provider

**Recommended: Supabase** (Easiest)
1. Go to https://supabase.com
2. Sign up (free)
3. Create a new project
4. Wait 2-3 minutes for database to provision

### Step 2: Get Your Connection String

#### For Supabase:
1. Go to **Settings** → **Database**
2. Scroll to **Connection string**
3. Select **Connection pooling** mode
4. Copy the connection string (URI format)
5. Replace `[YOUR-PASSWORD]` with your database password

**Format:**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

#### For Neon:
1. Create a new project at https://neon.tech
2. Copy the connection string from dashboard
3. Format: `postgresql://[user]:[password]@[host]/[database]`

### Step 3: Update Environment Variables

Edit `.env.local`:
```bash
# Replace with your PostgreSQL connection string
DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true

# Keep these as-is
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=3HDu5/zSAT/cdPt+fSH4jobUH/023GYt4CFTznLxOcE=
GOOGLE_MAPS_API_KEY=AIzaSyBbzFrVHNM5VQ7yOvVpUVBSRHANqVnDbEI
```

### Step 4: Initialize Database

```bash
# Generate Prisma Client for PostgreSQL
npx prisma generate

# Create tables in PostgreSQL
npx prisma db push
```

### Step 5: Verify

```bash
# Start your app
npm run dev

# Or view database in browser
npx prisma studio
```

## Troubleshooting

### Connection Errors

**Error**: "connection refused"
- **Solution**: Check your connection string format
- **Solution**: Ensure database is running (Supabase shows status)

**Error**: "authentication failed"
- **Solution**: Double-check your password
- **Solution**: For Supabase, use the password from project settings

### Schema Errors

**Error**: "relation already exists"
- **Solution**: Tables already exist - safe to ignore
- **Solution**: Or use `npx prisma migrate reset` to start fresh

## Production Deployment

For production, use:
1. **Connection pooling** (Supabase has this built-in)
2. **SSL connections** (most providers require this)
3. **Environment-specific URLs** (never commit connection strings)

## Helpful Commands

```bash
# View database in browser
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Create a migration
npx prisma migrate dev --name migration_name

# Check connection
npx prisma db execute --stdin
```

## Support

If you run into issues:
1. Check your `DATABASE_URL` format
2. Verify database is accessible
3. Check Prisma logs: `npx prisma --log-level debug`
4. Review error messages carefully

Your app is now ready for PostgreSQL! 🎉
