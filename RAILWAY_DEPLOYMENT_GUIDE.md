# 🚂 Railway Deployment Guide - Algespace Backend with SQLite

## Overview
This guide will help you deploy the Algespace .NET 8.0 Web API backend to Railway with persistent SQLite database storage using Railway Volumes.

---

## 📋 Prerequisites

- ✅ GitHub repository pushed: `https://github.com/samyishere1608/Algespace.git`
- Railway account (free tier works): https://railway.app/
- Your backend is in the `webapi/` folder
- SQLite databases are in `webapi/Data/databases/`

---

## 🔧 Step 1: Railway Project Setup

### 1.1 Create New Project on Railway

1. Go to https://railway.app/ and sign in with GitHub
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `samyishere1608/Algespace`
5. Railway will detect it's a .NET project automatically

### 1.2 Configure Root Directory

Since your backend is in a subdirectory, you need to tell Railway:

1. In your Railway project, click on your service
2. Go to **Settings** tab
3. Find **"Root Directory"** setting
4. Set it to: `webapi`
5. Click **"Save"**

---

## 💾 Step 2: Create Volume for SQLite Database

**CRITICAL:** This ensures your database persists across deployments and restarts.

### 2.1 Add Volume to Your Service

1. In Railway dashboard, click your service (webapi)
2. Go to **"Volumes"** tab (or click "Add Volume" button)
3. Click **"+ New Volume"**
4. Configure the volume:
   - **Mount Path**: `/app/Data/databases`
   - **Volume Name**: `algespace-sqlite-db` (or any name you prefer)
5. Click **"Add Volume"**

**What this does:** 
- Maps Railway's persistent volume to `/app/Data/databases`
- Your SQLite database files will be stored here permanently
- Data survives deployments, restarts, and updates

---

## ⚙️ Step 3: Configure Environment Variables

### 3.1 Set Required Variables

In Railway dashboard → Your service → **Variables** tab, add:

```bash
# ASP.NET Configuration
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:8080

# Database Connection (uses volume mount path)
ConnectionStrings__DefaultConnection=Data Source=/app/Data/databases/studies.db;Journal Mode=WAL;Synchronous=Normal;Cache Size=5000;Temp Store=Memory

# CORS - Add your frontend URL when deployed
FRONTEND_URL=https://your-frontend-domain.vercel.app

# Optional: API Keys (if using authentication)
AuthSettings__ApiKey=your-secret-api-key-here
AuthSettings__JwtSecret=your-jwt-secret-key-minimum-32-chars
```

### 3.2 Important Notes on Connection String

The path `/app/Data/databases/studies.db` is important:
- `/app/` is where Railway puts your application
- `/app/Data/databases` is your **volume mount point**
- This ensures SQLite writes to the persistent volume, not temporary storage

---

## 🌐 Step 4: Update CORS for Production

After deployment, Railway will give you a URL like: `https://algespace-production.up.railway.app`

### 4.1 Add Railway URL to CORS

In your `Program.cs`, the ProductionPolicy CORS should include:

```csharp
options.AddPolicy("ProductionPolicy", builder =>
{
    builder.WithMethods("GET", "PUT", "POST", "DELETE", "PATCH")
        .WithHeaders(HeaderNames.Accept, HeaderNames.ContentType, HeaderNames.Authorization, "X-API-Key")
        .AllowCredentials()
        .SetIsOriginAllowed(origin =>
        {
            if (string.IsNullOrWhiteSpace(origin)) return false;
            
            // Allow your Railway backend (for health checks)
            if (origin.ToLower().StartsWith("https://algespace-production.up.railway.app")) return true;
            
            // Allow your frontend domain
            if (origin.ToLower().StartsWith("https://your-frontend.vercel.app")) return true;
            
            return false;
        });
});
```

**After updating, commit and push to GitHub - Railway auto-deploys.**

---

## 🚀 Step 5: Deploy

Railway automatically deploys when you:
1. Push changes to your `main` branch on GitHub
2. Or click **"Deploy"** in Railway dashboard

### 5.1 Monitor Deployment

1. Go to **Deployments** tab in Railway
2. Watch the build logs
3. Wait for status: **"SUCCESS"**
4. Your service will be available at the provided URL

### 5.2 Check Deployment Logs

Click on your service → **Logs** tab to see:
- Application startup
- Database connection status
- Any errors

---

## 🔍 Step 6: Verify Deployment

### 6.1 Test Health Endpoint

Once deployed, test your API:

```bash
# Check if API is responding
curl https://your-railway-app.up.railway.app/api/health

# Test a simple endpoint (adjust based on your controllers)
curl https://your-railway-app.up.railway.app/api/goals/test
```

### 6.2 Verify Database

1. Check Railway logs for SQLite connection messages
2. Test creating a goal through your API
3. Redeploy and verify data persists (proves volume is working)

---

## 📊 Step 7: Database Volume Management

### 7.1 Check Volume Usage

1. Railway dashboard → Your service → **Volumes** tab
2. See volume size and usage
3. Free tier includes 1GB volume storage

### 7.2 Backup Database (Important!)

