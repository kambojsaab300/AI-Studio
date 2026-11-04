# AI Studio: Deployment & Operations Guide

## 1. Hosting Architecture
- **Web API & Frontend Hosting**: MonsterASP IIS Windows Server (`https://aistudio.runasp.net`).
- **Database**: Microsoft SQL Server on MonsterASP (`db77541.public.databaseasp.net`).
- **CDN**: Cloudinary (`draaqjcre`).

---

## 2. Building Frontend Bundles

The frontend apps are compiled into optimized standalone ES modules using `esbuild`:

```bash
# Compile Admin bundle
npx esbuild preview/admin-main.jsx --bundle --format=esm --outfile=preview/admin.bundle.js --minify

# Compile App Workspace bundle (WearGen / PPP)
npx esbuild preview/app-main.jsx --bundle --format=esm --outfile=preview/app.bundle.js --minify

# Compile Customer bundle
npx esbuild preview/customer-main.jsx --bundle --format=esm --outfile=preview/customer.bundle.js --minify

# Compile Worker bundle
npx esbuild preview/worker-main.jsx --bundle --format=esm --outfile=preview/worker.bundle.js --minify
```

---

## 3. Deploying .NET API to MonsterASP

### Method A: Automated FTP Script
Run the automated deployment script from the `scripts` folder:
```bash
python scripts/deploy_ftp.py
```
This script:
1. Uploads `app_offline.htm` to safely release IIS locks.
2. Deploys updated DLLs, configuration, and wwwroot assets.
3. Removes `app_offline.htm` to bring the service live.

### Method B: GitHub Actions CI/CD
Pushing to the `main` branch automatically triggers `.github/workflows/deploy-monsterasp.yml`, building the .NET 8 release and publishing directly to MonsterASP via FTP.

---

## 4. Keeping Server Awake (24/7 Uptime)
MonsterASP free tier idle pools enter sleep mode after 20 minutes of inactivity.  
To keep the background services and API running 24/7:
- Set up a free monitor on **UptimeRobot** or **Cron-job.org** to ping `https://aistudio.runasp.net/health` every **5 minutes**.
