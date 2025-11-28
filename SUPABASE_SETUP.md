# Supabase Setup Guide for Memzy

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "New Project"
3. Sign in with GitHub (or create an account)
4. Click "New Project"
5. Fill in the details:
   - **Name**: `memzy-flashcards` (or whatever you prefer)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free (perfect for getting started)
6. Click "Create new project"
7. Wait 1-2 minutes for project setup

## Step 2: Get Your API Keys

1. Once the project is ready, go to **Settings** (gear icon in sidebar)
2. Click **API** in the settings menu
3. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (a long string starting with `eyJ...`)

## Step 3: Add Keys to Your .env.local File

1. Open `.env.local` in your project
2. Add these lines (replace with YOUR actual values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_actual_key_here
```

3. Save the file

## Step 4: Configure Email Settings (Optional but Recommended)

By default, Supabase requires email confirmation for new users. You have two options:

### Option A: Disable Email Confirmation (for testing)
1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Click **Email** provider
3. Scroll down to **Confirm email**
4. Toggle OFF "Enable email confirmations"
5. Click "Save"

### Option B: Keep Email Confirmation (more secure)
Users will receive a confirmation email when they sign up. They must click the link to activate their account.

To customize the email template:
1. Go to **Authentication** → **Email Templates**
2. Click "Confirm signup"
3. Customize the message if desired

## Step 5: Restart Your Dev Server

Since you added new environment variables, restart your Next.js server:

```bash
# Stop the current server (Ctrl+C if running in terminal)
# Or kill the background process:
kill 77262

# Start it again:
pnpm dev
```

## Step 6: Test the Authentication

1. Go to [http://localhost:3000](http://localhost:3000)
2. Click the profile icon in the top right
3. Click "Create Account"
4. Fill in the form and submit
5. If email confirmation is enabled, check your email
6. Try signing in at [http://localhost:3000/login](http://localhost:3000/login)

## What's Been Set Up

✅ **User Authentication**
- Sign up with email/password
- Sign in/Sign out
- User session management
- Profile dropdown shows logged-in state

✅ **Files Created/Updated**
- `/lib/supabase.ts` - Supabase client configuration
- `/app/login/page.tsx` - Login page
- `/app/create-account/page.tsx` - Sign up (updated with real auth)
- `/components/profile-dropdown.tsx` - Profile menu (updated with real auth state)
- `.env.local.example` - Example environment variables

## Next Steps (Coming Soon)

🔜 **Database for Flashcards**
- Create tables for storing user flashcards
- Save flashcards to database
- Load user's saved flashcards
- Organize flashcards into decks

🔜 **Mobile App Conversion**
- Convert to PWA (Progressive Web App)
- Add to home screen capability
- Offline support
- Camera access on mobile devices

## Troubleshooting

**Error: "Invalid API key"**
- Make sure you copied the FULL anon key from Supabase
- Check for extra spaces or line breaks
- Verify the key starts with `eyJ`

**Error: "supabaseUrl is required"**
- Restart your dev server after adding .env.local
- Make sure variable names are exact: `NEXT_PUBLIC_SUPABASE_URL`

**Email not sending**
- Free tier has limited emails (3 per hour during development)
- Check spam folder
- Or disable email confirmation (see Option A above)

**Can't sign in after creating account**
- If email confirmation is enabled, check your email first
- Try resetting password if needed

## Need Help?

- Supabase Docs: [https://supabase.com/docs](https://supabase.com/docs)
- Next.js + Supabase: [https://supabase.com/docs/guides/getting-started/quickstarts/nextjs](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
