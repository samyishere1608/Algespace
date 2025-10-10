# 🌐 Netlify Deployment Guide - Algespace Frontend

## Overview
This guide will help you deploy the Algespace React + TypeScript + Vite frontend to Netlify and connect it to your Railway backend.

---

## 📋 Prerequisites

- ✅ GitHub repository: `https://github.com/samyishere1608/Algespace.git`
- ✅ Backend deployed on Railway: `https://algespace-production.up.railway.app`
- Netlify account (free tier works): https://netlify.com/
- Your frontend is in the `reactapp/` folder

---

## 🔧 Step 1: Prepare Frontend for Netlify

### 1.1 Files Already Created ✅

- `netlify.toml` - Netlify configuration (in project root)
- `.env.development` - Local development settings
- `.env.production.example` - Production environment template
- Updated `axiosInstance.ts` - Now uses environment variables

### 1.2 Verify Build Settings

Check your `reactapp/package.json` has the build script:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

✅ This should already be configured.

---

## 🚀 Step 2: Deploy to Netlify

### 2.1 Sign Up / Login to Netlify

1. Go to https://netlify.com/
2. Click **"Sign up"** or **"Log in"**
3. Choose **"Sign up with GitHub"** (easiest option)
4. Authorize Netlify to access your GitHub repositories

### 2.2 Create New Site

1. Click **"Add new site"** → **"Import an existing project"**
2. Choose **"Deploy with GitHub"**
3. Select your repository: `samyishere1608/Algespace`
4. Click **"Authorize Netlify"** if prompted

### 2.3 Configure Build Settings

Netlify will auto-detect settings, but verify:

**Site Settings:**
- **Base directory**: `reactapp`
- **Build command**: `npm run build`
- **Publish directory**: `reactapp/dist`

Click **"Show advanced"** to set environment variables (next step).

---

## ⚙️ Step 3: Configure Environment Variables

**CRITICAL:** Set these before deploying!

### 3.1 Add Environment Variables

In the deployment configuration screen, click **"Add environment variables"**:

```bash
# Backend API URL (your Railway deployment)
VITE_API_URL=https://algespace-production.up.railway.app

# API Key (if you're using authentication)
VITE_API_KEY=your-production-api-key-here
```

### 3.2 Important Notes

- Variable names **MUST** start with `VITE_` for Vite to expose them
- Use your actual Railway backend URL
- Don't include trailing slashes in URLs
- API key should match what you set in Railway backend

### 3.3 Click "Deploy site"

Netlify will:
1. Clone your repository
2. Run `npm install` in the `reactapp` folder
3. Run `npm run build`
4. Deploy the `dist` folder
5. Give you a URL like: `https://random-name-123.netlify.app`

---

## 🌐 Step 4: Update Backend CORS

Your Railway backend needs to allow requests from Netlify.

### 4.1 Get Your Netlify URL

After deployment, Netlify gives you a URL like:
- `https://algespace-123abc.netlify.app` (random subdomain)

### 4.2 Update Backend CORS (Already Done! ✅)

Your `Program.cs` already has this configuration:

```csharp
options.AddPolicy("ProductionPolicy", builder =>
{
    builder.WithMethods("GET", "PUT", "POST", "DELETE", "PATCH")
        .WithHeaders(HeaderNames.Accept, HeaderNames.ContentType, HeaderNames.Authorization, "X-API-Key")
        .AllowCredentials()
        .SetIsOriginAllowed(origin =>
        {
            if (string.IsNullOrWhiteSpace(origin)) return false;
            
            // Allow Railway backend
            if (origin.ToLower().StartsWith("https://algespace-production.up.railway.app")) return true;
            
            // Allow any Netlify subdomain
            if (origin.ToLower().Contains(".netlify.app")) return true;
            
            return false;
        });
});
```

✅ **This allows ALL Netlify deployments** - no need to update!

---

## 🔍 Step 5: Test Your Deployment

### 5.1 Visit Your Netlify Site

1. Go to your Netlify URL: `https://your-site.netlify.app`
2. The site should load successfully
3. Check browser console for any errors (F12)

### 5.2 Test API Connection

Try actions that connect to the backend:
- Login/authentication
- Create a goal
- View goal history
- Take pretest
- Complete an exercise

### 5.3 Check Network Requests

