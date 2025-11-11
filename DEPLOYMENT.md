Railway deployment guide
=======================

Quick checklist (what Railway needs):

- Shared Variables (Project Settings) or Service Variables:
  - DATABASE_URL — your Postgres connection string (postgresql://USER:PASSWORD@HOST:PORT/DATABASE)
  - SECRET_KEY — a secure random string for JWT

- Start command for the service that runs your Node app (set this in the Railway service Settings):
  npm run start:prod

Why this Start Command?
- `npm run start:prod` runs:
  1. `npx prisma generate` — ensures the Prisma client is generated (postinstall usually does this but it's safe to run here)
  2. `npx prisma migrate deploy` — applies committed migrations from `prisma/migrations` (non-interactive and safe for production)
  3. `node src/server.js` — starts the Express server that serves the API and the React `build/` folder

Railway step-by-step
--------------------
1. Create / open your Railway project and add a Postgres database if you haven't already.
2. Copy the database connection string from the Railway Postgres service.
3. Project → Project Settings → Shared Variables (or open the specific service and add Service Variables):
   - Add `DATABASE_URL` with the connection string.
   - Add `SECRET_KEY` with a secure value.
4. Open your Node service in Railway and set the Start Command to:

   npm run start:prod

   (Railway runs Linux containers, so the npm script will run in a Linux environment.)

5. Deploy (trigger a new deploy by pushing to the repo or using the Railway UI). Watch the Deploy logs:
   - You should see `Prisma` output applying migrations.
   - Then you should see your server start logs (for example: "Server is running on http://localhost:5004" or similar).

6. Verify the deployed URL (Railway shows the service URL) — open it in a browser or use curl/Invoke-WebRequest.

Notes & troubleshooting
-----------------------
- If `npx prisma migrate deploy` fails because migrations are incompatible, check `prisma/migrations` in the repo.
- `postinstall` in `package.json` already runs `npx prisma generate` during `npm install`, but the `start:prod` script runs it again to be safe.
- Make sure `prisma/migrations/migration_lock.toml` provider is `postgresql` (it is in this repo) and that your migrations were created for Postgres.
- If you prefer to run migrations as a release step rather than part of the start command, configure a Railway Release Hook (or a separate one-off service) that runs:
  npx prisma migrate deploy

Local testing before Railway
---------------------------
1. Set local env (PowerShell):
   $env:DATABASE_URL = "postgresql://USER:PASSWORD@HOST:5432/DATABASE"
   $env:SECRET_KEY = "a-very-secret-key"

2. Apply migrations locally (non-interactive):
   npx prisma migrate deploy
   npx prisma generate

3. Start local server:
   node src/server.js

That's it — after you push the changes and set the Railway env vars, your app should deploy and the migrations should run automatically when Railway executes the start command.
