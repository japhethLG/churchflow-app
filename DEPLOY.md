# DEPLOY.md — ChurchFlow Frontend CI/CD

How the Next.js frontend is built and shipped to production. The backend has
its own [DEPLOY.md](../church-app-backend/DEPLOY.md) — they deploy
independently and don't block each other.

---

## 1. Architecture at a glance

```
push to master
      │
      ▼
GitHub Actions (ubuntu-24.04-arm — native ARM, no QEMU)
      │   generate src/lib/api/schema.d.ts from deployed BE OpenAPI
      │   render .env.production from GH secrets (into build context)
      │   build multi-stage Dockerfile (Next standalone output)
      │   push ghcr.io/japhethlg/churchflow-app:{latest, sha-<commit>}
      ▼
SSH to churchflow.crabdance.com
      │   scp deploy/docker-compose.yml → ~/church-frontend/
      │   scp .env.production → ~/church-frontend/
      │   docker compose pull
      │   docker compose up -d
      ▼
Caddy routes
  churchflow.crabdance.com → 172.17.0.1:3002 → container :3000
```

No migration step (FE has no database). The BE's `/api-docs-json` is the
source of API types — workflow regenerates them on every deploy so they
match the live contract.

---

## 2. Required GitHub Secrets

Set on `japhethLG/churchflow-app`. See [Secrets](https://github.com/japhethLG/churchflow-app/settings/secrets/actions).

| Secret | Notes |
|---|---|
| `SSH_HOST` | `churchflow.crabdance.com` |
| `SSH_USER` | `ubuntu` |
| `SSH_PORT` | `22` |
| `SSH_PRIVATE_KEY` | same deploy keypair as BE — `~/.ssh/id_ed25519_deploy_churchflow` |
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.churchflow.crabdance.com` — **baked into the client bundle at build time** |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | baked into bundle |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | baked into bundle |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | baked into bundle |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | baked into bundle |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | baked into bundle |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | baked into bundle |
| `FIREBASE_ADMIN_PROJECT_ID` | server-side, read at runtime |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | server-side, read at runtime |
| `FIREBASE_ADMIN_PRIVATE_KEY` | server-side, `\n` as the two-char escape (firebase-admin unescapes at boot) |
| `INVITATION_EXPIRY_DAYS` | `7` |

**Important:** changing a `NEXT_PUBLIC_*` value requires a redeploy because
it's compiled into the client JS — restarting the container won't pick it
up.

---

## 3. Files that drive the deploy

| Path | Purpose |
|---|---|
| `Dockerfile` | Multi-stage: deps → builder → slim runner (Next `output: "standalone"`). Builder copies `.env.production` from the build context so `dotenv -e .env.production -- next build` inlines `NEXT_PUBLIC_*` vars. |
| `.dockerignore` | Excludes `node_modules`, `.next`, `.git`, dev env files. **Doesn't** exclude `.env.production` because the workflow writes it into the build context. |
| `deploy/docker-compose.yml` | What runs on the VPS. `env_file: .env.production` supplies server-side runtime vars. |
| `.github/workflows/deploy.yml` | The orchestrator. Triggers: push to `master`, manual `workflow_dispatch`. |
| `next.config.ts` | `output: "standalone"` produces the slim runtime image. |

---

## 4. The schema.d.ts generation step

`src/lib/api/schema.d.ts` is gitignored (`**/schema.d.ts`), so it isn't in
the GitHub checkout. Without it, `openapi-fetch`'s `paths` generic falls
back to `never` and every `useApiMutation` collapses to "params is never."

The workflow runs:
```bash
npx -y openapi-typescript@7 \
  https://api.churchflow.crabdance.com/api-docs-json \
  -o src/lib/api/schema.d.ts
```

before the docker build. Whatever the deployed BE currently advertises is
what gets compiled into the FE bundle. **Therefore, a BE breaking change
in `/api-docs-json` will surface as a FE deploy failure** (intentional —
catches drift loudly).

If you need to deploy the FE against a not-yet-deployed BE change, point
the BE deploy first, then push FE.

---

## 5. VPS layout

Pre-existing infra: Caddy in Docker at `~/caddy/` routes
`churchflow.crabdance.com → 172.17.0.1:3002`.

Owned by this repo's deploys (rewritten each run):
- `~/church-frontend/docker-compose.yml`
- `~/church-frontend/.env.production`

Container:
- Name: `church-frontend`
- Image: `ghcr.io/japhethlg/churchflow-app:latest`
- Healthcheck: `wget --spider http://localhost:3000/` (built into compose).
- Runs `node server.js` (Next standalone server).

---

## 6. Common operations

### Trigger a deploy
```bash
git push origin master                # any commit on master triggers it
# or, without a code change:
gh workflow run Deploy -R japhethLG/churchflow-app
```

### Watch the current run
```bash
gh run watch -R japhethLG/churchflow-app
```

### Rollback to a previous commit's image
```bash
ssh ubuntu@churchflow.crabdance.com
cd ~/church-frontend
sed -i 's|churchflow-app:latest|churchflow-app:sha-<commit>|' docker-compose.yml
docker compose pull && docker compose up -d
# next workflow run will overwrite the compose file — revert when ready
```

### View runtime logs
```bash
ssh ubuntu@churchflow.crabdance.com 'docker logs --tail=200 -f church-frontend'
```

### Update an env var
```bash
gh secret set NEW_VAR -R japhethLG/churchflow-app --body "value"
gh workflow run Deploy -R japhethLG/churchflow-app
```

Remember: `NEXT_PUBLIC_*` values are inlined at build time, so a redeploy
(not just a restart) is required.

---

## 7. Bootstrap from scratch (disaster recovery)

Most of this is shared with the BE — see [BE DEPLOY.md §6](../church-app-backend/DEPLOY.md#6-bootstrap-from-scratch-disaster-recovery).
FE-specific steps:

1. `mkdir ~/church-frontend` on the VPS.
2. Ensure the BE is deployed and reachable at `api.churchflow.crabdance.com`
   — the FE workflow generates types from its OpenAPI.
3. Trigger: `gh workflow run Deploy -R japhethLG/churchflow-app`.

---

## 8. Troubleshooting

| Symptom | Diagnosis |
|---|---|
| Build fails with `Type error: ... is not assignable to type 'never'` | `schema.d.ts` generation didn't pull fresh types, OR the BE's OpenAPI param has no `type` declared (it'll be `unknown`, which collapses). Curl `https://api.churchflow.crabdance.com/api-docs-json` and inspect the param's `schema`. Fix the BE `@ApiParam(...)` decorator if missing `type: String`. |
| Build fails with `ETXTBSY` on esbuild's postinstall | QEMU race condition. The FE workflow already uses native `ubuntu-24.04-arm` to avoid this; if you've reverted to `ubuntu-latest`, switch back. |
| `up -d` fails with port already allocated | Leftover PM2 process: `pm2 list && pm2 delete church-frontend`. |
| Container starts but pages return 500 | Check logs — most often `FIREBASE_ADMIN_*` env vars are missing or `\n`-malformed. |
| `NEXT_PUBLIC_API_BASE_URL` changes don't take effect after a restart | These are inlined at build time. Full redeploy needed. |

---

## 9. Known limitations

- `image: :latest` in compose — no per-environment pin. For staging/prod
  split, switch to sha tags.
- `NEXT_PUBLIC_*` secrets in GH Actions secrets are functionally public
  (they end up in the JS bundle anyway). Treating them as secrets is
  belt-and-braces hygiene, not actual confidentiality.
- The BE deploy must precede a FE deploy when the API surface changes
  (or `npm run api:types` against the live BE will pull a contract the
  FE source doesn't yet match).
