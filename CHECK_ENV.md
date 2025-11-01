# Quick Environment Variable Check

## Critical Fix Required

Your `.env.local` file **MUST NOT** have spaces after the `=` sign.

### ❌ WRONG (causes JSON parsing errors):
```env
MONGODB_URI= mongodb+srv://...
NEXTAUTH_URL= http://localhost:3000
NEXTAUTH_SECRET= 3HDu5/zSAT/cdPt+fSH4jobUH/023GYt4CFTznLxOcE=
```

### ✅ CORRECT:
```env
MONGODB_URI=mongodb+srv://kanumilliashrith020_db_user:Xl1ElUrM56Y2neLu@cluster0.pkrxw55.mongodb.net/?appName=Cluster0
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=3HDu5/zSAT/cdPt+fSH4jobUH/023GYt4CFTznLxOcE=
GOOGLE_MAPS_API_KEY=AIzaSyBbzFrVHNM5VQ7yOvVpUVBSRHANqVnDbEI
```

## Steps to Fix:

1. **Open `.env.local`** in your project root
2. **Remove ALL spaces** after every `=` sign
3. **Save the file**
4. **Delete `.next` folder** (optional but helps):
   ```powershell
   Remove-Item -Recurse -Force .next
   ```
5. **Restart dev server**:
   ```powershell
   npm run dev
   ```

## Verify It's Fixed:

1. Open: http://localhost:3000/api/auth/test
   - Should show JSON with your env vars status

2. Open: http://localhost:3000/api/auth/providers  
   - Should return JSON (not HTML)

3. Check browser console - the error should be gone

## Common Causes:

1. **Spaces in .env.local** ← Most common!
2. **MongoDB connection failing** - Check your MongoDB Atlas network access settings
3. **Missing NEXTAUTH_SECRET** - Must be set for NextAuth to work

