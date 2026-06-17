# Solidity 0.5.x → 0.8.x Migration — Granular Feature Plan

Target: port all `contracts/` (0.5.x) into `contracts-0.8/` at solc **0.8.19** (EVM `paris`, matches `truffle-compat8`).
End state: `contracts/` empty of implementations, single 0.8 build profile, all tests green, storage byte-identical for every proxy.

Branch: `feat/migrate-contracts-0.8` off `master`. Delivery: phased per-domain commits, each phase green before next.

## Legend

- **Task ID** `P<phase>.<n>` — trackable unit.
- **Storage gate** = `forge inspect <C> storage-layout` (profile `truffle-compat8`) diff vs Phase 0 baseline == empty.
- **Test gate** = relevant `test-sol/unit/<domain>` suite green under default profile.
- Mechanical 0.8 fixes (apply to every ported file, abbreviated **MECH** below):
  - drop `import ".../SafeMath.sol"` + `using SafeMath`
  - `now` → `block.timestamp`
  - `byte` → `bytes1`
  - assembly `gas` → `gasleft()`, `calldatasize`/`returndatasize`/`codesize` → add `()`
  - explicit visibility on all library/functions
  - OZ imports `openzeppelin-solidity/...` → `@openzeppelin/contracts8/...` (v4.9 paths)
  - `solidity-bytes-utils/` → `solidity-bytes-utils-8/`
  - `address(uint160(x))` casts → `payable(address(uint160(x)))` where payable needed
  - pragma → `pragma solidity >=0.8.7 <0.8.20;`
  - add to `SOLIDITY_08_PACKAGE.contracts` / `.proxyContracts` in `contractPackages.ts`

---

## PHASE 0 — Safety Net & Baseline (blocking, no porting)

| ID | Task | Files / Output | Done when |
|----|------|----------------|-----------|
| P0.1 | Snapshot deployed 0.5 storage layout for every upgradeable impl | `releaseData/storageLayouts/0.5-baseline/<C>.json` via `FOUNDRY_PROFILE=truffle-compat forge inspect <C> storage-layout` | All ~30 impls + libs snapshotted, committed |
| P0.2 | Record green baseline of compatibility gate | run `test-ts/compatibility/ast-layout.ts`, `verify-bytecode`, full `yarn test` on master | Baseline output captured in `MIGRATION.md` notes |
| P0.3 | Build per-contract inventory table | append to this file (table below) | Every 0.5 file classified + risk-flagged |
| P0.4 | Decide shared-base mapping (0.5 base → reuse-existing-0.8 / new-0.8-variant) | base-mapping table below | Reviewed + signed off |
| P0.5 | Confirm version-number policy for recompile-only upgrades | check `check-backward.ts` expectations; doc rule | Rule written (storage-major unchanged) |
| P0.6 | Stand up storage-diff helper script | `scripts/foundry/storage-diff.sh <C>` (inspect 0.8 build, diff vs baseline JSON) | Returns nonzero on any layout drift |

**Base-mapping table — VERIFIED via `forge inspect` storage-layout (P0.4 done):**

