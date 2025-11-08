# Quick Vercel Deployment Fix

## 🔴 Problem
Registration fails on Vercel because:
1. SQLite doesn't work on serverless platforms (Vercel)
2. Environment variables aren't synced

## ✅ Solution (5 Minutes)

### Step 1: Get a Free PostgreSQL Database

**Recommended: Neon (Fastest Setup)**
1. Go to https://neon.tech
2. Sign up with GitHub
3. Create new project → Copy connection string
4. Example: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname`

### Step 2: Add Environment Variables to Vercel

1. Go to https://vercel.com/your-username/your-project
2. Click **Settings** → **Environment Variables**
3. Add these:

```
Variable Name: DATABASE_URL
Value: postgresql://user:pass@host.neon.tech:5432/dbname

Variable Name: JWT_SECRET  
Value: fc2ab59be7dae3d642c0501fc3c98533
```

4. Click **Save** for both

### Step 3: Run Database Migration

```bash
# Update your local .env with production DATABASE_URL
DATABASE_URL="postgresql://user:pass@host.neon.tech:5432/dbname"

# Run migrations
npx prisma migrate deploy

# Seed with sample data (optional)
npm run db:seed
```

### Step 4: Redeploy on Vercel

**Option A: From Vercel Dashboard**
- Go to Deployments tab
- Click "..." on latest deployment
- Select "Redeploy"

**Option B: Push to Git**
```bash
git add .
git commit -m "Update for production database"
git push origin main
```

### Step 5: Test Registration

1. Go to your Vercel URL: `https://your-app.vercel.app`
2. Click "Register"
3. Fill in details
4. Should now work! ✅

---

## 🔍 Verify It's Working

### Check Vercel Logs
1. Go to Vercel Dashboard → Deployments
2. Click latest deployment
3. Check "Function Logs" tab
4. Look for any Prisma errors

### Check Database
```bash
# Connect to your database
npx prisma studio

# Or via Neon dashboard
# See your Users table - new registrations should appear
```

---

## ⚠️ Common Errors

### "PrismaClientInitializationError"
**Fix:** DATABASE_URL is wrong or not set in Vercel
- Double-check environment variable in Vercel settings
- Make sure it starts with `postgresql://` not `file:`

### "Table User does not exist"
**Fix:** Migrations not run on production database
```bash
npx prisma migrate deploy
```

### "Registration Failed" (500 error)
**Fix:** Check Vercel function logs
- Usually means database connection issue
- Verify DATABASE_URL is accessible from internet

---

## 📊 Changes Made to Your Project

1. ✅ `prisma/schema.prisma` - Changed provider from `sqlite` to `postgresql`
2. ✅ `package.json` - Added `postinstall` script for Prisma generation
3. ✅ `README.md` - Added deployment instructions

**No code changes needed!** Just database switch + environment variables.

---

## 🎯 Quick Checklist

- [ ] Got PostgreSQL database URL from Neon/Vercel
- [ ] Added `DATABASE_URL` to Vercel environment variables
- [ ] Added `JWT_SECRET` to Vercel environment variables  
- [ ] Ran `npx prisma migrate deploy` with production DATABASE_URL
- [ ] Redeployed on Vercel
- [ ] Tested registration on live site

**Time: ~5 minutes**

---

## 💡 For Local Development

Your local `.env` still works! Just use SQLite for development:

```bash
# .env (local)
DATABASE_URL="file:./dev.db"
JWT_SECRET="fc2ab59be7dae3d642c0501fc3c98533"
```

Prisma schema now supports both:
- `postgresql` provider works with PostgreSQL (production)
- But your local SQLite database will need schema updates

**Recommended:** Use PostgreSQL locally too (optional):
```bash
# Option 1: Docker PostgreSQL
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres

# Option 2: Use Neon for both local and production
DATABASE_URL="postgresql://...neon.tech/dbname"
```

---

Need help? Check Vercel logs or run `npx prisma studio` to inspect database.
