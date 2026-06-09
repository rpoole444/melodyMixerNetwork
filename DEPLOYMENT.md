# Melody Mixer Production Deployment

## Architecture

- Frontend: Vercel
- Rails API and Postgres: Heroku
- Audio storage: private S3 bucket
- Broadcast playback: AzuraCast, added after the application workflow is stable

This keeps Next.js on its native hosting platform and gives Rails a persistent
application runtime, managed Postgres, release migrations, and room for future
background audio-rendering workers.

Use custom subdomains when DNS is ready:

- `shows.alpinegrooveguide.com` -> Vercel
- `api.alpinegrooveguide.com` -> Heroku

## Supported Runtimes

- Node.js 20
- Ruby 3.4.9

Keep these pins aligned with Vercel and Heroku before changing either runtime.

## 1. Prepare Heroku

From `radio-denver-be`:

```bash
heroku create <backend-app-name>
heroku addons:create heroku-postgresql:essential-0 --app <backend-app-name>
heroku config:set \
  SECRET_KEY_BASE="$(bundle exec rails secret)" \
  FRONTEND_ORIGINS="https://<frontend-project>.vercel.app" \
  FRONTEND_URL="https://<frontend-project>.vercel.app" \
  BACKEND_HOST="<backend-app-name>.herokuapp.com" \
  AWS_ACCESS_KEY_ID="..." \
  AWS_SECRET_ACCESS_KEY="..." \
  AWS_REGION="..." \
  S3_BUCKET_NAME="..." \
  --app <backend-app-name>
```

Configure the SMTP variables from `.env.example` before testing invitations or
password resets. Heroku runs `rails db:migrate` through the `release` process
on each deploy.

Deploy the current backend branch:

```bash
git push heroku HEAD:main
heroku ps:scale web=1 --app <backend-app-name>
heroku open /up --app <backend-app-name>
```

## 2. Prepare Vercel

From `radio-host-app`:

```bash
vercel link
vercel env add NEXT_PUBLIC_API_BASE_URL production
vercel env add NEXT_PUBLIC_STREAM_URL production
vercel --prod
```

Set `NEXT_PUBLIC_API_BASE_URL` to:

```text
https://<backend-app-name>.herokuapp.com/api/v1
```

After Vercel provides the production URL, update `FRONTEND_ORIGINS` and
`FRONTEND_URL` on Heroku to that exact HTTPS origin, then restart the backend.

## 3. Production Smoke Test

1. Open the public station page while logged out.
2. Log in as the admin and confirm the session survives a page refresh.
3. Create an invitation and register a new host through it.
4. Upload a short audio file and confirm it remains playable after refresh.
5. Create, save, submit, review, schedule, and reopen a short test show.
6. Verify the scheduled show appears in Programming and on the public page.
7. Request a password reset and verify the email link returns to Vercel.
8. Confirm a disallowed web origin cannot make credentialed API requests.
9. Check Heroku logs for exceptions and verify `/up` returns HTTP 200.

## 4. Launch Controls

Before inviting hosts:

- Enable Heroku automatic deploys only after both repositories are pushed.
- Configure production S3 CORS and lifecycle rules.
- Configure SMTP and test delivery.
- Add error monitoring.
- Enable Heroku Postgres backups.
- Attach the custom domains and verify HTTPS.
- Keep AzuraCast in manual-export mode until several production shows pass.
