# Core contracts on a live Celo L2 testnet (work in progress)

Tooling to run the core contracts migration against a running L2 testnet instead of an anvil
devchain. It was written for, and so far used once on, the `havoc` testnet (chain id 33362320,
settling on Sepolia) on 2026-10-07, from the `core-contracts.v17` tag. Treat it as a starting
point, not as a supported flow.

## Why the devchain flow is not enough

`create_and_migrate_anvil_devchain.sh` assumes an anvil it can cheat on:

- it plants the Registry proxy at `0x…ce10` with `anvil_setCode`;
- `Migration.s.sol` expects four more proxies to already exist at fixed addresses (`.proxies` in the
  config: CeloToken, FeeHandler, FeeCurrencyDirectory, CeloUnreleasedTreasury);
- the deployer key is read from the tracked `migrationsConfig.json`, validator keys and the signer
  mnemonic too;
- libraries are deployed with `forge create --unlocked`;
- validator and group accounts are prefunded by anvil.

On a live chain none of that holds, and a contract cannot be deployed to a chosen address.

## What the chain's genesis must contain

The five proxies have to be in the L2 genesis, each a Celo `Proxy` whose owner slot
(`eip1967.proxy.admin`) is the deployer:

| Contract               | Address                                      |
| ---------------------- | -------------------------------------------- |
| Registry               | `0x000000000000000000000000000000000000ce10` |
| CeloToken              | `0x471EcE3750Da237f93B8E339c536989b8978a438` |
| FeeHandler             | `0xcD437749E43A154C07F3553504c68fBfD56B8778` |
| FeeCurrencyDirectory   | `0x15F344b9E6c3Cb6F0376A36A64928b13F62C6276` |
| CeloUnreleasedTreasury | `0xB76D502Ad168F9D545661ea628179878DcA92FD5` |

The execution client hardcodes the CeloToken, FeeHandler and FeeCurrencyDirectory addresses per
chain id and falls back to the mainnet ones for an unknown chain id, which is where the
FeeCurrencyDirectory address above comes from (Celo Sepolia uses a different one).

The deployer needs CELO and the unreleased treasury needs a balance (`EpochManager.initializeSystem`
requires it). `havoc` mirrors the `chaos` testnet: 500M CELO each.

For a chain created with `op-deployer`, add the accounts to op-deployer's own state after `apply`
and before `inspect`, so the genesis and the rollup config (which carries the L2 genesis hash) stay
consistent:

```bash
FOUNDRY_PROFILE=truffle-compat forge build      # produces the Proxy artifact
./scripts/foundry/live_l2/inject_celo_allocs.py <workdir>/state.json \
  out-truffle-compat/Proxy.sol/Proxy.json <deployer address> <fee currency directory address>
op-deployer inspect genesis --workdir <workdir> <chain id> > genesis.json
op-deployer inspect rollup  --workdir <workdir> <chain id> > rollup.json
```

A chain that is already running without these accounts needs a new genesis.

## Changes to the migration

- `migrations_sol/Migration.s.sol`: the config path (`MIGRATION_CONFIG`), the deployer key
  (`DEPLOYER_PRIVATE_KEY`), the validator keys (`VALIDATOR_KEYS`) and the signer mnemonic
  (`VALIDATOR_SIGNERS_MNEMONIC`) come from the environment; a new `fundValidatorAccounts()` step
  sends `.validators.accountFunding` to each group and validator account before they register.
- `migrations_sol/DeployLibraries.s.sol`: deploys the linked libraries with the deployer key.
- `scripts/foundry/migrate_live_l2.sh`: the driver. Same steps as the devchain script without the
  anvil parts; `STEPS` allows resuming.
- `migrations_sol/migrationsConfig.havoc.json`: the default config with these differences:
  FeeCurrencyDirectory address as above, one-day epochs, `skipTransferOwnership: true` (the deployer
  keeps ownership of every contract), no treasury transfer (it is funded in genesis), 30,000 CELO
  per validator and group account, and no keys.
- `foundry.toml`: read access to `.tmp/libraries` for the library artifacts.

With these changes the devchain flow no longer runs as is (the script requires the environment
variables); that is the main thing to resolve before this could be merged.

## Running it

All commands from `packages/protocol`.

1. Rehearse on a local chain shaped like the target genesis (throwaway keys, ends with the checks):

   ```bash
   ./scripts/foundry/live_l2/rehearse_on_anvil.sh
   ```

2. Create the validator keys in OpenBao (kept if they already exist):

   ```bash
   ./scripts/foundry/live_l2/gen_validator_keys.sh secrets/static-secrets/devops-circle/<testnet>
   ```

3. Run the migration with keys read from OpenBao into the environment:

   ```bash
   RPC_URL=<sequencer execution client RPC> DEPLOYER_ADDRESS=<deployer> \
   BAO_PREFIX=secrets/static-secrets/devops-circle/<testnet> \
   MIGRATION_CONFIG=./migrations_sol/migrationsConfig.havoc.json \
   ./scripts/foundry/live_l2/run_migration_from_openbao.sh
   ```

4. Check the result:

   ```bash
   ./scripts/foundry/live_l2/verify_core_contracts.sh <rpc url> <deployer>
   ```

On `havoc` the run was 302 transactions (6 libraries, 117 and 179 for the two migration parts), about
169M gas, 15 minutes at one-second blocks. The resulting addresses are in
`havoc-core-contracts.json`.

## Things that will trip you up

- **`--sender` must be the deployer.** The script contract makes the deployer its own owner and
  then calls `onlyOwner` helpers; without it the run fails with `Ownable: caller is not the owner`.
- **The contracts detect an L2 by code at `0x4200000000000000000000000000000000000018`** (the
  OP-stack ProxyAdmin predeploy). A local chain without it takes the L1 path and validator
  registration fails with `slicing out of range`.
- **Contract size.** Several contracts are above 24 KB (up to 47.5 KB). forge prints errors about
  the size limit and continues; the chain must allow it (Celo allows 64 KB).
- **Keys and verbosity.** With `-vvv` forge prints call traces when a script fails, and those
  include cheatcode arguments. `run_migration_from_openbao.sh` defaults to `-vv`.
- **solc 0.5.x on Apple Silicon.** Only x86_64 builds exist, so without Rosetta the build fails with
  `Bad CPU type in executable`. `solc_js_shim/setup.sh <dir>` builds a compiler HOME that serves
  0.5.14 and 0.5.17 through solc-js; pass it as `SOLC_SHIM_HOME`, or run the build steps with
  `HOME=<dir>`.
- **Reserve balance.** `migrateReserve` still funds the Reserve with `vm.deal`, which does nothing
  on a live chain. The Reserve ends up empty, as on `chaos`.

## Not done

- No epoch has been switched on `havoc` and votes are not activated (`activate_votes.sh` relies on
  anvil time travel). `chaos` is in the same state.
- The havoc-specific config is a copy of the default one; nothing is parameterised per testnet.
- Contract verification.