| 0.5 base | 0.8 target | Verified verdict | Action |
|----------|------------|------------------|--------|
| `Initializable` (`contracts/common/Initializable.sol`) | same file (pragma `>=0.5.13 <0.9.0`) | MATCH — `bool initialized` slot 0 | **reuse same file**, no copy |
| `Ownable` OZ v2.5 | OZ v4.9 `@openzeppelin/contracts8/access/Ownable` | MATCH — `address _owner` slot 0 in both | use OZ8; **verify init path** (v4.9 ctor sets owner — proxies must `initialize`+`_transferOwnership`, no behavior reliance on ctor) |
| `ReentrancyGuard` (`contracts/common/libraries/ReentrancyGuard.sol`, pragma `<0.8.20`) | **keep 0.5-style file** (compiles under 0.8.19) | DIFFERS name-only (`_guardCounter` vs `ReentrancyGuard08._status`); same 1-slot footprint | **DO NOT switch to ReentrancyGuard08** — migrated `Validators` already inherits the 0.5 file; keep it to guarantee identical layout |
| `UsingRegistry` | `contracts-0.8/common/UsingRegistry` | MATCH — `_owner` slot0, `registry` slot1 (Mento refs removed but no storage delta) | reuse 0.8 version |
| `UsingRegistryV2` | `UsingRegistryV2NoMento` | MATCH — both **zero storage** (all consts) | reuse NoMento variant |
| `UsingPrecompiles` | `contracts-0.8/.../UsingPrecompiles` | MATCH — zero storage | reuse |
| `FixidityLib` | port (P1.1) | no storage | port |
| linked-lists | several exist in 0.8 | no storage | reuse/port gaps |

**Load-bearing layout fact (from `Validators` 0.8):** inherited prefix is `_owner`(s0) → `_guardCounter`(s1) → `initialized`(s2.0) **packed with** `registry`(s2.1, address) → impl vars from s3. Any migrated contract MUST reproduce this exact inheritance chain order (`Ownable, ReentrancyGuard, Initializable, UsingRegistry`) or storage shifts. The storage gate (P0.6) catches drift.

**Gate:** P0.1–P0.6 complete + base-mapping reviewed → unlock Phase 1.

---

## PHASE I — Interfaces (runs alongside P1; mostly trivial)

68 interface files. 61 already compile under 0.8 (`>=0.5.13 <0.9.0`). Strategy: keep interfaces resolvable from a single tree; since 32 `contracts-0.8` files already import them from `contracts/`, interfaces move/copy into `contracts-0.8/*/interfaces/` and the 32 importers + remappings repoint.

| ID | Task | Files | Done when |
|----|------|-------|-----------|
| PI.1 | Bump pragma `^0.5.13` → `>=0.5.13 <0.9.0` on the 4 stragglers | `IStableTokenMento`, `stability/IBreakerBox`, `uniswap/IUniswapV2Router02`, `uniswap/IUniswapV2RouterMin` | compile under 0.8 |
| PI.2 | Resolve 2 duplicates (already in 0.8 tree) | `IScoreManager`, `IWETH` | single canonical copy, no double-definition |
| PI.3 | Move all interfaces into `contracts-0.8/*/interfaces/` preserving structure | 66 remaining | present in 0.8 tree |
| PI.4 | Repoint 32 `contracts-0.8` importers from `../../contracts/.../interfaces` / `@celo-contracts/` → local 0.8 path | importer list (see Appendix B.2) | no import resolves into 0.5 tree |
| PI.5 | Update `remappings.txt` once 0.5 tree empties | `@celo-contracts` repoint/remove | builds green |

**Gate:** `forge build` default + `truffle-compat8` green; no `contracts-0.8` file imports from `contracts/`.

---

## PHASE 1 — Shared Libraries & Bases (Tier 1)

No proxy storage of their own; everything downstream inherits → must land first.

| ID | Contract | Notes / breaking patterns | Gate |
|----|----------|---------------------------|------|
| P1.1 | `FixidityLib` | MECH; pure math lib | builds + `FixidityLib` test |
| P1.2 | `SafeMathMem` | likely DELETE (native checked) — confirm no callers | grep callers == 0 |
| P1.3 | linked-lists: `LinkedList`,`SortedLinkedList`,`SortedLinkedListWithMedian`,`IntegerSortedLinkedList`,`AddressSortedLinkedList`,`AddressSortedLinkedListWithMedian` | several already in 0.8 — port only gaps; MECH | linked-list tests green |
| P1.4 | `Heap` | uses FixidityLib; MECH | builds |
| P1.5 | `Signatures` | assembly `mstore`/`keccak256`; ECDSA via OZ8 | signature test green |
| P1.6 | `ExtractFunctionSignature` | `byte`→`bytes1`, bitwise on `bytes4` | unit test green |
| P1.7 | `ReentrancyGuard` (0.5 file) | **keep, do NOT swap to ReentrancyGuard08** (P0.4 verdict) — already compiles `<0.8.20`; preserves `_guardCounter` layout | builds + reentrancy tests |
| P1.8 | `Create2` | assembly `create2`; `address(uint160(...))` | unit test |
| P1.9 | `ExternalCall` | low-level call MECH | builds |
| P1.10 | `CalledByVm`,`Permissioned` | small mixins MECH | builds |

