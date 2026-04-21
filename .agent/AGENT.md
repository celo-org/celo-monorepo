# Celo Monorepo - Project Instructions

This is the Celo protocol monorepo containing core smart contracts and OP Stack L2 infrastructure tooling.

## Project Structure

- `packages/protocol/` - Core Solidity contracts (0.5.x and 0.8.x)
- `packages/protocol/contracts/` - Solidity 0.5.x contracts
- `packages/protocol/contracts-0.8/` - Solidity 0.8.x contracts
- `packages/protocol/scripts/` - Deployment and release scripts
- `packages/protocol/releaseData/` - Release artifacts (version reports, init data)
- `packages/op-tooling/` - OP Stack upgrade and operations tooling
- `.github/workflows/` - CI/CD pipelines

## Skills / Detailed Instructions

For complex tasks, refer to these detailed skill files:

### Contract Releases

**File:** `.agent/skills/celo-release/SKILL.md`

Use when: releasing contracts, testing releases on forks, generating governance proposals, or when mentioning release, deploy, upgrade contracts, CR14, CR15, make-release, or verify-deployed.

Quick reference:

1. `yarn release:verify-deployed:foundry` - Generate libraries.json
2. `yarn release:check-versions:foundry` - Generate version report
3. `yarn release:make:foundry` - Deploy contracts and create proposal

### Node Cache Updates

**File:** `.agent/skills/node-cache-update/SKILL.md`

Use when: modifying package.json, yarn.lock, adding/removing/updating npm packages, or changing node dependencies.

Quick reference: Increment `NODE_MODULE_CACHE_VERSION` in `.github/workflows/celo-monorepo.yml`

### Jovian Upgrade

**File:** `.agent/skills/run-jovian-upgrade/SKILL.md`

Use when: running Jovian upgrade locally, testing v4/v5/succinct-v2 upgrades on fork, op-deployer bootstrap, superchain-ops simulation, comparing contract state across upgrade phases, or when user mentions Jovian, v4.1.0, v5.0.0, succinct, OPSuccinct, upgrade pipeline.

Quick reference:

1. Fork L1 + Mock environment
2. Deploy implementations (v4, v5, Succinct v2)
3. Simulate via SuperchainOps
4. Sign via CeloSuperchainOps
5. Execute upgrades sequentially with x-ray checkpoints

## Key Files

| File                                                | Purpose                              |
| --------------------------------------------------- | ------------------------------------ |
| `packages/protocol/libraries.json`                  | Library addresses (network-specific) |
| `packages/protocol/.env.json`                       | Config including Celoscan API key    |
| `.env.mnemonic.*`                                   | Deployer keys per network            |
| `packages/protocol/releaseData/versionReports/`     | Contract change reports              |
| `packages/protocol/releaseData/initializationData/` | Constructor args for new contracts   |

## Networks

| Network      | L2 Chain ID | L1 Chain ID | L1 RPC URL                               | L2 RPC URL                                  |
| ------------ | ----------- | ----------- | ---------------------------------------- | ------------------------------------------- |
| Celo Mainnet | 42220       | 1           | https://eth-mainnet.g.alchemy.com/v2/... | https://forno.celo.org                      |
| Celo Sepolia | 11142220    | 11155111    | https://eth-sepolia.g.alchemy.com/v2/... | https://forno.celo-sepolia.celo-testnet.org |
| Celo Chaos   | -           | 11155111    | https://eth-sepolia.g.alchemy.com/v2/... | -                                           |

## Common Commands

```bash
# From packages/protocol/
yarn release:verify-deployed:foundry -b <TAG> -n <NETWORK>
yarn release:check-versions:foundry -a <OLD_TAG> -b <NEW_BRANCH> -r <REPORT_PATH>
yarn release:make:foundry -b <BRANCH> -k <KEY> -n <NETWORK> ...

# Decrypt deployer keys (cLabs employees)
yarn keys:decrypt
```

## Code Conventions

- Solidity 0.5.x for existing contracts in `contracts/`
- Solidity 0.8.x for new contracts in `contracts-0.8/`
- All upgradeable contracts use proxy pattern
- Version numbers follow `getVersionNumber()` convention

---

## Jovian Upgrade Ecosystem

The Jovian upgrade involves 6 repositories working together to upgrade Celo's OP Stack L1 contracts through a 3-phase pipeline: v4.1.0 → v5.0.0 → Succinct v2.

### Repository Dependency Map

