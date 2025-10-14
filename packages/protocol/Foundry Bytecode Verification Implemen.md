# Foundry Bytecode Verification Implementation

## Overview

Rewrite the bytecode verification system to use Foundry builds while keeping the existing Truffle implementation. Key differences include Foundry's hashed library placeholders (`__$<hash>$__`) vs Truffle's name-based placeholders (`__LibraryName___...`), and different artifact structures.

## Implementation Steps

### 1. Create Foundry-specific Bytecode Utilities

**File**: `packages/protocol/lib/bytecode-foundry.ts`

Create new utility functions to handle Foundry's library linking format:

- `linkLibrariesFoundry()` - Replace `__$<hash>$__` placeholders with actual addresses
- `computeFoundryLibraryHash()` - Compute keccak256 hash: `keccak256("sourcePath:LibraryName").substring(2, 36)`
- `LibraryPositionsFoundry` class - Parse Foundry's hashed placeholders from bytecode
- `LibraryAddressesFoundry` class - Collect and manage library addresses from deployed bytecode
- Reuse existing `stripMetadata()` and `verifyAndStripLibraryPrefix()` from `lib/bytecode.ts`

Reference implementation from `scripts/foundry/make-release.ts` lines 541-585 for hash computation logic.

### 2. Create Foundry Artifact Loader

**File**: `packages/protocol/lib/foundry-artifacts.ts`

Implement functions to load and parse Foundry artifacts:

- `getFoundryBuildArtifacts()` - Load artifacts from `out-truffle-compat/` and `out-truffle-compat-0.8/`
- Parse Foundry artifact structure: `{ bytecode: { object }, deployedBytecode: { object }, metadata: { sources } }`
- Navigate Foundry's directory structure: `out/<ContractName>.sol/<ContractName>.json`
- Extract source file paths from artifact metadata for library hash computation

### 3. Create Foundry Verification Script

**File**: `packages/protocol/scripts/foundry/verify-bytecode.ts`

Main verification script with same interface as Truffle version:

- Command-line args: `--build_artifacts`, `--proposal`, `--initialize_data`, `--network`, `--librariesFile`, `--branch`
- Use Foundry profiles: `truffle-compat` (solc 0.5.13) and `truffle-compat8` (solc 0.8.19)
- Artifact directories: `out-truffle-compat/` and `out-truffle-compat-0.8/`
- Import verification logic from new `lib/compatibility/verify-bytecode-foundry.ts`
- Export library addresses to JSON file for debugging

### 4. Create Foundry Verification Logic

**File**: `packages/protocol/lib/compatibility/verify-bytecode-foundry.ts`

Port verification logic from `lib/compatibility/verify-bytecode.ts`:

- `verifyBytecodesFoundry()` - Main verification function using Foundry artifacts
- DFS traversal through contracts and their library dependencies
- Compare on-chain bytecode with compiled Foundry bytecode
- Handle Foundry library linking using hash-based placeholders
- Verify proxy deployments and storage proofs
- Validate initialization data for upgraded contracts
- Use Web3 provider for on-chain bytecode retrieval

### 5. Create Bash Wrapper Script

**File**: `packages/protocol/scripts/bash/verify-deployed-foundry.sh`

New bash script for Foundry verification:

- Accept same flags as original: `-b` (branch), `-n` (network), `-f` (forno), `-l` (log file)
- Build contracts using Foundry profiles: `forge build --profile truffle-compat` and `--profile truffle-compat8`
- Call `scripts/foundry/verify-bytecode.ts` instead of Truffle version
- Handle special cases (e.g., Mento core contracts) if needed
- Output to specified log file

### 6. Update Package Dependencies

**File**: `packages/protocol/package.json`

Ensure necessary dependencies are available:

- `viem` - For keccak256 and hex utilities (already used in make-release.ts)
- `ethers` or `web3` - For on-chain interaction
- Verify TypeScript configuration supports the new files

## Key Technical Details

### Foundry Library Hash Computation

```typescript
// From make-release.ts lines 570-572
const stringToHash = `${libSourceFilePath}:${libraryName}`
const hashed = keccak256(toHex(new TextEncoder().encode(stringToHash)))
const placeholderHash = hashed.substring(2, 2 + 34) // 34 chars
const placeholder = `__$${placeholderHash}$__`
```

### Foundry Artifact Structure

- Location: `out-truffle-compat/<Contract>.sol/<Contract>.json`
- Bytecode path: `artifact.deployedBytecode.object`
- Source files: `artifact.metadata.sources` (keys are file paths)

### Compatibility with Truffle

- Keep all existing Truffle verification code unchanged
- New Foundry system operates independently
- Both can coexist for gradual migration

## Files to Create

1. `packages/protocol/lib/bytecode-foundry.ts` (new)
2. `packages/protocol/lib/foundry-artifacts.ts` (new)
3. `packages/protocol/lib/compatibility/verify-bytecode-foundry.ts` (new)
4. `packages/protocol/scripts/foundry/verify-bytecode.ts` (new)
5. `packages/protocol/scripts/bash/verify-deployed-foundry.sh` (new)

## Files to Reference (Not Modify)

- `packages/protocol/lib/bytecode.ts` - Reuse metadata stripping
- `packages/protocol/lib/compatibility/verify-bytecode.ts` - Port logic from here
- `packages/protocol/scripts/truffle/verify-bytecode.ts` - Keep as-is
- `packages/protocol/scripts/bash/verify-deployed.sh` - Keep as-is
- `packages/protocol/scripts/foundry/make-release.ts` - Reference library linking
- `packages/protocol/foundry.toml` - Reference profile configurations