**Gate:** `forge build --profile truffle-compat8` clean for all above + existing 0.8 contracts still build; relevant lib tests green.

---

## PHASE 2 — Common Implementations (Tier 2, proxy-backed)

Each task: port body + MECH + **storage gate (P0.1 diff)** + test gate. Order matters (bases before dependents).

| ID | Contract | Specific risk | Storage-bearing |
|----|----------|---------------|-----------------|
| P2.1 | `UsingRegistry` / `UsingRegistryV2` / `UsingRegistryV2BackwardsCompatible` | Mento ref decision (P0.4); inherited slot order | yes (mixin slots) |
| P2.2 | `UsingPrecompiles` | precompile `staticcall` assembly | minimal |
| P2.3 | `Registry` | core lookup; `onlyOwner` | yes |
| P2.4 | `Freezable` / `Freezer` | mixin + impl | yes |
| P2.5 | `Blockable` | assembly storage-slot read (lines ~41-54) | slot-based |
| P2.6 | `Accounts` (1.1k LOC) | assembly blocks, signatures, big storage map | yes — **high care** |
| P2.7 | `GoldToken` | ERC20 + native; `.transfer` | yes |
| P2.8 | `FeeCurrencyWhitelist` | simple list | yes |
| P2.9 | `FeeHandler` (799 LOC) | FixidityLib, `now`, sellers wiring | yes |
| P2.10 | `FeeHandlerSeller`,`MentoFeeHandlerSeller`,`UniswapFeeHandlerSeller` | Mento/Uniswap interface refs | yes |
| P2.11 | `MultiSig` / `Proxy`-side | low-level call assembly | yes |
| P2.12 | `Proxy` / `InitializableProxy` / `ProxyCloneFactory` / `ProxyFactory` | **delegatecall `gas`→`gasleft()`**, EIP-1167 bytecode, dispatch behavior | proxy slots — **highest assembly risk** |

**Gate per contract:** empty storage diff + its `test-sol/unit/common` subset green. Phase gate: full `common` suite green.

---

## PHASE 3 — Governance (Tier 3, largest & heaviest)

Sub-order: libs → slashers → locked-gold → election/rewards → governance → release-gold.

| ID | Contract | LOC | Specific risk |
|----|----------|-----|---------------|
| P3.1 | `Proposals` (lib) | 370 | `now`, assembly, BytesLib(`solidity-bytes-utils-8`) |
| P3.2 | `SlasherUtil` | — | base for slashers |
| P3.3 | `GovernanceSlasher` | — | storage gate |
| P3.4 | `DoubleSigningSlasher` | — | precompiles |
| P3.5 | `DowntimeSlasher` | 317 | SafeMath, bitmaps |
| P3.6 | `BlockchainParameters` | — | simple params |
| P3.7 | `LockedGold` (946) | 946 | `now`, FixidityLib, linked-list of accounts, big storage |
| P3.8 | `Election` (1240) | 1240 | SafeMath-heavy, FixidityLib, sorted linked-lists, complex structs — **high care** |
| P3.9 | `EpochRewards` (541) | 541 | `now`, FixidityLib, precompiles |
| P3.10 | `Governance` (1699) | 1699 | largest; `now`, SafeMath, FixidityLib, integer-sorted-list, ReentrancyGuard, Proposals lib — **highest care** |
| P3.11 | `GovernanceApproverMultiSig` | — | multisig variant |
| P3.12 | `ReleaseGold` (766) + `ReleaseGoldMultiSig` | 766 | `now`, vesting math, FixidityLib |