**Option 1: Download from Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Download database file
railway run bash -c "cat /app/Data/databases/studies.db" > studies_backup.db
```

**Option 2: Add Backup Endpoint (Recommended)**

Create a controller endpoint to download database:

```csharp
[HttpGet("backup")]
[Authorize] // Add authentication!
public IActionResult BackupDatabase()
{
    var dbPath = "/app/Data/databases/studies.db";
    if (!System.IO.File.Exists(dbPath))
        return NotFound("Database not found");
    
    var fileBytes = System.IO.File.ReadAllBytes(dbPath);
    return File(fileBytes, "application/x-sqlite3", "studies_backup.db");
}
```

### 7.3 Restore Database (if needed)

If you need to restore from backup:

1. Upload backup file to GitHub repository temporarily
2. Add migration code in `Program.cs` startup to copy it to volume
3. Deploy
4. Remove migration code after restore

---

## 🔒 Step 8: Security Best Practices

### 8.1 Environment Variables

✅ **DO:**
- Store all secrets in Railway Environment Variables
- Use different API keys for dev/prod
- Rotate keys regularly

❌ **DON'T:**
- Hardcode secrets in code
- Commit `.env` files with real keys
- Use same keys as development

### 8.2 Database Security

- Enable authentication on sensitive endpoints
- Implement rate limiting (already configured in Program.cs)
- Regular backups of SQLite database
- Monitor volume storage usage

---

## 📈 Step 9: Monitoring & Maintenance

### 9.1 Railway Dashboard

Monitor:
- **Deployments**: Track successful/failed deploys
- **Metrics**: CPU, Memory, Network usage
- **Logs**: Application logs, errors
- **Volume**: Storage usage

### 9.2 Set Up Alerts (Optional)

Railway can notify you:
- Deployment failures
- High resource usage
- Volume storage running low

---

## 🐛 Troubleshooting Common Issues

### Issue 1: Database Not Persisting

**Problem:** Data disappears after redeployment

**Solution:**
- Verify volume is mounted at `/app/Data/databases`
- Check connection string uses volume path
- Ensure WAL mode is enabled in connection string

### Issue 2: CORS Errors

**Problem:** Frontend can't connect to backend

**Solution:**
```csharp
// Update CORS in Program.cs
if (app.Environment.IsProduction())
{
    app.UseCors("ProductionPolicy");
}
```

Add your frontend URL to `ProductionPolicy` origins.

### Issue 3: Database Locked Errors

**Problem:** `SQLite Error: database is locked`

**Solution:**
- Already handled with retry logic in your services
- WAL mode reduces lock contention
- Check concurrent request limits

### Issue 4: Port Binding Error

**Problem:** Application won't start

**Solution:**
- Ensure `ASPNETCORE_URLS=http://0.0.0.0:8080` in environment variables
- Railway expects port 8080 by default
- Check Dockerfile exposes correct port (8080)

---

## 💰 Step 10: Cost Estimation (Free Tier)

Railway Free Tier includes:
- ✅ $5 worth of usage per month
- ✅ 500 hours of runtime (sufficient for 24/7 operation)
- ✅ 1GB volume storage
- ✅ Unlimited deployments

**Your Algespace backend should fit within free tier** for:
- 50-60 concurrent users
- Moderate database operations
- Standard API requests

Upgrade if you need:
- More volume storage (>1GB)
- More runtime hours
- Custom domains
- Multiple environments

---

## 🎯 Deployment Checklist

Before deploying, ensure:

- [ ] GitHub repository pushed with all code
- [ ] `Dockerfile` created in webapi folder
- [ ] `railway.json` created in webapi folder
- [ ] Railway project created and linked to GitHub repo
- [ ] Root directory set to `webapi` in Railway settings
- [ ] Volume created and mounted at `/app/Data/databases`
- [ ] Environment variables configured (especially ConnectionStrings)
- [ ] CORS updated with Railway URL
- [ ] API tested locally with production settings
- [ ] Database backup strategy planned

---

## 📞 Railway Resources

- **Documentation**: https://docs.railway.app/
- **Discord Support**: https://discord.gg/railway
- **CLI**: https://docs.railway.app/develop/cli
- **Status Page**: https://status.railway.app/

---

## 🔄 Continuous Deployment

Once set up, Railway automatically:
1. Detects pushes to your GitHub `main` branch
2. Builds your .NET application
3. Runs your Dockerfile
4. Deploys to production
5. Keeps volume data intact

**To deploy updates:**
```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main

# Railway deploys automatically in ~2-3 minutes
```

---

## 🎓 Next Steps After Deployment

1. **Frontend Deployment**: Deploy React app to Vercel/Netlify
2. **Update Frontend API URL**: Point to Railway backend URL
3. **Test End-to-End**: Verify frontend ↔ backend communication
4. **Monitor Logs**: Watch Railway logs for any issues
5. **Set Up Domain** (Optional): Add custom domain in Railway
6. **Enable HTTPS**: Railway provides automatic SSL

---

## ✅ Success Indicators

Your deployment is successful when:
- ✅ Railway shows "SUCCESS" status
- ✅ API responds to health check requests
- ✅ Database operations work (create/read/update/delete)
- ✅ Data persists after redeployment
- ✅ Frontend can connect and authenticate
- ✅ Load testing shows good performance (50-60 users)

---

## 🎉 You're Ready!

Follow these steps when you're ready to deploy. The key points:
1. **Volume mount** = `/app/Data/databases` (persistent SQLite storage)
2. **Connection string** = Use volume path in environment variables
3. **CORS** = Update with your Railway URL
4. **Auto-deploy** = Push to GitHub triggers deployment

Good luck with your deployment! 🚀
