# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Requirements

- [Node.js](https://nodejs.org/) (version 20 or above recommended)
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/)

## Installation

```bash
pnpm install
```

## Local Development

```bash
pnpm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
pnpm build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

Using SSH:

```bash
USE_SSH=true pnpm deploy
```

Not using SSH:

```bash
GIT_USER=<Your GitHub username> pnpm deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.

# NEW INSTALL WITH MAKEFILE

- install WSL2
- install Makefile on wsl2
- clone the repo on wsl2
- install gitkraken on wsl2
- install docker on wsl2
- run `make up` to start the development environment
- run `make pnpm install` to install the dependencies
- run `make pnpm start` to start the development server
- open the browser and go to http://localhost:3000
