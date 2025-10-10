# 🔧 URGENT FIX: Netlify Environment Variable

## Issue: 400 Bad Request - Double /api in URL

Your Netlify environment variable has `/api` at the end, which causes the URL to be:
```
https://algespace-production.up.railway.app/api/api/flexibility-training/...
                                            ^^^^^ WRONG - /api appears twice!
```

---

## ✅ Fix: Update Netlify Environment Variable

### Step 1: Go to Netlify Dashboard

1. Open https://app.netlify.com
2. Select your **Algespace** site
3. Go to **Site configuration** → **Environment variables**

### Step 2: Edit VITE_API_URL

Find the variable `VITE_API_URL` and change it:

**WRONG (Current):**
```
VITE_API_URL=https://algespace-production.up.railway.app/api
                                                        ^^^^ REMOVE THIS
```

**CORRECT (Change to):**
```
VITE_API_URL=https://algespace-production.up.railway.app
```

**Remove the `/api` from the end!**

### Step 3: Redeploy

1. **Important:** After changing the variable, you MUST redeploy
2. Go to **Deploys** tab
3. Click **"Trigger deploy"**
4. Select **"Clear cache and deploy site"**
5. Wait 2-3 minutes

---

## Why This Happens

Your backend controllers already have the `/api` prefix in their routes:

```csharp
[ApiController]
[Route("api/[controller]")]
public class FlexibilityTrainingController : ControllerBase
{
    // Routes automatically become: /api/flexibility-training/...
}
```

So you only need the base URL in the environment variable:
- ✅ `https://algespace-production.up.railway.app`
- ❌ `https://algespace-production.up.railway.app/api`

---

## Expected Result

After the fix, URLs will be correct:
```
Before: https://algespace-production.up.railway.app/api/api/flexibility-training/...
After:  https://algespace-production.up.railway.app/api/flexibility-training/...
        ✅ Single /api is correct!
```

---

## Quick Verification

After redeploying, check the browser console (F12):

```javascript
API Base URL: https://algespace-production.up.railway.app  // ✅ No /api at end!
```

And network requests should show:
```
https://algespace-production.up.railway.app/api/flexibility-training/getFlexibilityExercises
                                           ^^^^ Single /api is correct
```

---

## Timeline

1. Change environment variable in Netlify (1 minute)
2. Trigger redeploy (1 minute)
3. Wait for deployment (2-3 minutes)
4. Test - should work! ✅

**Total: ~5 minutes**

---

That's it! This is a simple fix - just remove `/api` from the Netlify environment variable! 🚀
