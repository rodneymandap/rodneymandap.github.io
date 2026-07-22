# YNAB MCP Server

This project includes a read-only MCP endpoint for YNAB at:

```text
/api/ynab-mcp
```

It exposes tools for listing plans, accounts, categories, month summaries, transactions, and a compact plan overview.

Users connect their own YNAB accounts through OAuth:

```text
/api/ynab/oauth/connect
```

## Environment Variables

Add these variables in Vercel under Project Settings > Environment Variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `YNAB_CLIENT_ID` | Yes | OAuth application client ID from YNAB Developer Settings. |
| `YNAB_CLIENT_SECRET` | Yes | OAuth application client secret from YNAB Developer Settings. |
| `YNAB_REDIRECT_URI` | Recommended | Full callback URL, for example `https://mcp.rodneymandap.com/api/ynab/oauth/callback`. |
| `UPSTASH_REDIS_REST_URL` | Yes for production OAuth | Persistent token store URL. |
| `UPSTASH_REDIS_REST_TOKEN` | Yes for production OAuth | Persistent token store token. |
| `YNAB_ACCESS_TOKEN` | Optional | Owner-only fallback personal access token. |
| `MCP_API_KEY` | Optional | Shared secret for the owner-only fallback mode. |
| `YNAB_API_BASE` | No | Defaults to `https://api.ynab.com/v1`. |

## Create the YNAB OAuth App

1. Sign in to the YNAB web app.
2. Open Account Settings.
3. Open Developer Settings.
4. Under OAuth Applications, create a new application.
5. Add the redirect URI:

```text
https://mcp.rodneymandap.com/api/ynab/oauth/callback
```

For local development, also add:

```text
http://localhost:3000/api/ynab/oauth/callback
```

6. Copy the client ID and client secret into Vercel as `YNAB_CLIENT_ID` and `YNAB_CLIENT_SECRET`.
7. Request read-only access only. The server also sends `scope=read-only` during authorization.

YNAB starts new OAuth applications in Restricted Mode. That currently allows a limited number of users outside the application owner until YNAB reviews and approves the app.

## Token Storage

OAuth access tokens expire and refresh tokens must be stored server-side. For Vercel, use Upstash Redis:

1. Create a Redis database in Upstash.
2. Copy the REST URL and REST token.
3. Add them to Vercel as `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

Without Redis, the code falls back to in-memory storage for local development only. That is not reliable on Vercel because serverless functions can restart.

## Deploy on Vercel

### Option A: Same Portfolio Project

Use this when the MCP server is only for your own use.

1. Push this branch to GitHub.
2. Open the existing portfolio project in Vercel.
3. Add `YNAB_CLIENT_ID`, `YNAB_CLIENT_SECRET`, `YNAB_REDIRECT_URI`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN`.
4. Deploy.
5. Users connect at:

```text
https://rodneymandap.com/api/ynab/oauth/connect
```

6. Use this MCP URL:

```text
https://rodneymandap.com/api/ynab-mcp
```

### Option B: Separate Vercel Project and Subdomain

Use this when you want cleaner logs, environment variables, and deployment history.

1. Create a new Vercel project from the same repository.
2. Set the production branch to the branch or app you want to deploy.
3. Add `YNAB_CLIENT_ID`, `YNAB_CLIENT_SECRET`, `YNAB_REDIRECT_URI`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN`.
4. Add a custom domain such as `mcp.rodneymandap.com`.
5. Users connect at:

```text
https://mcp.rodneymandap.com/api/ynab/oauth/connect
```

6. Use this MCP URL:

```text
https://mcp.rodneymandap.com/api/ynab-mcp
```

## Client Authentication

After a user finishes OAuth, the callback page returns a token beginning with `ynab_`. MCP clients must send:

```text
Authorization: Bearer <ynab_connection_token>
```

The YNAB access and refresh tokens stay server-side in the token store and are never sent to the MCP client.

Owner-only fallback is still available for your own use. If `YNAB_ACCESS_TOKEN` and `MCP_API_KEY` are configured, you can send:

```text
Authorization: Bearer <MCP_API_KEY>
```

## Local Test

Create `.env.local` with:

```env
YNAB_CLIENT_ID=your_client_id
YNAB_CLIENT_SECRET=your_client_secret
YNAB_REDIRECT_URI=http://localhost:3000/api/ynab/oauth/callback
```

Start the app and check:

```text
http://localhost:3000/api/ynab-mcp
```

You should see the server health response and the available tool names.
