# StormSight deployment

StormSight is a static browser application hosted by Vercel. Supabase provides
authentication and user-owned data. Live weather, flood-model, mapping, and
notification providers are separate production integrations.

## 1. Create the Supabase backend

1. Create a Supabase project in a region near the expected users.
2. Open **SQL Editor**, paste `supabase/schema.sql`, and run it once.
3. In **Authentication > URL Configuration**, set the Site URL to the Vercel
   production URL and add the preview and localhost redirect URLs you will use.
4. From the project's **Connect** dialog, copy the project URL and publishable key.
   Never use a secret or legacy `service_role` key in browser code.
5. Configure a production SMTP provider before real email traffic.

## 2. Deploy to Vercel

Import the repository and set `StormSight` as the Vercel Root Directory. The
checked-in `vercel.json` supplies the build command and `dist` output directory.

Add these variables to the Production, Preview, and Development environments:

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Deploy, then add the final Vercel domain to Supabase Auth URL Configuration.

## 3. Run locally

```powershell
cd C:\Users\james\CivicBuild\StormSight
$env:SUPABASE_URL='https://YOUR_PROJECT.supabase.co'
$env:SUPABASE_PUBLISHABLE_KEY='sb_publishable_YOUR_KEY'
npm run build
npm run dev
```

Open http://127.0.0.1:4173. Run `npm run check` before committing.

## 4. Production work still needed

- Replace demo forecast and alert constants with trusted PAGASA/LGU feeds.
- Define and operate the flood-model pipeline. Hydro3DJS is a visualization
  library, not a forecasting backend.
- Choose a map/geocoding provider and restrict its browser key by domain.
- Connect the remaining Saved Locations and notification controls to the provided
  backend methods and tables.
- Add server-side or Edge scheduled ingestion for weather data. Keep provider
  secrets only in server-side environment variables.
- Add notification delivery, monitoring, backups, privacy/retention policies,
  audit logs, and incident procedures.
- Validate the hazard model and show source timestamps. Keep the demo disclaimer
  until the system is validated for public-safety use.

## Security boundary

The publishable key is intentionally embedded at build time and is safe only with
strict Row Level Security. Never add `SUPABASE_SECRET_KEY` or a `service_role`
key to `dist`, `config.js`, or any browser-visible variable.