**Gate per contract:** empty storage diff + matching `test-sol/unit/governance/{network,validators,voting}` subset green. Note: `Validators` already migrated — confirm no regression.

---

## PHASE 4 — Identity & Stability

| ID | Contract | Risk |
|----|----------|------|
| P4.1 | `Random` | SafeMath, precompiles |
| P4.2 | `Attestations` (535) | SafeMath, `.transfer/.send`, SafeERC20→OZ8 |
| P4.3 | `Escrow` (563) | `now`, SafeERC20, Signatures, ReentrancyGuard |
| P4.4 | `FederatedAttestations` (520) | assembly, SafeCast, **packed `uint64` struct — verify packing** |
| P4.5 | `OdisPayments` | SafeMath |
| P4.6 | identity proxies (`Attestations`,`Escrow`,`FederatedAttestations`,`OdisPayments`,`Random`) | MECH |
| P4.7 | `SortedOracles` (498) | `now`, SafeMath, FixidityLib, sorted-list-with-median |
| P4.8 | stability proxy `SortedOraclesProxy` | MECH |

**Gate:** empty storage diffs + `test-sol/unit/identity` + `test-sol/unit/stability` green.

---

## PHASE 5 — Uniswap & Misc

| ID | Contract | Risk |
|----|----------|------|
| P5.1 | Uniswap libs `MathUni`,`SafeMathUni`,`UQ112x112`,`UniswapV2Library`,`TransferHelper` | mostly test-support; MECH |
| P5.2 | Uniswap interfaces `IUniswapV2*`,`IWETH` | pragma only |
| P5.3 | Uniswap test contracts `MockUniswapV2*`,`UniswapV2ERC20`,`MockERC20` | assembly create2, MECH |
| P5.4 | `Migrations.sol` | truffle artifact — likely retire |
| P5.5 | `CompileExchange.sol` (460) | test-only — migrate or DELETE if unused |

**Gate:** builds + any uniswap-touching tests green.

---

## PHASE 6 — Tests Migration

| ID | Task | Files |
|----|------|-------|
| P6.1 | Bump 39 `^0.5.13` test-sol files → `>=0.8.7 <0.8.20` | `test-sol/unit/**` |
| P6.2 | Migrate base `TestWithUtils.sol` → fold into `TestWithUtils08.sol`; repoint imports | `test-sol/` |
| P6.3 | Consolidate dual helpers (`ECDSAHelper`/`08`, `PrecompileHandler`, utils) | `test-sol/utils/**` |
| P6.4 | Move 37 in-tree mocks `contracts/*/test/Mock*.sol` → `contracts-0.8/*/test/` + MECH | per domain |
| P6.5 | Regenerate/verify `test-ts/compatibility` (ast-layout, verify-bytecode, version) | `test-ts/**` |
| P6.6 | Update `foundry.toml` `no_match_path`, profile `src`/`test` as files move | `foundry.toml` |
| P6.7 | Confirm CI matrix `protocol_tests.yml` domains still resolve paths | `.github/workflows/protocol_tests.yml` |

**Gate:** `yarn test` + `yarn test:ts` green locally; CI matrix green incl devchain migration/e2e.

---

## PHASE 7 — Release Tooling Simplification (dual-tree → single)

Only after `contracts/` has no remaining impls.

