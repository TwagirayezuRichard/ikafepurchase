# Ikafe Purchase App

## Deploy on Render

Create a **Static Site** connected to this repository. Leave the root directory blank and configure:

- **Build command:** `npm install && npm run build`
- **Publish directory:** `dist`
- **Environment variable:** `VITE_API_URL=https://<your-backend-service>.onrender.com/api/v1`

Add a rewrite rule so client-side routes work when opened directly:

- **Source:** `/*`
- **Destination:** `/index.html`
- **Action:** `Rewrite`

Set the backend's `CLIENT_URL` environment variable to the exact HTTPS URL Render assigns to this static site. The API must allow credentialed requests from this origin for cookie-based login to work.

The app is installable on supported Android browsers and can be added to the iPhone home screen from Safari. Both require the deployed HTTPS site.

## Local development

Install Node.js 20.19 or newer, then:

```powershell
npm install
npm run dev
```

For a non-default API URL, copy `.env.example` to `.env.local` and set `VITE_API_URL`. Do not commit environment files containing deployment settings.
