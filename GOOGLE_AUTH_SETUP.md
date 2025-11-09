# Google OAuth Setup Guide for Car Share App

## ✅ Completed Setup

The following has been configured:

1. ✅ NextAuth installed with Google Provider
2. ✅ Prisma schema updated with NextAuth models (Account, Session, VerificationToken)
3. ✅ Database schema pushed to production
4. ✅ Login page updated with "Continue with Google" button
5. ✅ SessionProvider added to root layout
6. ✅ NextAuth API route configured

## 🔑 Get Google OAuth Credentials

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account

### Step 2: Create or Select a Project
1. Click the project dropdown at the top
2. Click "NEW PROJECT"
3. Name it: "Car Share App" or similar
4. Click "CREATE"

### Step 3: Enable Google+ API
1. In the sidebar, go to "APIs & Services" → "Enabled APIs & services"
2. Click "+ ENABLE APIS AND SERVICES"
3. Search for "Google+ API"
4. Click on it and press "ENABLE"

### Step 4: Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: "Car Share App"
   - User support email: your email
   - Developer contact: your email
   - Click "SAVE AND CONTINUE" through the scopes and test users

### Step 5: Configure OAuth Client ID
1. Application type: "Web application"
2. Name: "Car Share Web Client"
3. Authorized JavaScript origins:
   ```
   http://localhost:3000
   https://yourdomain.com (for production)
   ```
4. Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   https://yourdomain.com/api/auth/callback/google (for production)
   ```
5. Click "CREATE"

### Step 6: Copy Credentials
You'll see a popup with:
- **Client ID** (looks like: 123456789-abcdefgh.apps.googleusercontent.com)
- **Client Secret** (looks like: GOCSPX-abc123def456)

### Step 7: Update .env File
Open your `.env` file and replace:

```bash
# Replace these with your actual credentials:
GOOGLE_CLIENT_ID=123456789-abcdefgh.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456

# Also generate a secure NextAuth secret (run this command):
# openssl rand -base64 32
NEXTAUTH_SECRET=your_generated_secret_here
```

To generate NEXTAUTH_SECRET, run in terminal:
```bash
openssl rand -base64 32
```

## 🚀 Testing Google Login

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Go to: http://localhost:3000/login

3. Click the "Continue with Google" button

4. You should see Google's sign-in page

5. Sign in with any Google account

6. After successful login, you'll be redirected to /dashboard

## 📝 How It Works

1. **User clicks "Continue with Google"**
   - Redirects to Google's OAuth consent screen
   - User signs in with Google

2. **Google redirects back to your app**
   - URL: `/api/auth/callback/google`
   - NextAuth handles the callback

3. **NextAuth creates/updates user**
   - Checks if user exists by email
   - Creates new user if first time
   - Creates Account record linking Google account
   - Creates Session record

4. **User is logged in**
   - Session cookie is set
   - User is redirected to dashboard
   - `useAuth()` hook returns user data

## 🔐 User Data Structure

When user signs in with Google, this data is stored:

```typescript
User {
  id: "cuid",
  email: "user@gmail.com",
  name: "John Doe",
  image: "https://lh3.googleusercontent.com/...",
  emailVerified: "2025-11-09T...",
  password: null, // No password for OAuth users
  role: "PASSENGER", // Default
  isVerified: false, // Can be updated later
}

Account {
  provider: "google",
  providerAccountId: "123456789",
  access_token: "ya29.a0...",
  // ... other OAuth tokens
}
```

## 🛡️ Security Best Practices

1. ✅ Never commit `.env` file to Git
2. ✅ Use different Google OAuth credentials for development and production
3. ✅ Rotate NEXTAUTH_SECRET periodically
4. ✅ Configure OAuth consent screen properly
5. ✅ Add proper redirect URIs for each environment

## 🎨 Customizing Google Sign-In Button

The button is in `src/app/login/page.tsx`:

```typescript
<button
  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
  className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 rounded-xl px-6 py-3 text-gray-700 font-semibold hover:bg-gray-50 hover:border-indigo-400 hover:shadow-md transition-all duration-200"
>
  <FcGoogle size={24} />
  Continue with Google
</button>
```

You can:
- Change the `callbackUrl` to redirect elsewhere
- Modify styling classes
- Change button text
- Add loading states

## 🔧 Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure your redirect URI in Google Console exactly matches:
  `http://localhost:3000/api/auth/callback/google`

### Error: "NEXTAUTH_SECRET is not set"
- Generate a secret: `openssl rand -base64 32`
- Add it to `.env` file

### Error: "Session not found"
- Clear browser cookies
- Restart dev server
- Check database connection

### Google button does nothing
- Check browser console for errors
- Verify GOOGLE_CLIENT_ID is set in `.env`
- Make sure SessionProvider is wrapping your app

## 📚 Additional Features

### Get User in Components
```typescript
'use client'
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not logged in</div>
  
  return <div>Welcome {user.name}!</div>
}
```

### Sign Out
```typescript
import { signOut } from 'next-auth/react'

<button onClick={() => signOut({ callbackUrl: '/login' })}>
  Sign Out
</button>
```

### Protect Pages
```typescript
// In any page.tsx
'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])
  
  if (loading) return <div>Loading...</div>
  if (!user) return null
  
  return <div>Protected content</div>
}
```

## ✨ What's Next?

1. ✅ Complete the Google OAuth setup (get credentials)
2. ✅ Test the login flow
3. ⏭️ Add sign out functionality to Navbar
4. ⏭️ Add user profile page
5. ⏭️ Implement role-based access control
6. ⏭️ Add email verification for non-OAuth users

## 🎉 You're All Set!

Once you add your Google credentials to `.env`, your Google sign-in will work perfectly!

Need help? Check:
- NextAuth docs: https://next-auth.js.org/
- Google OAuth docs: https://developers.google.com/identity/protocols/oauth2
