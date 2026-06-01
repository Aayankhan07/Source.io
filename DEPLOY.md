# Deployment Guide - Source.io Study Workspace

Since this is a client-side Single Page Application (SPA) built with Vite, React, and Tailwind, and it communicates directly with a Supabase backend, you only need to host the static compiled assets. 

Here are the best platforms to deploy this application for free, along with step-by-step instructions.

---

## 🚀 Option 1: Netlify (Recommended - Easiest Setup)

Netlify is the easiest platform to deploy Single Page Applications.

### Step-by-Step Instructions:
1. **Push your code to GitHub** (or GitLab/Bitbucket).
2. Go to [Netlify](https://www.netlify.com/) and sign up / sign in.
3. Click **Add new site** → **Import an existing project**.
4. Authorize Netlify to access your GitHub account and select your repository (`learn-sparkle-stream`).
5. Configure the Build Settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
6. Click **Add environment variables** and enter your Supabase credentials:
   - `VITE_SUPABASE_URL` = *(Your Supabase Project URL)*
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = *(Your Supabase Anon/Publishable Key)*
7. Click **Deploy site**.

### SPA Routing support (Crucial for React Router)
Single Page Apps require routing redirects so that refreshing a nested page (like `/app/doc/123`) doesn't return a 404. 
Netlify looks for a `_redirects` file in the publish directory. 

We have added a redirection file to handle this natively (see below).

---

## ⚡ Option 2: Vercel (Excellent Performance & Previews)

Vercel provides excellent performance and automatic pull-request review deployments.

### Step-by-Step Instructions:
1. Go to [Vercel](https://vercel.com/) and log in with your GitHub account.
2. Click **Add New** → **Project**.
3. Import your repository (`learn-sparkle-stream`).
4. In the **Build and Development Settings**, Vite will be auto-detected:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
6. Click **Deploy**.

### SPA Routing on Vercel
Vercel looks for a `vercel.json` config file at the project root to redirect all routes to `index.html`. 

---

## 🌐 Option 3: Cloudflare Pages (Unlimited Bandwidth)

Cloudflare Pages is incredibly fast and has no bandwidth limits on the free tier.

### Step-by-Step Instructions:
1. Go to your [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Workers & Pages**.
2. Click **Create Application** → **Pages** → **Connect to Git**.
3. Select your repository.
4. Select the **Vite** preset:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Add your Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
6. Click **Save and Deploy**.

---

## 🔒 Supabase Authentication Redirects Configuration
Once you deploy, you **MUST** whitelist your new deployment URL inside Supabase, otherwise users won't be able to log in or use OAuth:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **Authentication** → **URL Configuration**.
3. Under **Redirect URLs**, click **Add URL** and paste your deployed site URL (e.g. `https://your-site.netlify.app/app` or `https://your-site.vercel.app/app`).
4. Save the changes.
