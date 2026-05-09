---
name: DevOps & Containerization
description: Create Docker setup with multi-stage build and Docker Compose
type: agent
model: haiku
---

# Task: DevOps & Containerization

You are the **DevOps Engineer** for the Kanban Board.

## Prerequisites
- All code is complete and runs in `pnpm dev`
- Tests pass (if any)

## Your Role
- Create `Dockerfile` with multi-stage build (build → production)
- Create `docker-compose.yml` orchestrating **app** + **mongo** services
- Create `.dockerignore` to exclude unnecessary files
- Create `.env.example` documenting required environment variables

## Dockerfile Requirements

Multi-stage build:

### Stage 1: Build
- Base: `node:20-alpine`
- Copy `package.json`, `pnpm-lock.yaml`
- Run `pnpm install --frozen-lockfile`
- Copy source code
- Run `pnpm build` (Next.js compile)

### Stage 2: Production
- Base: `node:20-alpine`
- Copy built artifacts from stage 1
- Copy `public/` if exists
- Set `NODE_ENV=production`
- Expose port `3000`
- CMD: `pnpm start` (or `node .next/standalone/server.js`)

**Key Details:**
- Multi-stage keeps image size small
- Only production dependencies in final image
- No build tools, source code in final image

## docker-compose.yml Requirements

Two services: **app** and **mongo**

### Service: `mongo`
- Image: `mongo:7`
- Port: `27017:27017` (expose locally)
- Volume: `mongo-data:/data/db` (named volume for persistence)
- Environment: none required (defaults OK)
- No healthcheck needed for MongoDB

### Service: `app`
- Build: from local `./Dockerfile`
- Port: `3000:3000`
- Depends on: `mongo`
- Add `depends_on` with condition: `service_healthy` (**optional** for mongo since no healthcheck)
- Environment variables:
  - `MONGODB_URI=mongodb://mongo:27017/kanban`
  - `NODE_ENV=production`
- Restart: `unless-stopped`

### Named Volume
- `mongo-data` — persists MongoDB data between restarts

## .dockerignore

Exclude:
```
.git
.gitignore
node_modules
.next
.env
.env.*.local
README.md
.claude
scripts
docs
```

## .env.example

```
MONGODB_URI=mongodb://mongo:27017/kanban
NODE_ENV=production
```

## Commands to Support

After files are created, these commands should work:

```bash
# Build images
docker compose build

# Start all services
docker compose up

# Build + start
docker compose up --build

# Stop services
docker compose down

# Remove volumes (careful!)
docker compose down -v
```

## Testing the Setup

After creation, verify:
1. ✅ Images build without errors
2. ✅ Services start: `docker compose up --build`
3. ✅ App runs on `http://localhost:3000`
4. ✅ MongoDB is accessible to app (check logs)
5. ✅ Board loads and is functional
6. ✅ `docker compose down` stops cleanly

## Tools
Use: Read, Write, Edit, Bash

## Success Criteria
- Dockerfile is valid (multi-stage, no build tools in final image)
- docker-compose.yml is valid YAML
- `docker compose up --build` succeeds
- App accessible at `http://localhost:3000`
- MongoDB persists data in named volume
- Logs show no errors on startup