In browser DevTools (F12) → Network tab:
- API calls should go to: `https://algespace-production.up.railway.app`
- Status codes should be 200 (success) not CORS errors
- Check response data is correct

---

## 🎨 Step 6: Customize Your Site

### 6.1 Change Site Name (Optional)

1. Netlify dashboard → **Site settings**
2. **Change site name** → Enter custom name
3. Your URL becomes: `https://your-custom-name.netlify.app`

### 6.2 Add Custom Domain (Optional)

If you own a domain:
1. Netlify dashboard → **Domain settings**
2. **Add custom domain**
3. Follow DNS configuration instructions
4. Netlify provides free SSL certificate

---

## 🔄 Step 7: Continuous Deployment

**Netlify automatically redeploys when you push to GitHub!**

### 7.1 How It Works

```bash
# Make changes to frontend
cd reactapp
# ... edit files ...

# Commit and push
git add .
git commit -m "Update frontend feature"
git push origin main

# Netlify automatically:
# 1. Detects the push
# 2. Runs build
# 3. Deploys new version
# Takes ~2-3 minutes
```

### 7.2 Monitor Deployments

- Netlify dashboard → **Deploys** tab
- See build logs
- View deploy history
- Rollback to previous versions if needed

---

## 🔐 Step 8: Environment Variables Management

### 8.1 Update Variables After Deployment

If you need to change API URL or keys:

1. Netlify dashboard → **Site settings**
2. **Environment variables**
3. Edit values
4. Click **"Save"**
5. **Trigger redeploy** (Deploys → Trigger deploy → Deploy site)

### 8.2 Different Environments (Optional)

Create separate sites for staging/production:
- `algespace-staging.netlify.app` (test features)
- `algespace-production.netlify.app` (live site)

Each can have different environment variables.

---

## 🐛 Step 9: Troubleshooting

### Issue 1: White Screen / Page Not Loading

**Problem:** Site shows blank page

**Solutions:**
1. Check Netlify build logs for errors
2. Verify `base` directory is `reactapp` in netlify.toml
3. Ensure build completed successfully
4. Check browser console (F12) for JavaScript errors

### Issue 2: API Calls Failing / CORS Errors

**Problem:** Network errors when calling backend

**Solutions:**
```javascript
// Check environment variable is set
console.log('API URL:', import.meta.env.VITE_API_URL);
// Should print: https://algespace-production.up.railway.app
```

1. Verify `VITE_API_URL` is set in Netlify
2. Check Railway backend is running
3. Verify CORS allows `.netlify.app` domains
4. Check Railway logs for CORS errors

### Issue 3: Environment Variables Not Working

**Problem:** `import.meta.env.VITE_API_URL` is undefined

**Solutions:**
1. Ensure variable name starts with `VITE_`
2. Redeploy after adding variables
3. Clear browser cache
4. Check Netlify build logs - variables should be printed (not secret values)

### Issue 4: 404 on Page Refresh

**Problem:** Direct URL navigation returns 404