| Repo                  | Role                                               | Required Branch/Tag                | Build Prerequisites            |
| --------------------- | -------------------------------------------------- | ---------------------------------- | ------------------------------ |
| **Celo** (this repo)  | Fork, mock, exec, verify scripts + x-ray dashboard | `main`                             | `anvil`, `cast`, `jq`, `forge` |
| **Optimism**          | v4 op-deployer binary + forge artifacts            | `op-deployer/v4.1.0`               | Go 1.23+, Forge >= 1.1.0       |
| **Optimism2**         | v5 op-deployer binary + forge artifacts            | `op-deployer/v5.0.0`               | Go 1.23+, Forge >= 1.2.3       |
| **SuperchainOps**     | Simulation templates for v4 + v5 tasks             | `release/v5.0.0`                   | Foundry, `just`, `mise`        |
| **CeloSuperchainOps** | EIP-712 signing for Gnosis Safe multisig           | `main`                             | `cast`, `eip712sign` binary    |
| **Succinct**          | OPSuccinct FDG game deployment                     | Correct commit with matching vkeys | Foundry, Rust/Cargo            |

### Build Requirements

**Optimism (v4)**:

```bash
cd $OP_ROOT_V4/op-deployer && just build
# Produces: op-deployer/bin/op-deployer (111MB)
# Requires: packages/contracts-bedrock/forge-artifacts/ (740 dirs)
```

**Optimism2 (v5)**:

```bash
cd $OP_ROOT_V5/op-deployer && just build
# Produces: op-deployer/bin/op-deployer (109MB)
# Requires: packages/contracts-bedrock/forge-artifacts/ (685 dirs)
```

**Succinct**:

```bash
cd $SUCCINCT_ROOT/contracts && forge build
# Also: just fetch-fdg-config .env.{network} eigenda
```

**SuperchainOps**:

```bash
cd $SUPERCHAIN_OPS_ROOT && mise install
# Pins Foundry, Go, Node versions
```

### Network Configuration Reference

#### Gnosis Safe Addresses

|                            | Mainnet                                      | Sepolia                                      | Chaos                                        |
| -------------------------- | -------------------------------------------- | -------------------------------------------- | -------------------------------------------- |
| **Parent Safe**            | `0x4092A77bAF58fef0309452cEaCb09221e556E112` | `0x009A6Ac23EeBe98488ED28A52af69Bf46F1C18cb` | `0x6F8DB5374003c9ffa7084d8b65c57655963766a9` |
| **cLabs Safe**             | `0x9Eb44Da23433b5cAA1c87e35594D15FcEb08D34d` | `0x769b480A8036873a2a5EB01FE39278e5Ab78Bb27` | -                                            |
| **Council Safe**           | `0xC03172263409584f7860C25B6eB4985f0f6F4636` | `0x3b00043E8C82006fbE5f56b47F9889a04c20c5d6` | -                                            |
| **Multisig (op-deployer)** | `0x4092A77bAF58fef0309452cEaCb09221e556E112` | `0x5e60d897Cd62588291656b54655e98ee73f0aabF` | `0x6F8DB5374003c9ffa7084d8b65c57655963766a9` |

#### Safe Architecture

**Mainnet (production)**:

- Parent (2-of-2): cLabs (6-of-8) + Council (6-of-8)
- Mocked: Parent (2-of-2): cLabs (2-of-2) + Council (2-of-2)

**Sepolia**: Simplified nested (Parent → cLabs + Council, 1-of-1 per Safe, mocked via `mock-sepolia.sh`)

**Chaos**: EOA ownership, mocked via `mock-sepolia.sh` to become Safe

#### Key Proxy Addresses

| Contract            | Mainnet                                      | Sepolia                                      |
| ------------------- | -------------------------------------------- | -------------------------------------------- |
| SystemConfig        | `0x89E31965D844a309231B1f17759Ccaf1b7c09861` | `0x760a5F022C9940f4A074e0030be682F560d29818` |
| DisputeGameFactory  | `0xFbAC162162f4009Bb007C6DeBC36B1dAC10aF683` | `0x57C45d82D1a995F1e135B8D7EDc0a6BB5211cfAA` |
| ProxyAdmin          | `0x783A434532Ee94667979213af1711505E8bFE374` | `0xF7d7A3d3bb8aBb6829249B3D3aD3d525D052027e` |
| AnchorStateRegistry | `0x9F18D91949731E766f294A14027bBFE8F28328CC` | `0xD73BA8168A61F3E917F0930D5C0401aA47e269D6` |
| SuperchainConfig    | `0x95703e0982140D16f8ebA6d158FccEde42f04a4C` | `0x31bEef32135c90AE8E56Fb071B3587de289Aaf77` |

#### Default Fork Block Numbers