| ID | Task | File | Detail |
|----|------|------|--------|
| P7.1 | Drop `SOLIDITY_05_PACKAGE`; flatten `SOLIDITY_08_PACKAGE` (remove explicit contract list — now all) | `contractPackages.ts` | |
| P7.2 | Remove `contracts08Set`, `getContractBuildDir`, `buildDir05/08` split, profile auto-detect | `scripts/foundry/make-release.ts` (~920-972) | |
| P7.3 | Collapse dual-profile build loops | `scripts/bash/release-lib.sh`, `verify-deployed-forge.sh`, `check-versions-foundry.sh`, `scripts/foundry/make-release-foundry.sh`, `lib/build.ts` (~87-91) | one profile |
| P7.4 | Single artifact-folder logic | `check-backward.ts` (getForge/getTruffle ArtifactsFolders) | |
| P7.5 | **Preserve** `ALLOWED_LEGACY_LIBRARIES` (mainnet 0.5 `AddressLinkedList` stays) | `lib/compatibility/verify-bytecode-foundry.ts` (~125-150) | must NOT be deleted |
| P7.6 | Retire `truffle-compat` profile; keep one 0.8 profile; collapse `out*` dirs | `foundry.toml` | |
| P7.7 | CI path watches + devchain build scripts | `publish-contracts-abi-release.yml`, `create_and_migrate_anvil_devchain.sh` | drop `contracts/**` 0.5 builds |
| P7.8 | Bump `NODE_MODULE_CACHE_VERSION` if deps changed | `.github/workflows/celo-monorepo.yml` | per node-cache skill |
| P7.9 | Update release skill doc | `.cursor/skills/celo-release/SKILL.md` | remove 0.5 profile steps |

**Gate:** full release dry-run (`release:verify-deployed:foundry`, `release:check-versions:foundry`) passes against a fork; `verify-bytecode` still honors legacy library allowlist.

---

## Per-Contract Acceptance Checklist (apply to every impl task)

- [ ] Ported to `contracts-0.8/`, pragma `>=0.8.7 <0.8.20`
- [ ] All MECH fixes applied
- [ ] Bases match P0.4 mapping (no accidental OZ-base swap that shifts storage)
- [ ] `forge inspect <C> storage-layout` diff vs baseline == **empty**
- [ ] `getVersionNumber()` bumped per P0.5 policy
- [ ] Added to `contractPackages.ts`
- [ ] Domain `test-sol` subset green
- [ ] Old `contracts/<C>.sol` removed (avoid dual definition)
- [ ] Separate code-review pass (not self-approved in authoring context)

## Risk Register (carried from plan)

