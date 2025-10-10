# Railway Deployment Instructions

## Backend Deployment

### Railway Service Configuration

1. **Service Name**: algespace-backend
2. **Root Directory**: `/webapi`
3. **Build Command**: `dotnet publish -c Release -o out`
4. **Start Command**: `cd out && dotnet webapi.dll`

### Volume Configuration for SQLite

**IMPORTANT**: SQLite database MUST be stored on Railway Volume to persist data.

1. **Volume Mount Path**: `/data/databases`
2. **Volume Size**: 1GB (minimum)
3. **Database Path in Code**: `/data/databases/studies.db`

### Environment Variables to Set in Railway:

```
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:$PORT
ConnectionStrings__DefaultConnection=Data Source=/data/databases/studies.db;Journal Mode=WAL;Synchronous=Normal;Cache Size=5000;Temp Store=Memory
CORS_ORIGINS=https://your-frontend-domain.vercel.app
```

### Steps:

1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `samyishere1608/Algespace`
5. Railway will auto-detect .NET project
6. Configure the following:
   - Set Root Directory to `webapi`
   - Add a Volume:
     - Click "Variables" tab
     - Scroll to "Volumes" section
     - Click "+ New Volume"
     - Mount Path: `/data/databases`
     - Size: 1GB
7. Add Environment Variables (see above)
8. Deploy!

### After First Deployment:

The database file will be created automatically on the volume at `/data/databases/studies.db`.

### To Access Railway Logs:
```bash
railway logs
```

### To Connect Locally to Railway Project:
```bash
railway link
railway run dotnet run
```

---

## Frontend Deployment (Vercel)

### Vercel Configuration

1. Go to https://vercel.com
2. Import GitHub repository
3. Framework Preset: Vite
4. Root Directory: `reactapp`
5. Build Command: `npm run build`
6. Output Directory: `reactapp/dist`

### Environment Variables for Vercel:

```
VITE_API_URL=https://your-railway-backend.railway.app
```

### After Deployment:

1. Get your Vercel frontend URL
2. Update Railway's `CORS_ORIGINS` environment variable with your Vercel URL
3. Update `reactapp/src/types/shared/axiosInstance.ts` baseURL to point to Railway backend

---

## Database Migration Strategy

Since you have existing SQLite data locally:

### Option 1: Start Fresh (Recommended for Production)
- Let Railway create new database
- Users will create new accounts

### Option 2: Migrate Existing Data
1. Download your local `webapi/Data/databases/studies.db`
2. After Railway deployment, use Railway CLI:
   ```bash
   railway link
   railway volume mount
   # Copy your local .db file to /data/databases/studies.db
   railway volume unmount
   ```

---

## Important Notes:

1. **SQLite + Railway Volume = Persistent Storage**
   - Without volume, data is lost on each deployment
   - Volume ensures database survives restarts

2. **Connection String Must Point to Volume**
   - Change from `Data/databases/studies.db` (relative path)
   - To `/data/databases/studies.db` (absolute path on volume)

3. **WAL Mode is Already Configured** ✅
   - Your connection string already has `Journal Mode=WAL`
   - Perfect for Railway deployment

4. **Port Binding**
   - Railway provides `$PORT` environment variable
   - Must use `http://0.0.0.0:$PORT` (not localhost:7273)

5. **CORS Configuration**
   - Update `Program.cs` CORS to allow your Vercel domain
   - Use environment variable for flexibility

---

## Cost Estimate:

- Railway: $5/month (Hobby plan) - includes 1GB volume
- Vercel: Free tier is sufficient for frontend

---

## Monitoring:

- Railway Dashboard: Real-time logs, metrics, deployments
- Health Check Endpoint: `https://your-app.railway.app/health` (if you create one)

---

## Need Help?

Railway Docs: https://docs.railway.app
Discord: https://discord.gg/railway
