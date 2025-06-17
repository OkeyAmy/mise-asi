# Google Authentication Setup Guide

This guide will help you configure Google OAuth authentication for your Mise application using Supabase.

## Prerequisites

- Supabase project created and configured
- Google Cloud Console account
- Your application deployed or running locally

## Step 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Note your project ID

### 1.2 Enable Google+ API
1. Navigate to **APIs & Services** > **Library**
2. Search for "Google+ API" 
3. Click on it and press **Enable**

### 1.3 Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Choose **Web application** as application type
4. Name your OAuth client (e.g., "Mise App")

### 1.4 Configure Authorized URLs
Add these URLs to your OAuth client:

**Authorized JavaScript origins:**
```
http://localhost:5173
http://localhost:3000
https://your-production-domain.com
```

**Authorized redirect URIs:**
```
https://your-project-ref.supabase.co/auth/v1/callback
```

Replace `your-project-ref` with your actual Supabase project reference ID.

### 1.5 Get Your Credentials
After creating the OAuth client, you'll get:
- **Client ID** (starts with numbers and ends with `.apps.googleusercontent.com`)
- **Client Secret**

## Step 2: Supabase Configuration

### 2.1 Enable Google Provider
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** > **Settings** > **Auth Providers**
4. Find **Google** and enable it

### 2.2 Add Google Credentials
1. In the Google provider section, add:
   - **Client ID**: Your Google OAuth client ID
   - **Client Secret**: Your Google OAuth client secret

### 2.3 Configure Redirect URLs
1. In **Authentication** > **Settings** > **Auth**
2. Add these site URLs:
   ```
   http://localhost:5173
   http://localhost:3000
   https://your-production-domain.com
   ```

3. Set redirect URLs (usually can use wildcards):
   ```
   http://localhost:5173/**
   http://localhost:3000/**
   https://your-production-domain.com/**
   ```

## Step 3: Environment Variables (Optional)

If you want to store Google credentials in environment variables:

Create `.env.local`:
```bash
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

Then update your code to use it:
```typescript
// Optional: You can also pass clientId if needed for Google One Tap
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/`,
    // clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID, // Optional
  },
});
```

## Step 4: Testing

### 4.1 Local Testing
1. Start your development server: `pnpm dev`
2. Navigate to `/auth`
3. Click "Continue with Google"
4. You should be redirected to Google's OAuth consent screen
5. After authorization, you should be redirected back to your app

### 4.2 Production Testing
1. Deploy your application
2. Update the authorized URLs in Google Cloud Console
3. Update the redirect URLs in Supabase
4. Test the Google authentication flow

## Troubleshooting

### Common Issues

**1. "Invalid redirect URI"**
- Check that your redirect URI in Google Cloud Console matches exactly
- Ensure you've added the Supabase callback URL: `https://your-project-ref.supabase.co/auth/v1/callback`

**2. "Origin mismatch"**
- Verify your authorized JavaScript origins include your current domain
- For localhost, use `http://localhost:PORT` (not `127.0.0.1`)

**3. "Client ID not found"**
- Double-check your client ID in Supabase settings
- Ensure the Google+ API is enabled in Google Cloud Console

**4. CORS issues**
- Make sure your domain is added to Supabase site URLs
- Check that redirect URLs include the wildcard pattern

### Debug Tips

1. Check browser console for detailed error messages
2. Verify all URLs use the correct protocol (http vs https)
3. Test with incognito mode to avoid cached credentials
4. Use Supabase logs to see authentication attempts

## Security Best Practices

1. **Never expose client secrets** in frontend code
2. **Use HTTPS** in production
3. **Regularly rotate** OAuth credentials
4. **Limit redirect URIs** to only necessary domains
5. **Monitor** authentication logs in Supabase

## Additional Features

### Google One Tap Integration
For enhanced UX, you can integrate Google One Tap:

```typescript
// Add to your auth component
useEffect(() => {
  if (window.google) {
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleGoogleOneTap,
    });
    window.google.accounts.id.renderButton(
      document.getElementById("google-signin-button"),
      { theme: "outline", size: "large" }
    );
  }
}, []);

const handleGoogleOneTap = async (response: any) => {
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: response.credential,
  });
  // Handle response
};
```

## Support

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Discord Community](https://discord.supabase.com) 