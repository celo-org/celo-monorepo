# Celo Core Contracts Release Process (Foundry)

This document describes the release process for Celo Core Contracts using Foundry-based tooling.

## Table of Contents

- [Overview](#overview)
- [Versioning](#versioning)
- [GitHub Branching & Tagging](#github-branching--tagging)
- [Release Artifacts](#release-artifacts)
- [Release Commands](#release-commands)
- [Step-by-Step Release Process](#step-by-step-release-process)
- [Release Timeline](#release-timeline)
- [Testing & Verification](#testing--verification)
- [Governance Proposal](#governance-proposal)
- [Communication & Community](#communication--community)
- [Emergency Patches](#emergency-patches)
- [Troubleshooting](#troubleshooting)

## Overview

The Celo Core Contracts release process ensures that smart contract upgrades are deployed safely through proper versioning, testing, and governance procedures. This guide covers the Foundry-based tooling that replaces the legacy Truffle-based release scripts.

Core contract releases are rolled out via Celo's on-chain governance system, with approximately four major releases per year.

### Script Mapping (Truffle → Foundry)

| Truffle Command | Foundry Equivalent |
|-----------------|-------------------|
| `release:check-versions` | `release:check-versions:foundry` |
| `release:verify-deployed` | `release:verify-deployed:foundry` |
| `release:make` | `release:make:foundry` |
| `release:verify-release` | *(use verify-deployed with --proposal)* |

## Versioning

Each Celo core smart contract is versioned independently using **semantic versioning** with a custom extension:

| Version Type | Description |
|-------------|-------------|
| **STORAGE** | Incompatible storage layout changes |
| **MAJOR** | Incompatible ABI changes |
| **MINOR** | Added functionality (backwards compatible) |
| **PATCH** | Backwards-compatible bug fixes |

All deployed core contracts implement `getVersionNumber()` which returns `(storage, major, minor, patch)` encoded in Solidity source. Contracts deployed before versioning was added default to version `1.1.0.0`.

**Important**: If mixins or libraries change, all contracts using them are considered changed and must be redeployed in the next release.

## GitHub Branching & Tagging

### Branch Naming Convention

Release development happens on branches named:
```
release/core-contracts/${N}
```
Where `N` is the release version number (e.g., `release/core-contracts/14`).

## Release Artifacts

The release process generates and uses several important artifacts. Understanding these is crucial for a successful release.

### 1. `libraries.json` - Library Address Mapping

**What it is:** A JSON file containing the deployed addresses of all linked libraries on a network.

**How it's generated:** Automatically created by `release:verify-deployed:foundry` after successfully verifying on-chain bytecode.

**When to generate:**
```bash
# Generate libraries.json for Celo Sepolia
yarn release:verify-deployed:foundry -b core-contracts.v${PREVIOUS} -n celo-sepolia -f

# Generate libraries.json for Mainnet  
yarn release:verify-deployed:foundry -b core-contracts.v${PREVIOUS} -n celo -f
```

**Output location:** `./libraries.json` (in the `packages/protocol` directory)

**Example content:**
```json
{
  "Proposals": "0x38afc0dc55415ae27b81c24b5a5fbfe433ebfba8",
  "IntegerSortedLinkedList": "0x411b40a81a07fcd3542ce5b3d7e215178c4ca2ef",
  "AddressLinkedList": "0xd26d896d258e258eba71ff0873a878ec36538f8d",
  "Signatures": "0x69baecd458e7c08b13a18e11887dbb078fb3cbb4",
  "AddressSortedLinkedList": "0x4819ad0a0eb1304b1d7bc3afd7818017b52a87ab"
}
```

**Why it's needed:** The `release:make:foundry` script uses these addresses to link libraries when deploying new contract implementations.

### 2. Compatibility Report (`releaseData/versionReports/`)

**What it is:** A comprehensive JSON report comparing two contract versions, detailing all changes.

**How it's generated:** Created by `release:check-versions:foundry`.

**Report structure:**
```json
{
  "oldArtifactsFolder": ["out-core-contracts.v13"],
  "newArtifactsFolder": ["out-release_core-contracts_14"],
  "report": {
    "contracts": {
      "ContractName": {
        "changes": {
          "storage": [],           // Storage layout changes
          "major": [               // Breaking ABI changes
            {"type": "MethodRemoved", "signature": "..."}
          ],
          "minor": [],             // New functionality (backwards compatible)
          "patch": [               // Bytecode-only changes
            {"type": "DeployedBytecode"}
          ]
        },
        "versionDelta": {
          "storage": "=",          // No storage change
          "major": "+1",           // Major version should increment
          "minor": "0",            // Minor reset to 0
          "patch": "0"             // Patch reset to 0
        }
      }
    },
    "libraries": { ... }
  }
}
```

**Storage location:** `./releaseData/versionReports/release${N}-report.json`

### 3. Initialization Data (`releaseData/initializationData/`)

**What it is:** JSON file containing constructor/initialization arguments for newly deployed contracts.

**Location:** `./releaseData/initializationData/release${N}.json`

**Format:**
```json
{
  "ContractName": [arg1, arg2, arg3],
  "AnotherContract": ["0xAddress", 12345, true]
}
```

**When needed:** Only required when deploying contracts with storage-incompatible changes (new proxy) or entirely new contracts.

**Example with real data:**
```json
{
  "FeeHandler": [
    "0x000000000000000000000000000000000000ce10",
    "0xGoldTokenAddress",
    "0xExchangeAddress"
  ]
}
```

**Note:** If no new contracts need initialization, this file can be empty `{}`.

### 4. Governance Proposal JSON

**What it is:** The output from `release:make:foundry` containing all transactions needed for the governance proposal.

**Generated by:** `release:make:foundry -p ./proposal.json ...`

**Structure:**
```json
[
  {
    "contract": "ContractProxy",
    "function": "_setImplementation", 
    "args": ["0xNewImplementationAddress"],
    "value": "0"
  },
  {
    "contract": "Registry",
    "function": "setAddressFor",
    "args": ["ContractName", "0xNewProxyAddress"],
    "value": "0",
    "description": "Registry: ContractName -> 0x..."
  }
]
```

### Tagging Strategy

| Stage | Tag Format | Description |
|-------|-----------|-------------|
| Pre-audit | `core-contracts.v${N}.pre-audit` | First commit on release branch before audit |
| Final | `core-contracts.v${N}` | After successful deployment and governance |

### View Release Tags

```bash
yarn tags:view
```

### Compare Releases

To see PRs that changed smart contracts between releases:

```bash
yarn tags:compare release/core-contracts/13 release/core-contracts/14
```

## Release Commands

The following npm scripts are available in `packages/protocol` for the release process:

### 1. Check Versions (`release:check-versions:foundry`)

Compares contract versions between two branches/tags, checking storage layout, ABI compatibility, and bytecode changes. **This must be run before `make-release`.**

```bash
yarn release:check-versions:foundry \
  -a <old-branch-or-tag> \
  -b <new-branch-or-tag> \
  -r <path-to-report-output> \
  -l <path-to-log-file>
```

**Parameters:**
- `-a`: Old branch/tag containing the currently deployed contracts
- `-b`: New branch/tag containing the release candidate
- `-r`: (Optional) Path to write the compatibility report
- `-l`: (Optional) Path to append logs (default: `/tmp/celo-check-versions.log`)

**What it checks:**
- Storage layout compatibility (detects slot collisions)
- ABI changes (method additions, removals, signature changes)
- Bytecode differences
- Version number correctness (ensures bumps match change types)

**Example:**
```bash
yarn release:check-versions:foundry \
  -a core-contracts.v13 \
  -b release/core-contracts/14 \
  -r ./releaseData/versionReports/release14-report.json
```

**Expected output on success:**
```
Success! Actual version numbers match expected
Writing compatibility report to ./releaseData/versionReports/release14-report.json ...Done
```

**If version mismatch is detected:**
```
Version mismatch detected:
{
    "ContractName": {
        "actual": { "storage": 1, "major": 2, "minor": 0, "patch": 0 },
        "expected": { "storage": 1, "major": 3, "minor": 0, "patch": 0 }
    }
}
```

### 2. Verify Deployed Contracts (`release:verify-deployed:foundry`)

Verifies that on-chain bytecode matches the source code for a given branch/tag. **Also generates `libraries.json`.**

```bash
yarn release:verify-deployed:foundry \
  -b <branch-or-tag> \
  -n <network> \
  [-f] \
  [-l <log-file>]
```

**Parameters:**
- `-b`: Branch/tag containing the smart contracts to verify
- `-n`: Network to verify against (`celo`, `celo-sepolia`)
- `-f`: (Optional) Use Forno service to connect to the network
- `-l`: (Optional) Path to append logs

**What it does:**
1. Builds contracts from the specified branch using Foundry
2. Fetches all contract addresses from the on-chain Registry
3. Compares on-chain bytecode against locally compiled bytecode
4. **Writes linked library addresses to `libraries.json`**

**Example:**
```bash
# Verify on Celo Sepolia testnet (generates libraries.json for Celo Sepolia)
yarn release:verify-deployed:foundry -b core-contracts.v13 -n celo-sepolia -f

# Verify on Mainnet (generates libraries.json for Mainnet)
yarn release:verify-deployed:foundry -b core-contracts.v13 -n celo -f
```

**Expected output:**
```
Writing logs to /tmp/celo-verify-deployed.log
 - Checkout contracts source code at core-contracts.v13
 - Build contract artifacts at out-core-contracts.v13-truffle-compat
...
Success, no bytecode mismatches found!
Writing linked library addresses to libraries.json
```

### 3. Make Release (`release:make:foundry`)

Builds, deploys new contract implementations, and generates a governance proposal JSON.

```bash
yarn release:make:foundry \
  -b <branch-or-tag> \
  -k <private-key> \
  -i <initialization-data-path> \
  -l <libraries-json-path> \
  -n <network> \
  -p <proposal-output-path> \
  -r <compatibility-report-path>
```

**Parameters:**
- `-b`: Branch/tag to build and deploy from
- `-k`: Private key for signing deployment transactions
- `-i`: Path to initialization data JSON (e.g., `./releaseData/initializationData/release14.json`)
- `-l`: Path to library address mappings (`libraries.json`) - **must be generated first!**
- `-n`: Network to deploy to (`celo`, `celo-sepolia`)
- `-p`: Path to write the governance proposal JSON output
- `-r`: Path to the compatibility report from `check-versions` - **must be generated first!**

**Prerequisites:**
1. Run `release:check-versions:foundry` to generate the compatibility report
2. Run `release:verify-deployed:foundry` to generate `libraries.json`
3. Create/update initialization data in `releaseData/initializationData/`

**Example:**
```bash
# Deploy to Celo Sepolia
yarn release:make:foundry \
  -b release/core-contracts/14 \
  -k $DEPLOYER_PRIVATE_KEY \
  -i ./releaseData/initializationData/release14.json \
  -l ./libraries.json \
  -n celo-sepolia \
  -p ./proposal-celo-sepolia.json \
  -r ./releaseData/versionReports/release14-report.json
```

**What it does:**
1. Reads the compatibility report to determine which contracts need deployment
2. Deploys new library implementations (if libraries changed)
3. Deploys new contract implementations
4. Deploys new proxies (only for storage-incompatible changes)
5. Generates governance proposal transactions
6. Writes proposal JSON to the specified output path

### 4. Check Opcodes (`release:check-opcodes`)

Scans core contracts for unsafe opcodes (`selfdestruct`, `delegatecall`).

```bash
yarn release:check-opcodes
```

**Run this before any release to ensure no unsafe patterns were introduced.**

**Expected output:**
```
Core contracts are safe against selfdestruct+delegatecall vulnerabilities
```

### 5. Determine Release Version (`release:determine-release-version`)

Outputs the release version number from a branch name.

```bash
yarn release:determine-release-version
```

### 6. Build & Test Commands

```bash
# Build contracts with Foundry
yarn build:foundry

# Run all Foundry tests  
yarn test

# Run specific test file
forge test --match-path test/SomeContract.t.sol -vvv

# Clean build artifacts
yarn clean:foundry
```

### 7. Tag Management

```bash
# View all release tags
yarn tags:view

# Compare changes between releases
yarn tags:compare release/core-contracts/13 release/core-contracts/14
```

## Step-by-Step Release Process

### Phase 1: Preparation

1. **Create Release Branch**
   ```bash
   git checkout master
   git pull origin master
   git checkout -b release/core-contracts/${N}
   ```

2. **Check for Unsafe Opcodes**
   ```bash
   yarn release:check-opcodes
   ```
   Ensure no `selfdestruct` or `delegatecall` in core contracts.

3. **Tag Pre-Audit Commit**
   ```bash
   git tag core-contracts.v${N}.pre-audit
   git push origin core-contracts.v${N}.pre-audit
   ```

4. **Create GitHub Pre-Release**
   - Navigate to GitHub Releases
   - Create a new pre-release pointing to `core-contracts.v${N}.pre-audit`
   - Include release notes and audit submission details

5. **Submit for Audit**
   - Create GitHub issue tracking audit progress
   - Submit code to auditors
   - Draft initial release notes

### Phase 2: Version Check & Report Generation

1. **Generate Compatibility Report**
   ```bash
   yarn release:check-versions:foundry \
     -a core-contracts.v$((N-1)) \
     -b release/core-contracts/${N} \
     -r ./releaseData/versionReports/release${N}-report.json
   ```
   
   **Output:** `./releaseData/versionReports/release${N}-report.json`

2. **Review the Report**
   
   Check the generated report for:
   - **Storage changes**: Any `storage: []` that's not empty requires STORAGE version bump
   - **Major changes**: Method removals/signature changes require MAJOR bump
   - **Minor changes**: New methods require MINOR bump
   - **Patch changes**: Bytecode-only changes require PATCH bump
   
   The script will fail if version numbers don't match expected changes.

3. **Prepare Initialization Data**
   
   Create/update `./releaseData/initializationData/release${N}.json`:
   
   ```bash
   # Check previous release for format reference
   cat ./releaseData/initializationData/release$((N-1)).json
   ```
   
   Add initialization arguments for any contracts with storage-breaking changes:
   ```json
   {
     "NewContract": ["0xRegistryAddress", 1000, true]
   }
   ```
   
   If no new contracts need initialization, create an empty file:
   ```json
   {}
   ```

### Phase 3: Testnet Deployment (Celo Sepolia)

1. **Generate Library Addresses for Celo Sepolia**
   ```bash
   yarn release:verify-deployed:foundry \
     -b core-contracts.v$((N-1)) \
     -n celo-sepolia \
     -f
   ```
   
   **Output:** `./libraries.json` (contains Celo Sepolia library addresses)
   
   > **Important:** This step verifies the previous release matches on-chain bytecode AND generates the `libraries.json` needed for deployment.

2. **Deploy to Celo Sepolia**
   ```bash
   yarn release:make:foundry \
     -b release/core-contracts/${N} \
     -k $CELO_SEPOLIA_DEPLOYER_KEY \
     -i ./releaseData/initializationData/release${N}.json \
     -l ./libraries.json \
     -n celo-sepolia \
     -p ./proposal-celo-sepolia.json \
     -r ./releaseData/versionReports/release${N}-report.json
   ```
   
   **Outputs:**
   - New contract implementations deployed on Celo Sepolia
   - `./proposal-celo-sepolia.json` containing governance transactions

3. **Submit Governance Proposal on Celo Sepolia**
   
   Use `celocli` to submit the proposal:
   ```bash
   celocli governance:propose \
     --jsonTransactions ./proposal-celo-sepolia.json \
     --deposit 100e18 \
     --from $PROPOSER_ADDRESS \
     --node https://forno.celo-sepolia.celo-testnet.org
   ```
   
   Note the proposal ID from the output.

4. **Announce on Community Channels**
   - Post on Celo Forum (Governance category)
   - Announce on Discord `#governance` channel
   - Include: proposal ID, GitHub release link, audit report link

5. **Manual Testing on Celo Sepolia**
   
   After governance executes, manually verify:
   - [ ] CELO transfers work correctly
   - [ ] Account registration succeeds
   - [ ] Oracle price reporting functions
   - [ ] Escrow operations complete
   - [ ] Validator registration/deregistration works
   - [ ] Election voting functions
   - [ ] Governance proposal creation works
   - [ ] Locked gold operations work

### Phase 4: Mainnet Deployment

1. **Generate Library Addresses for Mainnet**
   ```bash
   yarn release:verify-deployed:foundry \
     -b core-contracts.v$((N-1)) \
     -n celo \
     -f
   ```
   
   **Output:** `./libraries.json` (now contains Mainnet library addresses)
   
   > **Warning:** This overwrites the previous `libraries.json`. The Mainnet libraries will have different addresses than Celo Sepolia.

2. **Deploy to Mainnet**
   ```bash
   yarn release:make:foundry \
     -b release/core-contracts/${N} \
     -k $MAINNET_DEPLOYER_KEY \
     -i ./releaseData/initializationData/release${N}.json \
     -l ./libraries.json \
     -n celo \
     -p ./proposal-mainnet.json \
     -r ./releaseData/versionReports/release${N}-report.json
   ```
   
   **Outputs:**
   - New contract implementations deployed on Mainnet
   - `./proposal-mainnet.json` containing governance transactions

3. **Submit Mainnet Governance Proposal**
   
   ```bash
   celocli governance:propose \
     --jsonTransactions ./proposal-mainnet.json \
     --deposit 10000e18 \
     --from $PROPOSER_ADDRESS \
     --node https://forno.celo.org
   ```
   
   > **Best Practice:** Submit on Tuesday to allow full governance cycle before weekend.

4. **Update Community**
   - Update Forum thread with Mainnet proposal ID
   - Announce on Discord

### Phase 5: Finalization

After governance proposal executes successfully:

1. **Verify Mainnet Deployment**
   ```bash
   yarn release:verify-deployed:foundry \
     -b release/core-contracts/${N} \
     -n celo \
     -f
   ```

2. **Merge Release Branch** (use merge commit, not squash)
   ```bash
   git checkout master
   git merge --no-ff release/core-contracts/${N}
   git push origin master
   ```

3. **Create Final Tag**
   ```bash
   git tag core-contracts.v${N}
   git push origin core-contracts.v${N}
   ```

4. **Update CircleCI Config**
   - Update `RELEASE_TAG` in `.circleci/config.yml`

5. **Create GitHub Release**
   - Point to `core-contracts.v${N}` tag
   - Include:
     - Final release notes
     - Link to audit report
     - Links to governance proposals (Celo Sepolia and Mainnet)
     - Summary of changes

6. **Archive Release Artifacts**
   - Commit the version report to `releaseData/versionReports/`
   - Commit initialization data to `releaseData/initializationData/`

## Release Timeline

| Day | Action |
|-----|--------|
| **T (Tuesday)** | Create GitHub issue, cut release branch, submit to auditor, draft release notes |
| **T + 1 week** | Audit report arrives, finalize release notes, commit fixes, tag first release candidate, announce on Forum and Discord |
| **T + 2 weeks** | Deploy to Celo Sepolia testnet, submit governance proposal, update Forum/Discord |
| **T + 3 weeks** | Monitor testnet governance, manual testing, address any issues |
| **T + 4 weeks** | Deploy to Mainnet, submit governance proposal, notify community |

### Governance Timeline

Once a proposal is submitted, the typical timeline is:
- **24 hours**: Dequeue period
- **24 hours**: Approval period
- **5 days**: Referendum voting period
- **Up to 3 days**: Execution window

Total: ~8-10 days from proposal submission to execution

## Testing & Verification

### Unit Tests

```bash
# Run all Foundry tests
yarn test

# Run specific test file
forge test --match-path test/SomeContract.t.sol

# Run with verbosity for debugging
forge test -vvv
```

### Integration Tests

```bash
# Start local anvil devchain (L2)
yarn anvil-devchain:start-L2

# Run integration tests
yarn anvil-devchain:integration-tests

# Run E2E tests
yarn anvil-devchain:e2e-tests
```

### Verification Checks

The `release:check-versions:foundry` script performs:
- Storage layout compatibility checks
- ABI compatibility verification
- Bytecode change detection
- Version number validation

### Manual Testing Checklist

After deploying to Celo Sepolia:
- [ ] CELO transfers work correctly
- [ ] Account registration succeeds
- [ ] Oracle price reporting functions
- [ ] Escrow operations complete
- [ ] Validator registration/deregistration works
- [ ] Election voting functions
- [ ] Governance proposal creation works

## Governance Proposal

### Proposal JSON Structure

The `release:make:foundry` script generates a JSON file containing governance proposal transactions:

```json
[
  {
    "contract": "ContractProxy",
    "function": "_setImplementation",
    "args": ["0x...newImplementationAddress"],
    "value": "0"
  },
  {
    "contract": "Registry",
    "function": "setAddressFor",
    "args": ["ContractName", "0xNewProxyAddress"],
    "value": "0",
    "description": "Registry: ContractName -> 0x..."
  }
]
```

### Transaction Types

| Type | When Used | Function |
|------|-----------|----------|
| `_setImplementation` | Implementation-only changes | Points proxy to new implementation |
| `_setAndInitializeImplementation` | New proxy with initialization | Sets implementation and calls initialize |
| `setAddressFor` | New proxy deployment | Updates Registry to point to new proxy |

### Submitting with celocli

**Celo Sepolia:**
```bash
celocli governance:propose \
  --jsonTransactions ./proposal-celo-sepolia.json \
  --deposit 100e18 \
  --descriptionURL "https://github.com/celo-org/celo-monorepo/releases/tag/core-contracts.v${N}" \
  --from $PROPOSER_ADDRESS \
  --useLedger \
  --node https://forno.celo-sepolia.celo-testnet.org
```

**Mainnet:**
```bash
celocli governance:propose \
  --jsonTransactions ./proposal-mainnet.json \
  --deposit 10000e18 \
  --descriptionURL "https://github.com/celo-org/celo-monorepo/releases/tag/core-contracts.v${N}" \
  --from $PROPOSER_ADDRESS \
  --useLedger \
  --node https://forno.celo.org
```

### Monitoring Proposal Status

```bash
# View proposal details
celocli governance:show --proposalID <ID> --node <RPC_URL>

# View all proposals
celocli governance:list --node <RPC_URL>
```

### Governance Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Dequeue | 24 hours | Proposal enters queue |
| Approval | 24 hours | Approvers vote to advance |
| Referendum | 5 days | Token holders vote |
| Execution | Up to 3 days | Proposal can be executed |

**Total time from submission to execution: ~8-10 days**

## Communication & Community

### Required Communications

#### 1. Forum Post (at least 1 week before Celo Sepolia proposal)

Create a post in the [Celo Forum Governance category](https://forum.celo.org/c/governance/) with:

**Required Information:**
- Proposer name and background
- Summary of changes (what contracts are affected and why)
- Link to GitHub release branch/tag
- Link to audit report
- Link to compatibility report
- Expected timeline for Celo Sepolia and Mainnet

**Template:**
```markdown
# Core Contracts Release ${N}

## Summary
Brief description of what this release includes.

## Changes
- Contract A: Description of changes (MAJOR version bump)
- Contract B: Description of changes (PATCH version bump)
- ...

## Links
- GitHub Release: [link]
- Audit Report: [link]  
- Compatibility Report: [link]

## Timeline
- Celo Sepolia Proposal: [date]
- Mainnet Proposal: [date] (pending successful testnet deployment)

## Testing
Description of testing performed.
```

#### 2. Discord Announcements (`#governance` channel)

**When to post:**
- Release candidate announcement (when branch is cut)
- Celo Sepolia proposal submitted (include proposal ID)
- Mainnet proposal submitted (include proposal ID)
- Governance execution complete

#### 3. Continuous Updates

- Respond to community questions on Forum thread
- Post updates if timeline changes
- Announce any issues discovered during testing

## Emergency Patches

For urgent fixes between regular releases:

1. **Cherry-pick from Last Release**
   ```bash
   git checkout -b hotfix/core-contracts/${N}.1 core-contracts.v${N}
   git cherry-pick <commit-hash>
   ```

2. **Expedited Process**
   - Versioning still required (at minimum PATCH bump)
   - Expedited audit for critical fixes
   - Faster governance timeline may be requested

3. **Documentation**
   - Document urgency and rationale
   - Link to fix commit and any related issues

## Troubleshooting

### Build Issues

```bash
# Clean all Foundry artifacts and rebuild
yarn clean:foundry
yarn build:foundry

# If submodules are missing
yarn submodules:pull
```

### Version Check Failures

**"Version mismatch detected"**

The `release:check-versions:foundry` script compares actual version numbers in contracts against expected versions based on detected changes.

1. Open the generated report and check the `versionDelta` for each contract
2. In the contract's Solidity file, update `getVersionNumber()` to match expected values
3. Re-run the check

**Example fix:**
```solidity
// Before (incorrect)
function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 0, 0);
}

// After (correct - major change detected)
function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 2, 0, 0);  // Incremented major version
}
```

### Missing libraries.json

**Error:** `libraries.json not found` or `Library address not found`

**Solution:** Run verify-deployed first to generate libraries.json:
```bash
yarn release:verify-deployed:foundry -b core-contracts.v${PREVIOUS} -n <network> -f
```

### Bytecode Verification Failures

**"Bytecode mismatch for ContractName"**

Possible causes:
1. **Wrong branch**: Ensure `-b` flag points to the correct release tag
2. **Compiler version mismatch**: Check `foundry.toml` settings match deployment
3. **Library address mismatch**: Regenerate `libraries.json`
4. **Optimizer settings**: Ensure Foundry profile matches original compilation

**Debug steps:**
```bash
# Check which profile was used
cat foundry.toml | grep -A 10 "\[profile"

# Rebuild with specific profile
FOUNDRY_PROFILE=truffle-compat forge build
```

### Deployment Failures

**"Insufficient funds"**
- Ensure deployer account has enough CELO for gas
- Mainnet deployments can cost significant gas

**"Nonce too low"**
- Wait for pending transactions to confirm
- Or use a fresh deployer account

**"Contract deployment failed"**
- Check gas limit (default is 20M)
- Verify constructor arguments in initialization data
- Check network connectivity

### Governance Proposal Issues

**"Deposit too low"**
- Celo Sepolia: minimum 100 CELO
- Mainnet: minimum 10,000 CELO

**"Invalid transaction format"**
- Verify proposal JSON structure matches expected format
- Check contract names match Registry entries

### Network Connectivity

**"Could not connect to network"**

Use Forno endpoints with the `-f` flag:
```bash
yarn release:verify-deployed:foundry -b <branch> -n celo-sepolia -f
```

Or set custom RPC:
```bash
export RPC_URL=https://your-custom-rpc.com
```

### Common Gotchas

1. **libraries.json is network-specific**: Always regenerate when switching between Celo Sepolia and Mainnet

2. **Report must be generated before make-release**: The compatibility report tells make-release which contracts need deployment

3. **Empty initialization data is valid**: If no new contracts need initialization, use `{}`

4. **Merge with --no-ff**: Always use merge commits (not squash) to preserve release history

5. **Order matters**:
   ```
   check-versions → verify-deployed → make-release → governance
   ```

## Additional Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [Celo Governance Documentation](https://docs.celo.org/protocol/governance)
- [Release Data Directory](./releaseData/README.md)
- [Test Documentation](./test-sol/README.md)

## Networks

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Celo Mainnet | 42220 | https://forno.celo.org |
| Celo Sepolia | 11142220 | https://forno.celo-sepolia.celo-testnet.org |

## Environment Variables

For convenience, set these environment variables:

```bash
# Deployer keys (keep secure!)
export CELO_SEPOLIA_DEPLOYER_KEY="0x..."
export MAINNET_DEPLOYER_KEY="0x..."

# Optional: Custom RPC URLs
export RPC_URL="https://forno.celo.org"
```

---

*This document covers the Foundry-based release process. For legacy Truffle-based tooling, see the original scripts in `scripts/bash/`.*
