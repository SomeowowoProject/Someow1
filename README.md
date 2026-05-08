# Dakdori — collaborative portfolio platform

A platform for creative individuals to publish portfolios, find collaborators across fields, and ship projects together.

Stack: vanilla HTML/CSS/JS frontend · Node.js + Express backend · SQLite (via better-sqlite3) · JWT auth in httpOnly cookies.

---

## Quick start

```bash
# 1. install dependencies
npm install

# 2. copy environment template and edit if needed
cp .env.example .env

# 3. initialize the database (also seeds a demo user)
npm run init-db

# 4. start the server
npm start
```

Open `http://localhost:3000`.

A demo account is seeded on first run:

- **email**: `demo@dakdori.app`
- **password**: `demo1234`

---

## Project structure

```
dakdori-platform/
├── server.js                # Express entry
├── package.json
├── .env.example             # config template
├── db/
│   ├── init.js              # schema + seed
│   ├── index.js             # shared db connection
│   └── dakdori.sqlite       # created on first run
├── middleware/
│   ├── auth.js              # JWT verify
│   └── upload.js             # multer file uploads
├── routes/
│   ├── auth.js              # /api/auth/*
│   ├── users.js             # /api/users/*
│   ├── projects.js          # /api/projects/*
│   └── posts.js             # /api/posts/*
├── public/                  # static frontend
│   ├── index.html
│   ├── css/
│   │   ├── main.css         # tokens, nav, cards
│   │   └── screens.css      # profile, detail, compose, etc.
│   └── js/
│       ├── api.js           # fetch wrappers
│       ├── state.js         # global state + field config
│       ├── ui.js            # screen routing, theme, helpers
│       ├── auth.js          # signup/login UI
│       ├── home.js          # grid, search, infinite scroll
│       ├── profile.js       # profile read/edit + uploads
│       ├── project.js       # project detail
│       ├── compose.js       # new project flow
│       ├── community.js     # field communities & posts
│       ├── location.js      # D3 map location picker
│       └── app.js           # bootstrap
└── uploads/                 # user uploads (created on demand)
```

---

## API reference (summary)

### Auth
| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | — | `{email, handle, password, name}` |
| POST | `/api/auth/login` | — | `{identifier, password}` (email or handle) |
| POST | `/api/auth/logout` | — | clears cookie |
| GET | `/api/auth/me` | yes | current session info |

### Users
| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/users` | optional | `?q=` search |
| GET | `/api/users/:handle` | optional | profile + stats |
| PUT | `/api/users/me/profile` | yes | partial update of own profile |
| POST | `/api/users/me/avatar` | yes | multipart `image` |
| POST | `/api/users/me/cover` | yes | multipart `image` |
| POST | `/api/users/:handle/follow` | yes | |
| DELETE | `/api/users/:handle/follow` | yes | |
| GET | `/api/users/:handle/reviews` | — | |
| POST | `/api/users/:handle/reviews` | yes | `{body, meta}` |

### Projects
| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/projects` | optional | `?field=&q=&author=&sort=&viewed=&limit=&offset=` |
| GET | `/api/projects/:id` | optional | also records view |
| POST | `/api/projects` | yes | |
| PUT | `/api/projects/:id` | yes | author only |
| DELETE | `/api/projects/:id` | yes | author only |
| POST | `/api/projects/:id/media` | yes | multipart `files[]` |
| POST | `/api/projects/:id/invite` | yes | `{handle, role}` |

### Posts (community feed)
| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/posts` | — | `?field=design` required |
| POST | `/api/posts` | yes | `{field, body}` |
| DELETE | `/api/posts/:id` | yes | author only |

---

## Production hardening checklist

Before deploying publicly, do at least these:

1. **`JWT_SECRET`** — set a long random string in `.env` (e.g. `openssl rand -hex 64`).
2. **`COOKIE_SECURE=true`** in `.env` if serving over HTTPS.
3. Run behind a reverse proxy (nginx, Caddy) with TLS termination.
4. Move uploads to object storage (S3, R2) for multi-instance deployments — the current setup writes to local disk.
5. Replace SQLite with PostgreSQL if you expect concurrent writes from many users. The schema in `db/init.js` is portable; swap `better-sqlite3` for `pg` and adjust the few SQL functions (`strftime`).
6. Add a backup job for the SQLite file (or migrate to a hosted DB).
7. Consider adding fail2ban / rate-limit by IP in nginx — `express-rate-limit` is in-memory and resets on restart.

---

## Deploying

A minimal `systemd` service (`/etc/systemd/system/dakdori.service`):

```ini
[Unit]
Description=Dakdori platform
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/srv/dakdori
EnvironmentFile=/srv/dakdori/.env
ExecStart=/usr/bin/node server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then `systemctl enable --now dakdori` and reverse-proxy to port 3000.

---

## License

MIT