| Risk | Sev | Mitigation |
|------|-----|------------|
| Inherited storage drift (OZ v2.5→v4.9 bases) | HIGH | P0.1 baselines + per-contract storage gate |
| Assembly behavior change (Proxy, clone factory, Signatures) | HIGH | dedicated dispatch/signature tests |
| Packed-struct repacking (`FederatedAttestations` uint64) | MED | storage gate |
| SafeMath removal hides intended wraparound | MED | grep mod/wrap intent; manual review; `unchecked{}` only where deliberate |
| Mento interface divergence | MED | P0.4 per-contract base decision |
| Mid-migration test bridging (0.8 can't import 0.5) | MED | phased domain order keeps each self-consistent |
| Legacy `AddressLinkedList` re-deploy | MED | preserve allowlist (P7.5) |

## Authoritative build order (verified DAG — no cycles)

The phase split above is for **review grouping**. Actual port order follows the dependency batches (a contract only ports after its bases). Contracts within a batch are independent → **parallelizable**. `common/` never depends on governance/identity/stability (confirmed, 0 edges), so the domain phases are clean.

- **Batch 0** (foundation, no internal deps): Blockable, CalledByVm, Create2, ExternalCall, ExtractFunctionSignature, FixidityLib, Initializable, LinkedList, Permissioned, Proxy, ReentrancyGuard, SafeMathMem, Signatures, UsingPrecompiles, UsingRegistry, UsingRegistryV2
- **Batch 1** (deps ⊆ B0): Accounts, FeeCurrencyWhitelist, FeeHandlerSeller, Freezable, Freezer, GoldToken, Heap, InitializableProxy, MultiSig, PrecompilesOverride(V2), ProxyFactory, Registry, SortedLinkedList, UsingRegistryV2BackwardsCompatible · BlockchainParameters, GovernanceSlasher, LockedGold, Proposals, ReleaseGold, SlasherUtil · Attestations, FederatedAttestations, IdentityProxy, OdisPayments, Random
- **Batch 2** (deps ⊆ B0-1): AddressSortedLinkedList, FeeHandler, IntegerSortedLinkedList, MentoFeeHandlerSeller, ProxyCloneFactory, SortedLinkedListWithMedian, UniswapFeeHandlerSeller · DoubleSigningSlasher, DowntimeSlasher, EpochRewards, GovernanceApproverMultiSig, ReleaseGoldMultiSig · Escrow, IdentityProxyHub
- **Batch 3**: AddressSortedLinkedListWithMedian · **Election**, **Governance** (heaviest — port sequentially)
- **Batch 4**: SortedOracles

**10 0.5 contracts are already imported by `contracts-0.8/`** (Initializable×11, FixidityLib×4, UsingRegistry×6, UsingPrecompiles×3, CalledByVm×2, ReentrancyGuard×2, PrecompilesOverride, Create2, LinkedList, SortedLinkedList) → these are in Batch 0/1 and must stay layout-stable; the 0.8 tree keeps building throughout.

## Appendix B.2 — `contracts-0.8` files importing 0.5 interfaces (PI.4 repoint targets)

UsingRegistry, UsingRegistryV2NoMento (largest: 17 each), EpochManager, EpochManagerEnabler, GasPriceMinimum, GasSponsoredOFTBridge, PrecompilesOverride(V2), ProxyFactory08, ScoreManager, UsingPrecompiles, Validators, FeeCurrencyAdapter, + test mocks (MockCeloUnreleasedTreasury, MockRegistry, EpochRewardsMock). Full file:line table in conversation recon.

## Appendix C — Per-file specific fixes beyond MECH

- `ReleaseGold.sol:46` — `uint256(-1)` → `type(uint256).max`
- `Proxy.sol:34` — `function() external payable` → `fallback() external payable` (+ split `receive()` if needed); assembly `delegatecall(gas,...)`→`gasleft()` (L57-58), `calldatasize`/`returndatasize`→`()`
- `Proposals.sol:350-366` — assembly `gas`→`gasleft()`
- `Accounts.sol:957`, `FederatedAttestations.sol:338` — assembly `chainid`→`chainid()`
- `Create2.sol:15-19`, `ProxyCloneFactory.sol:55-61`, `IdentityProxyHub.sol:53` — `create2`/`create`/`extcodesize` assembly review (opcodes valid in 0.8, confirm `extcodesize`→`extcodesize()` call form)
- `LockedGold.sol:512`, `UsingPrecompiles.sol:102,120`, `ProxyCloneFactory.sol:36` — `address(uint160(x))` → `payable(address(uint160(x)))` where a payable address is needed
- `now` files (9): Governance(12 hits), SortedOracles(3), Escrow(1), FeeHandler(1), LockedGold(2), EpochRewards(2), Proposals(2), CompileExchange(3)
- **14 clean files** (pragma-only, no body edits): ReleaseGoldMultiSig, GovernanceApproverMultiSig, FeeCurrencyWhitelist, Freezer, Freezable, InitializableProxy, ProxyFactory, UsingRegistryV2BackwardsCompatible, ExtractFunctionSignature, ExternalCall, FixidityLib, Permissioned, CalledByVm, ReentrancyGuard, SafeMathMem
- `SafeMathMem.sol` — verify zero callers under 0.8, then **delete**

## Sequencing summary

P0 (blocking) → PI interfaces + P1 libs → P2 common → P3 governance → P4 identity/stability → P5 uniswap/misc → P6 tests → P7 tooling. Build order within = the verified batches above. Each phase merges to branch green; **storage gate (empty diff vs P0 baseline) is the non-negotiable per-contract bar.**
