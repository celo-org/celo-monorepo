---
name: solidity-compiler
description: Choose and change the Solidity compiler and EVM target for packages/protocol. Use when bumping solc, changing evm_version or via_ir, adding a foundry profile, reviewing a compiler upgrade, or when someone mentions solc version, EVM target, paris/shanghai/cancun/prague, via-IR, or a Solidity compiler bug.
---

# Solidity compiler and EVM target

What the core contracts compile with, why, and the two source-level rules that keep the
compiler's known bugs out of reach.

## Current pin

| Setting | Value | Set in |
|---|---|---|
| Compiler | `0.8.36` | `foundry.toml`, default profile |
| EVM target | `shanghai` | `foundry.toml`, default profile |
| Optimizer | on, 200 runs | `foundry.toml`, default profile |
| via-IR | **off** | `foundry.toml`, default profile |
| Proxies | `0.5.14` / `istanbul` (`solc05`), `0.5.17` optimized (`solc05-optimized`) | `foundry.toml` |

The proxies reproduce code already on chain and never move.

## The two rules that keep the known bugs inert

Every compiler release ships with a list of its own unfixed bugs. The pinned version has
three, and all three are unreachable **only while both rules hold**. Breaking either makes a
real bug reachable in deployed code.

1. **Do not turn on via-IR.** Two of the three bugs
   (`MisorderedNamedParametersInRequireWithCustomErrors`,
   `SpillSlotCollisionAcrossMutualRecursion`) exist only in the via-IR pipeline. Switching
   `via_ir = true` also changes the bytecode of every contract, so it is a release-sized
   decision, not a build tweak.

2. **Never `delete` an element of an array held in memory.**
   `MemoryByteArrayElementDeleteClearsWholeWord` (fixed in 0.8.37, so present in the pinned
   version) makes `delete b[i]` on a `bytes` in **memory** write a full 32-byte zero word
   instead of one byte, silently clearing the following bytes and, near the end of an
   allocation, the start of the next object in memory. Assigning `b[i] = 0` is unaffected,
   and arrays in storage, calldata and transient storage are unaffected.
   Every `delete` in `contracts/` targets storage today. Check before adding one:

   ```bash
   grep -rnE "delete [a-zA-Z_][A-Za-z0-9_]*\[" packages/protocol/contracts
   ```

   Each hit must resolve to a storage mapping or storage array.

## Why these values, and what would change them

**Compiler is 0.8.36, not the newest.** Blockscout carries no newer compiler for Celo
mainnet or Celo Sepolia, and the release verifies every implementation it deploys on both
Blockscout and Celoscan. Shipping a version Blockscout does not have leaves the contracts
unverified on the explorer Celo links to. Celoscan is usually ahead; Blockscout is the
binding one. Raise the pin once Blockscout lists the version.

**EVM target is shanghai, not what the chain supports.** Celo mainnet and Celo Sepolia run
Prague and execute PUSH0, MCOPY and TSTORE/TLOAD today. The limit is our own tooling:
`lib/compatibility/ast-version.ts` reads each contract's version by executing its bytecode
in the vendored `@celo/ethereumjs-vm`, which implements no hardfork past shanghai. Target
cancun or later and every version read fails. Moving past shanghai means replacing that VM
first. Older builds were capped at `paris` because Celo L1 could not execute PUSH0; that
limit died with the L2 migration.

**Newer is usually safer, not riskier.** Known-bug counts fall as versions rise: 0.8.19
seven, 0.8.28 six, 0.8.35 five, 0.8.36 three. Treat "use an older, battle-tested version"
advice as a claim to check, not a default.

## Checking before you move the pin

```bash
# 1. Known bugs for a version, and the conditions each needs
curl -s https://raw.githubusercontent.com/ethereum/solidity/develop/docs/bugs_by_version.json
curl -s https://raw.githubusercontent.com/ethereum/solidity/develop/docs/bugs.json
#    In bugs.json each entry has "conditions"; {"viaIR": true} means it cannot reach this build.

# 2. Can the explorers verify it? Blockscout decides.
curl -s https://celo.blockscout.com/api/v2/smart-contracts/verification/config \
  | python3 -c "import sys,json;print([v for v in json.load(sys.stdin)['solidity_compiler_versions'] if v.startswith('v0.8.3')])"

# 3. Can the pinned toolchain install it? Foundry 1.0.0 runs the unit tests in CI and
#    fails some versions with a checksum mismatch (0.8.31 and 0.8.35 at the time of writing).
forge build --use <version> --force

# 4. What EVM version does it default to? Never assume; the default has been cancun for
#    every release from 0.8.28 on. We override it anyway.
#    Build a throwaway contract and read metadata.settings.evmVersion from the artifact.
```

After changing the pin, rebuild and compare the **metadata-stripped** runtime code of every
contract before and after. The metadata hash alone changes for any contract whose sources
shifted, so an unstripped comparison reports dozens of false differences.
