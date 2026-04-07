# Celo Monorepo - AI Instructions

This is the Celo protocol monorepo containing core smart contracts and tooling.

## Project Structure

- `packages/protocol/` - Core Solidity contracts (0.5.x and 0.8.x)
- `packages/protocol/contracts/` - Solidity 0.5.x contracts
- `packages/protocol/contracts-0.8/` - Solidity 0.8.x contracts
- `packages/protocol/scripts/` - Deployment and release scripts
- `packages/protocol/releaseData/` - Release artifacts (version reports, init data)
- `.github/workflows/` - CI/CD pipelines

## Skills / Detailed Instructions

For complex tasks, refer to these detailed skill files:

### Contract Releases
**File:** `.cursor/skills/celo-release/SKILL.md`

Use when: releasing contracts, testing releases on forks, generating governance proposals, or when mentioning release, deploy, upgrade contracts, CR14, CR15, make-release, or verify-deployed.

Quick reference:
1. `yarn release:verify-deployed:foundry` - Generate libraries.json
2. `yarn release:check-versions:foundry` - Generate version report
3. `yarn release:make:foundry` - Deploy contracts and create proposal

### Node Cache Updates
**File:** `.cursor/skills/node-cache-update/SKILL.md`

Use when: modifying package.json, yarn.lock, adding/removing/updating npm packages, or changing node dependencies.

Quick reference: Increment `NODE_MODULE_CACHE_VERSION` in `.github/workflows/celo-monorepo.yml`

## Key Files

| File | Purpose |
|------|---------|
| `packages/protocol/libraries.json` | Library addresses (network-specific) |
| `packages/protocol/.env.json` | Config including Celoscan API key |
| `.env.mnemonic.*` | Deployer keys per network |
| `packages/protocol/releaseData/versionReports/` | Contract change reports |
| `packages/protocol/releaseData/initializationData/` | Constructor args for new contracts |

## Networks

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Celo Mainnet | 42220 | https://forno.celo.org |
| Celo Sepolia | 11142220 | https://forno.celo-sepolia.celo-testnet.org |

## Common Commands

```bash
# From packages/protocol/
yarn release:verify-deployed:foundry -b <TAG> -n <NETWORK>
yarn release:check-versions:foundry -a <OLD_TAG> -b <NEW_BRANCH>
yarn release:make:foundry -b <BRANCH> -k <KEY> -n <NETWORK> ...

# Decrypt deployer keys (cLabs employees)
yarn keys:decrypt
```

## Code Conventions

- Solidity 0.5.x for existing contracts in `contracts/`
- Solidity 0.8.x for new contracts in `contracts-0.8/`
- All upgradeable contracts use proxy pattern
- Version numbers follow `getVersionNumber()` convention