| Network     | Block      | Description                              | Best for                                                     |
| ----------- | ---------- | ---------------------------------------- | ------------------------------------------------------------ |
| **Mainnet** | `24699169` | Before v4, v5, succ-v2 impls deployed    | Full flow: mocked signers, deploy all impls, execute all txs |
| **Mainnet** | `24742240` | After impls deployed, before execution   | Testing execution only with real deployed OPCM addresses     |
| **Sepolia** | `10459393` | Before ownership transfer                | Full flow: mock sepolia, transfer ownership, deploy, execute |
| **Sepolia** | `10462786` | After ownership fixed, before deployment | Deploy impls + execute txs                                   |
| **Chaos**   | `10382100` | Before ownership transfer                | Full flow: mock chaos, transfer ownership, deploy, execute   |
| **Chaos**   | `10382216` | After ownership fixed, before deployment | Deploy impls + execute txs                                   |

#### Version Parameters

| Parameter                | v4                                                                   | v5                                                                   |
| ------------------------ | -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| MIPS version             | 7                                                                    | 8                                                                    |
| Prestate hash            | `0x03eb07101fbdeaf3f04d9fb76526362c1eea2824e4c6e970bdb19675b72e4fc8` | `0x03caa1871bb9fe7f9b11217c245c16e4ded33367df5b3ccb2c6d0a847a217d1b` |
| PermissionedGame version | 1.7.0                                                                | 1.8.0                                                                |
| Upgrade target           | v4.1.0                                                               | v5.0.0                                                               |

### Default Mocked Accounts

These are test accounts safe for sharing and used in local fork testing:

| Role             | Address                                      | Private Key                                                          |
| ---------------- | -------------------------------------------- | -------------------------------------------------------------------- |
| cLabs Signer 1   | `0x865d05C8bB46E7AF16D6Dc99ddfb2e64BBec1345` | `0x57e639820c9154e011f46153bda6d502e1f8ebd376f87fadc1e317d3beeb10d8` |
| cLabs Signer 2   | `0x899a864C6bE2c573a98d8493961F4D4c0F7Dd0CC` | `0x5fb4edc777e9ad5889935f6cc0368a275be7f467b4b7eadf94cab92d667de592` |
| Council Signer 1 | `0x480C5f2340f9E7A46ee25BAa815105B415a7c2e2` | `0x82b0a6c773da129fc3604c6b85e68fa2c9cce0b21c3b63dd70b691e538269996` |
| Council Signer 2 | `0x8Af6f11c501c082bD880B3ceC83e6bB249Fa32c9` | `0x04cdae0aa51355d0bad6ec4e200138c71ca6686de3924382a048c9cbf38ddef9` |
| Anvil Default    | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |

### X-Ray Health Rules

The x-ray dashboard (`packages/op-tooling/x-ray/`) performs 6 automated health checks:

1. **ProxyAdminOwner type**: Must be Safe multisig, not EOA
2. **Admin consistency**: All proxied contracts must use the same ProxyAdmin
3. **Owner consistency**: Outlier detection against dominant owner
4. **Cross-reference validation**: Contract properties must point to expected addresses
5. **Re-deployment discovery (proxied)**: Auto-discovers new proxy addresses from cross-ref mismatches
6. **Re-deployment discovery (singletons)**: Same for non-proxied contracts

Plus **cross-network** paused state discrepancy detection.

Run locally: `cd packages/op-tooling/x-ray && python3 -m http.server 8080` then open `http://localhost:8080` and select "Localhost" tab.

### Upgrade Pipeline Timeline

```
Phase 1: Fork & Mock
  └─ fork_l1.sh → mock-mainnet.sh (or mock-sepolia.sh)

Phase 2: Deploy Implementations (all upfront)
  ├─ bootstrap v4 (Optimism repo)
  ├─ bootstrap v5 (Optimism2 repo)
  └─ deploy Succinct v2 game impl (Succinct repo, after vkeys finalized)

Phase 3: Simulate (SuperchainOps)
  ├─ simulate v4 (task 048)
  └─ simulate v5 (task 049)

Phase 4: Gather Signatures (CeloSuperchainOps)
  ├─ sign v4 (clabs + council)
  ├─ sign v5 (clabs + council)
  └─ sign succ-v2 (clabs + council)

Phase 5: Execute (sequential, with checkpoints)
  ├─ execute v4 → CHECKPOINT 1 (x-ray health check)
  ├─ execute v5 → CHECKPOINT 2 (x-ray health check)
  └─ execute succ-v2 → CHECKPOINT 3 (x-ray health check)
```
