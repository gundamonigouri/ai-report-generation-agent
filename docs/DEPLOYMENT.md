# Deployment Guide

Deploy the frontend on Vercel and the backend on Render, with MongoDB Atlas and ChromaDB.

## Architecture

```text
[Vercel - React] --> [Render - Express API] --> [MongoDB Atlas]
                              |
                              v
                      [ChromaDB Server]
                              |
                              v
                         [Groq API]
```

## 1. MongoDB Atlas

1. Create a free cluster at `mongodb.com/atlas`.
2. Create a database user.
3. Allow Render network access. For a demo, whitelist `0.0.0.0/0`; for production, use a stricter Atlas network rule.
4. Copy a connection string such as `mongodb+srv://user:pass@cluster.mongodb.net/ai-report-agent`.

## 2. ChromaDB

### Option A: Chroma on Render

Deploy Chroma as a separate Render private service using the Docker image `chromadb/chroma` on port `8000`.

### Option B: Local Chroma

```bash
docker compose up -d chromadb
```

### Option C: Demo Fallback

If Chroma is unreachable, the API falls back to an in-memory vector store. This is useful for demos, but hosted Chroma is recommended for production.

## 3. Backend on Render

### Blueprint Deploy

1. Push the repository to GitHub.
2. In Render, choose **New +** -> **Blueprint**.
3. Select the repository. Render will read `render.yaml` from the repository root.
4. Fill the secret environment variables when prompted.

### Manual Deploy

1. Push the repository to GitHub.
2. In Render, create a new Web Service.
3. Connect the repository and set:

| Setting | Value |
| --- | --- |
| Root Directory | `server` |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Environment | Node |

4. Add environment variables:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas connection string |
| `JWT_SECRET` | Strong random string, 32+ chars |
| `GROQ_API_KEY` | Groq API key |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` or your chosen Groq model |
| `CLIENT_URL` | Vercel frontend URL, or comma-separated URLs for production plus previews |
| `CHROMA_HOST` | Chroma host if used |
| `CHROMA_PORT` | `8000` |
| `ADMIN_EMAIL` | Admin email |
| `ADMIN_PASSWORD` | Secure admin password |

5. Deploy and open `https://your-api.onrender.com/api/health`.
6. Seed the admin user once from Render Shell:

```bash
npm run seed:admin
```

7. Note the API URL, for example `https://your-api.onrender.com`.

## 4. Frontend on Vercel

1. Import the Git repository in Vercel.
2. Set Root Directory to `client`.
3. Use the Vite framework preset.
4. Add environment variable:

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | `https://your-api.onrender.com/api` |

5. Deploy.
6. Copy the Vercel app URL back into the Render `CLIENT_URL` environment variable and redeploy the API if needed.

## 5. Post-Deploy Checklist

- `GET https://your-api.onrender.com/api/health` returns success.
- Registration and login work.
- Admin login works after `npm run seed:admin`.
- Uploading a PDF, DOCX, or TXT creates ready document chunks.
- Report generation completes with citations and metrics.
- PDF and DOCX downloads work.
- `CLIENT_URL` exactly matches the Vercel URL.
- Production secrets are rotated before sharing the demo.

## Troubleshooting

| Issue | Fix |
| --- | --- |
| Login/register returns `405` on the Vercel URL | Set `VITE_API_URL` in Vercel to the Render API URL, for example `https://your-api.onrender.com/api`, then redeploy the frontend. |
| Login/register returns `500` | Check Render logs first. Most auth failures during deployment are MongoDB connection failures. |
| CORS errors | Set `CLIENT_URL` to the exact Vercel URL without a trailing slash. Use comma-separated URLs for multiple allowed frontends. |
| Report fails instantly | Verify `GROQ_API_KEY` and `GROQ_MODEL`. |
| MongoDB timeout | Check Atlas network access and credentials. Render cannot use your local IP allowlist. |
| Chroma connection refused | Use the in-memory fallback or deploy Chroma separately. |
| Cold start slow | Render free tier may need 30-60 seconds for the first request. |

## Environment Summary

Server:

```env
MONGODB_URI=
JWT_SECRET=
GROQ_API_KEY=
CLIENT_URL=
CHROMA_HOST=
CHROMA_PORT=8000
```

Client:

```env
VITE_API_URL=https://your-api.onrender.com/api
```
