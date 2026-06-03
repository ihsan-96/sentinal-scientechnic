# Deploying on the VM (host Caddy + subdomain)

The backend ships as one Docker Compose stack (NestJS API + worker + SSE, Postgres, Redis) and
runs unchanged with `docker compose up`. The VM's **already-running host Caddy** terminates TLS
for `scientechnic.madian.in` and reverse-proxies it to the backend on `localhost:4000`. The
dashboard and simulator stay as static SPAs (Netlify/Vercel), pointed at the backend via
`VITE_API_URL`; cross-origin access is allowed via the backend's `CORS_ORIGIN`.

```
browser → https://<dashboard|simulator host>      (static SPA, HTTPS)
        → https://scientechnic.madian.in/api/...   (host Caddy :443) → localhost:4000 (compose backend)
```

## 1. DNS

Add an `A` record: `scientechnic.madian.in` → the VM's public IP. (Caddy needs port 80 reachable
to obtain the Let's Encrypt cert.)

## 2. Run the stack

`CORS_ORIGIN` must list the exact origins of the deployed frontends — scheme + host, comma
separated, **no trailing slash, no path**. The backend splits this on commas and allows each.

```bash
git clone <this-repo-url> app && cd app
export CORS_ORIGIN="https://<dashboard-host>,https://<simulator-host>"
docker compose up -d --build
```

This builds the backend, starts Postgres + Redis, runs DB migrations automatically
(`node dist/db/migrate.js && node dist/main.js`), and publishes the API on `localhost:4000`.

## 3. Add the Caddy site block

In the host Caddyfile (usually `/etc/caddy/Caddyfile`), add:

```caddy
scientechnic.madian.in {
	reverse_proxy localhost:4000 {
		flush_interval -1   # stream Server-Sent Events (/api/stream) without buffering
	}
}
```

Then reload Caddy:

```bash
sudo systemctl reload caddy      # or: caddy reload --config /etc/caddy/Caddyfile
```

## 4. Point the frontends at it

In each frontend's hosting (Netlify/Vercel → Environment variables), set and redeploy:

```
VITE_API_URL=https://scientechnic.madian.in/api
```

(Backend routes live under the `/api` prefix; the SSE stream is `${VITE_API_URL}/stream`.)

## 5. Firewall

Expose only **22, 80, 443** to the internet. Do **not** open **4000 / 5432 / 6379** — Caddy
reaches the backend over `localhost`, and the compose Redis runs with no password.

---

## Verify

```bash
docker compose ps                          # backend up; postgres + redis healthy
curl https://scientechnic.madian.in/api/docs   # Swagger, valid cert
curl -N https://scientechnic.madian.in/api/stream   # SSE stays open and streams
```

Open the deployed dashboard — incidents should load (REST) and update live (SSE) with no
mixed-content or CORS errors in the browser console. If you see a CORS error, the page's exact
origin isn't in `CORS_ORIGIN`; fix it and rerun `docker compose up -d`.

## Update / teardown

```bash
git pull && docker compose up -d --build   # redeploy
docker compose down                         # stop the stack
```

> **Local development is unchanged.** `docker compose up` runs the same stack as always, backend
> on `http://localhost:4000`. None of the above touches `docker-compose.yml` or the app code.
