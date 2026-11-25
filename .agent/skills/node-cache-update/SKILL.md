---
name: node-cache-update
description: Update GitHub Actions node module cache version when dependencies change. Use when modifying package.json, yarn.lock, adding/removing/updating npm packages, or changing node dependencies.
---

# Node Module Cache Update

When node dependencies are added, removed, or updated in this monorepo, the GitHub Actions cache must be invalidated to ensure CI builds use the correct dependencies.

## When to Update

Update the cache version when:
- Adding new dependencies to any `package.json`
- Removing dependencies from any `package.json`
- Updating dependency versions (including pinning versions)
- Modifying `yarn.lock`

## How to Update

1. Open `.github/workflows/celo-monorepo.yml`
2. Find the `NODE_MODULE_CACHE_VERSION` environment variable (around line 27)
3. Increment the version number by 1

```yaml
env:
  # Increment these to force cache rebuilding
  NODE_MODULE_CACHE_VERSION: 10  # <-- Increment this number
```

## Why This Matters

GitHub Actions caches `node_modules` based on this version number combined with `yarn.lock` hash. If you change dependencies but don't increment the cache version, CI may:
- Use stale cached dependencies
- Fail with missing module errors
- Have inconsistent behavior between local and CI builds
