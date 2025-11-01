# Setup Check Guide

## Critical: Environment Variables Format

Your `.env.local` file MUST have NO spaces after the equals sign:

✅ CORRECT:
```
MONGODB_URI=mongodb+srv://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=3HDu5/zSAT/cdPt+fSH4jobUH/023GYt4CFTznLxOcE=
```

❌ WRONG (will cause errors):
```
MONGODB_URI= mongodb+srv://...
NEXTAUTH_URL= http://localhost:3000
NEXTAUTH_SECRET= 3HDu5/zSAT/cdPt+fSH4jobUH/023GYt4CFTznLxOcE=
```

## Steps to Fix NextAuth Error

1. **Check your `.env.local` file** in the root directory
2. **Remove all spaces** after the `=` sign
3. **Restart your development server** completely:
   - Stop the server (Ctrl+C)
   - Run `npm run dev` again

4. **Verify the API route** is accessible:
   - Open: http://localhost:3000/api/auth/providers
   - Should return JSON, not HTML

## Testing NextAuth

After fixing the `.env.local` file:
1. Restart the dev server
2. Try logging in at http://localhost:3000/login
3. The error should be resolved

## Common Issues

- **HTML instead of JSON**: Usually means route not found or env variable issue
- **CLIENT_FETCH_ERROR**: Check NEXTAUTH_URL and NEXTAUTH_SECRET
- **MongoDB connection errors**: Check MONGODB_URI format