**Solution:**
✅ Already fixed with `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This enables SPA routing.

### Issue 5: Build Fails - TypeScript Errors

**Problem:** Build fails with TS errors

**Solutions:**
1. Fix TypeScript errors locally first
2. Run `npm run build` locally to test
3. Ensure all dependencies in `package.json`
4. Check Node version compatibility

---

## 📊 Step 10: Monitoring & Analytics

### 10.1 Netlify Analytics (Optional)

Enable in Netlify dashboard:
- **Analytics** → Enable Analytics
- Track page views, bandwidth, top pages
- Costs $9/month (optional)

### 10.2 Free Monitoring

Built-in metrics:
- **Bandwidth usage**
- **Build minutes**
- **Deploy frequency**
- **Error logs**

### 10.3 Set Up Notifications

Configure alerts for:
- Failed deployments
- Build errors
- High bandwidth usage

---

## 💰 Step 11: Cost Estimation (Free Tier)

Netlify Free Tier includes:
- ✅ 100GB bandwidth/month
- ✅ 300 build minutes/month
- ✅ Unlimited sites
- ✅ SSL certificate
- ✅ Continuous deployment
- ✅ Instant cache invalidation

**Your Algespace frontend should fit within free tier** for:
- 50-60 concurrent users
- Typical classroom usage
- Regular deployments

Upgrade needed if:
- Bandwidth exceeds 100GB/month
- Need team collaboration features
- Want custom domain without "netlify.app"
- Require more build minutes

---

## 🎯 Deployment Checklist

Before deploying:

- [ ] Backend deployed on Railway ✅
- [ ] Railway URL added to backend CORS ✅
- [ ] `netlify.toml` in project root ✅
- [ ] `axiosInstance.ts` uses environment variables ✅
- [ ] Environment variables prepared (VITE_API_URL, VITE_API_KEY)
- [ ] Netlify account created
- [ ] GitHub repository connected to Netlify
- [ ] Build settings verified (base: reactapp, publish: dist)
- [ ] Environment variables set in Netlify
- [ ] Test build locally: `cd reactapp && npm run build`

---

## 🔗 Step 12: Update Backend with Frontend URL

After your Netlify site is live, update Railway backend:

### 12.1 Add Netlify URL to Backend CORS

✅ **Already done!** Your backend accepts all `.netlify.app` domains.

But for production, you might want to be specific:

```csharp
// In Program.cs ProductionPolicy
if (origin.ToLower().StartsWith("https://algespace.netlify.app")) return true;
```

### 12.2 Set FRONTEND_URL in Railway

1. Railway dashboard → Your service
2. **Variables** tab
3. Add: `FRONTEND_URL=https://your-site.netlify.app`
4. Use in email notifications, redirects, etc.

---

## 🚀 Quick Start Commands

### Local Development
```bash
cd reactapp
npm install
npm run dev
# Runs on http://localhost:5173
# Uses VITE_API_URL=http://localhost:7273
```

### Test Production Build Locally
```bash
cd reactapp
npm run build
npm run preview
# Simulates production build
```

### Deploy to Netlify
```bash
# Automatic on git push
git add .
git commit -m "Deploy frontend updates"
git push origin main
# Netlify deploys automatically in 2-3 minutes
```

---

## 📞 Netlify Resources

- **Documentation**: https://docs.netlify.com/
- **Support**: https://answers.netlify.com/
- **CLI**: https://docs.netlify.com/cli/get-started/
- **Status**: https://www.netlifystatus.com/

---

## ✅ Success Indicators

Your deployment is successful when:
- ✅ Netlify shows "Published" status
- ✅ Site loads at your Netlify URL
- ✅ No console errors in browser DevTools
- ✅ API calls reach Railway backend (check Network tab)
- ✅ All features work (login, goals, exercises)
- ✅ Data persists in Railway database
- ✅ Page refresh works (SPA routing)
- ✅ Load testing shows good performance

---

## 🎉 Complete Setup

Once both are deployed:

**Frontend (Netlify):**
- URL: `https://your-site.netlify.app`
- Auto-deploys on git push
- Environment variables configured
- Connected to Railway backend

**Backend (Railway):**
- URL: `https://algespace-production.up.railway.app`
- SQLite database on volume storage
- CORS allows Netlify domains
- Auto-deploys on git push

**Testing:**
1. Visit your Netlify site
2. Create a test account
3. Take the pretest
4. Create goals
5. Complete exercises
6. Verify data persists

---

## 🎓 Next Steps

1. ✅ Test all features end-to-end
2. 🎨 Customize site name in Netlify
3. 📧 Set up email notifications (if needed)
4. 📊 Monitor usage in both dashboards
5. 🔒 Review security settings
6. 📱 Test on mobile devices
7. 🚀 Share with users!

---

## 🔄 Maintenance

**Weekly:**
- Check Netlify deploy logs
- Monitor Railway database size
- Review error logs

**Monthly:**
- Backup Railway database
- Check bandwidth usage
- Review user feedback
- Update dependencies if needed

**As Needed:**
- Deploy feature updates
- Fix bugs
- Optimize performance
- Scale resources if needed

---

## 🎊 You're Live!

Follow these steps to deploy your frontend to Netlify. The setup takes about 10-15 minutes, and then you have a fully deployed, production-ready application!

**Key Points:**
1. ✅ Base directory = `reactapp`
2. ✅ Environment variables = `VITE_API_URL` and `VITE_API_KEY`
3. ✅ CORS already configured to accept Netlify
4. ✅ Auto-deploy on git push
5. ✅ Free tier sufficient for your needs

Good luck with your deployment! 🚀
