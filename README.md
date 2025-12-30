# hostctl-docker

hostctl task package for Docker, Docker Compose, and Docker Swarm operations.

## Quick start

```bash
npm install
npm run build
hostctl tasks .
```

## Conventions

- Tasks live under `src/tasks/` and export a default `task(...)`.
- `src/index.ts` re-exports tasks and publishes the registry for discovery.
- Task names are unqualified; the registry assigns qualified names.
- Schema helpers come from `hostctl` (re-exported `zod`) and are attached to tasks.

### Compose deploy

```bash
hostctl run . docker.compose.deploy \
  compose_path:/opt/apps/my-app/docker-compose.yml \
  project:my-app \
  pull:missing
```

### Compose deploy with inline content

```bash
hostctl run . docker.compose.deploy \
  --params '{"compose_content":"services:\n  web:\n    image: nginx\n","project":"demo"}'
```

### Swarm init

```bash
hostctl run . docker.swarm.init advertise_addr:10.0.0.10
```

### Swarm stack deploy

```bash
hostctl run . docker.swarm.stack.deploy \
  stack_name:edge \
  compose_path:/opt/stacks/edge/docker-compose.yml
```

### Registry login

```bash
hostctl run . docker.registry.login registry:ghcr.io username:monopod
```

## Task catalog

- `docker.compose.deploy`
- `docker.compose.down`
- `docker.compose.logs`
- `docker.compose.ps`
- `docker.compose.pull`
- `docker.compose.restart`
- `docker.registry.login`
- `docker.cleanup.prune`
- `docker.swarm.init`
- `docker.swarm.join`
- `docker.swarm.leave`
- `docker.swarm.token`
- `docker.swarm.stack.deploy`
- `docker.swarm.stack.rm`
- `docker.swarm.service.scale`
- `docker.swarm.service.update`
- `docker.swarm.service.logs`
- `docker.swarm.node.list`

## Publish

```bash
npm login
npm run build
npm publish --access public
```

Then run from the registry:

```bash
npx hostctl run hostctl-docker docker.compose.deploy compose_path:/opt/app/docker-compose.yml
```

## About

This package was scaffolded by `hostctl pkg create`. See
`docs/task-package-authoring.md` in the hostctl repository for guidance.
