# Vigil 🛡️

**An autonomous protocol risk monitoring and consequence execution system.**

This is a Turborepo monorepo containing the Vigil web dashboard and API.

## What's inside?

```shell
.
├── apps
│   ├── api                       # Vigil backend — FastAPI (Python). See apps/api/README.md.
│   └── web                       # Next.js dashboard (https://nextjs.org).
└── packages
    ├── @repo/eslint-config       # `eslint` configurations (includes `prettier`)
    ├── @repo/jest-config         # `jest` configurations
    ├── @repo/typescript-config   # `tsconfig.json`s used throughout the monorepo
    └── @repo/ui                  # Shareable stub React component library.
```

`apps/web` and `packages/*` are written in [TypeScript](https://www.typescriptlang.org/). `apps/api` is a standalone Python service — see [apps/api/README.md](apps/api/README.md) for its setup, architecture, and simulation suite.

### Utilities

This `Turborepo` has some additional tools already set for you:

- [TypeScript](https://www.typescriptlang.org/) for static type-safety
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting
- [Jest](https://jestjs.io) for testing

## Getting started

### 1. Install JS dependencies

```bash
pnpm install
```

### 2. Set up the Python API

```bash
cd apps/api
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
cd ../..
```

### 3. Run everything

```bash
pnpm dev
```

`turbo run dev` starts the Next.js dashboard (`apps/web`, port 3001) and the FastAPI backend (`apps/api`, port 8000 via `python3 main.py`) together. The API must have its virtualenv active on `PATH`, or you can run it separately with `cd apps/api && python main.py`.

### Commands

```bash
pnpm build   # Build all apps & packages with a `build` script
pnpm dev     # Run dev servers for all apps & packages with a `dev` script
pnpm test    # Run test suites for all apps & packages with a `test` script
pnpm lint    # Lint all apps & packages with a `lint` script
pnpm format  # Format .ts,.js,.json,.tsx,.jsx files
```

Note: `apps/api` has no `build` step (Python isn't compiled), so `pnpm build` only builds `apps/web` and `packages/*`.

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```bash
npx turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```bash
npx turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.dev/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.dev/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.dev/docs/reference/configuration)
- [CLI Usage](https://turborepo.dev/docs/reference/command-line-reference)
