# 🔧 Troubleshooting Frontend-Backend Connection

## Issue: Frontend can't load data from backend

### ✅ Solution Steps (in order):

---

## Step 1: Set Environment Variables in Netlify

**CRITICAL:** Netlify needs to know your Railway backend URL!

1. Go to https://app.netlify.com
2. Select your **Algespace** site
3. Go to **Site configuration** → **Environment variables**
4. Click **"Add a variable"**
5. Add these:

```
Variable 1:
Key: VITE_API_URL
Value: https://algespace-production.up.railway.app

Variable 2 (optional):
Key: VITE_API_KEY  
Value: (leave empty if you don't have an API key)
```

6. **Important:** Click **"Save"**

---

## Step 2: Redeploy Netlify Site

After adding environment variables, you MUST redeploy:

1. Go to **Deploys** tab
2. Click **"Trigger deploy"** dropdown
3. Select **"Clear cache and deploy site"**
4. Wait 2-3 minutes for deployment

---

## Step 3: Wait for Railway Backend to Redeploy

Since we updated CORS, Railway needs to redeploy:

1. Go to https://railway.app
2. Select your **Algespace** project
3. Check **Deployments** - it should auto-deploy the CORS fix
4. Wait for status to show **"SUCCESS"**
5. Takes ~3-5 minutes

---

## Step 4: Verify Configuration

### Check Frontend is using correct API URL:

1. Open your Netlify site
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. You should see: `API Base URL: https://algespace-production.up.railway.app`
5. If you see `http://localhost:7273` → Environment variable not set!

### Check Network Requests:

1. In DevTools, go to **Network** tab
2. Refresh the page
3. Look for failed requests
4. Click on a failed request to see details

**Common errors:**

❌ **CORS Error:** Backend CORS not updated (wait for Railway redeploy)
❌ **ERR_NAME_NOT_RESOLVED:** Wrong API URL or typo
❌ **404 Not Found:** Endpoint doesn't exist
❌ **500 Internal Server Error:** Backend issue (check Railway logs)

---

## Step 5: Check Railway Backend Logs

If still having issues:

1. Go to Railway dashboard
2. Select your service
3. Click **Logs** tab
4. Look for CORS-related errors like:
   - `Origin 'https://your-site.netlify.app' not allowed`
   - Connection errors
   - Database errors

---

## Step 6: Test Backend Directly

Verify your backend is working:

```bash
# Test in browser or Postman
https://algespace-production.up.railway.app/api/health

# Should return 200 OK or some response
```

If backend doesn't respond → Issue is with Railway deployment

---

## Common Issues & Solutions

### Issue 1: "API Base URL: http://localhost:7273" in console

**Problem:** Environment variable not set in Netlify

**Solution:**
- Go to Netlify → Environment variables
- Add `VITE_API_URL` with Railway URL
- Redeploy with "Clear cache and deploy site"

---

### Issue 2: CORS Error in Browser Console

**Error message:** 
```
Access to XMLHttpRequest at 'https://algespace-production.up.railway.app/...' 
from origin 'https://your-site.netlify.app' has been blocked by CORS policy
```

**Problem:** Backend doesn't allow your Netlify domain

**Solution:**
- ✅ Already fixed in code (allows all `.netlify.app` domains)
- Wait for Railway to finish redeploying (~3-5 minutes)
- Check Railway logs to confirm new version is live

---

### Issue 3: 404 on API Endpoints

**Problem:** API routes don't match

**Check:**
- Frontend is calling: `baseURL + "/api/goals"` 
- Backend should have: `[Route("api/[controller]")]`
- Verify controller names match in `Controllers/` folder

---

### Issue 4: 500 Internal Server Error

**Problem:** Backend crashes when processing request

**Solution:**
1. Check Railway logs for stack trace
2. Common causes:
   - Database connection issues
   - Missing environment variables in Railway
   - Code errors in backend

---

## Debugging Checklist

Check these in order:

- [ ] Environment variables set in Netlify (`VITE_API_URL`)
- [ ] Netlify redeployed with "Clear cache and deploy"
- [ ] Railway backend redeployed (CORS update)
- [ ] Console shows correct API URL (not localhost)
- [ ] Railway backend is running (check dashboard)
- [ ] Backend responds to direct API calls
- [ ] No CORS errors in browser console
- [ ] Network tab shows requests going to Railway URL

---

## Quick Test

**Test the full flow:**

1. Open Netlify site: `https://your-site.netlify.app`
2. Open DevTools (F12) → Console tab
3. Should see: `API Base URL: https://algespace-production.up.railway.app` ✅
4. Go to Network tab
5. Try to load data (login, view goals, etc.)
6. Check if requests are:
   - Going to Railway URL ✅
   - Returning 200 status ✅
   - Returning actual data ✅

---

## Still Not Working?

**Get detailed error information:**

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try the action that fails
4. Click on the failed request (red status)
5. Check:
   - **Headers** tab → Request URL (should be Railway)
   - **Response** tab → Error message
   - **Console** tab → JavaScript errors

**Take a screenshot showing:**
- Console errors
- Network tab with failed request details
- The error message on the page

This will help identify the exact issue!

---

## Expected Timeline

After pushing changes:

```
Time    | What Happens
--------|--------------------------------------------------
0 min   | Code pushed to GitHub ✅
1 min   | Railway detects changes, starts build
2 min   | Railway deploying backend with CORS fix
3 min   | Netlify detects changes, starts build
4 min   | Railway deployment complete (backend ready)
5 min   | Netlify deployment complete (frontend ready)
6 min   | Both services live, should work! ✅
```

**Give it 5-6 minutes total for both to redeploy.**

---

## Success Indicators

You'll know it's working when:

✅ Netlify console shows Railway URL (not localhost)
✅ No CORS errors in console
✅ Network requests show 200 status codes
✅ Data appears on the page
✅ You can create/view goals
✅ Exercises load properly

---

## Contact Points

**Netlify Status:** https://www.netlifystatus.com/
**Railway Status:** https://status.railway.app/

If both services are up and you still have issues, the problem is in configuration.
