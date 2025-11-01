# Troubleshooting NextAuth Error

## The Error
```
[next-auth][error][CLIENT_FETCH_ERROR] "Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON"
```

This means NextAuth is trying to fetch JSON from `/api/auth/providers` but getting HTML instead (like an error page).

## Step-by-Step Fix

### 1. Verify Environment Variables

**CRITICAL**: Check your `.env.local` file. There should be NO spaces after the `=` sign:

✅ **CORRECT:**
```env
MONGODB_URI=mongodb+srv://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=3HDu5/zSAT/cdPt+fSH4jobUH/023GYt4CFTznLxOcE=
```

❌ **WRONG (will cause errors):**
```env
MONGODB_URI= mongodb+srv://...
NEXTAUTH_URL= http://localhost:3000
NEXTAUTH_SECRET= 3HDu5/zSAT/cdPt+fSH4jobUH/023GYt4CFTznLxOcE=
```

### 2. Test API Route

Open in your browser:
- http://localhost:3000/api/auth/test

This should return JSON showing your environment variables status.

### 3. Test NextAuth Route

Open in your browser:
- http://localhost:3000/api/auth/providers

This should return JSON, NOT HTML. If you see HTML, the route is erroring.

### 4. Check Server Console

Look at your terminal where `npm run dev` is running. You should see:
- Any MongoDB connection errors
- Any NextAuth initialization errors
- Any missing environment variable warnings

### 5. Common Issues

**MongoDB Connection Failing:**
- Check your `MONGODB_URI` is correct
- Make sure MongoDB Atlas allows connections from your IP (check Network Access in Atlas)
- Try the test route: http://localhost:3000/api/auth/test

**NextAuth Initialization Error:**
- Check `NEXTAUTH_SECRET` is set correctly (no spaces!)
- Check `NEXTAUTH_URL` matches your dev server URL

**Route Not Found:**
- Make sure the file exists at: `app/api/auth/[...nextauth]/route.ts`
- Restart the dev server after creating/modifying routes

### 6. Restart Everything

After fixing `.env.local`:
1. **Stop** the dev server (Ctrl+C)
2. **Delete** `.next` folder (optional but recommended)
3. **Restart** the dev server: `npm run dev`
4. **Hard refresh** your browser (Ctrl+Shift+R or Cmd+Shift+R)

### 7. Still Not Working?

1. Check the browser's Network tab:
   - Open DevTools (F12)
   - Go to Network tab
   - Try to load the page
   - Look for `/api/auth/providers` request
   - Check what it returns (should be JSON, not HTML)

2. Check terminal for errors:
   - MongoDB connection issues
   - Import/export errors
   - Missing dependencies

3. Verify file structure:
   ```
   app/
     api/
       auth/
         [...nextauth]/
           route.ts  ← Must exist here
   ```

## Quick Test

Run these in order:

1. `npm run dev` (server should start without errors)
2. Open: http://localhost:3000/api/auth/test
3. Open: http://localhost:3000/api/auth/providers
4. Try: http://localhost:3000/login

If step 2 or 3 returns HTML instead of JSON, there's a configuration issue.

