# Sequencer Fee Distribution Tooling

Tooling to track and distribute Celo L2 sequencer fee revenue per [CGP-286
(CELOccelerate)](https://forum.celo.org/t/celoccelerate-celo-tokenomics-proposal/13147).

For the full computation, see **[ALGORITHM.md](./ALGORITHM.md)**.

## What This Does

The Celo L2 sequencer collects transaction fees in two on-chain contracts:

- **SequencerFeeVault** (`0x4200…0011`) — tip + L1 data fee portion
- **FeeHandler** (`0xcD43…8778`) — base fee portion

`report.py`:

1. Generates a P&L report from on-chain data via Dune Analytics
2. Calculates costs: L1 operating costs (batcher, proposer, challenger, EigenDA),
   OP Superchain revenue share, Carbon Fund (live fraction)
3. Auto-detects the reporting period and the un-withdrawn pre-cutoff window
4. Prints a colored, step-by-step operator action plan

## Distribution Model (important)

- **Governance is paid only in CELO** — `CELO fees + stables CELO-equiv − OP − L1`.
- **Stablecoins never leave the Safe** — retained permanently.
- The stables' CELO-equivalent is funded by:
  1. **Pre-cutoff CELO** already in the Safe (CGP-287, un-withdrawn) — used first.
  2. **Cold wallet** — sends only the remaining gap.
- The Safe's **pre-existing** CELO is **not touched** — only newly-withdrawn fees
  (Vault + FeeHandler) plus the cold-wallet top-up are distributed.
- **OP share** CELO is swapped to WETH (Uniswap V3, live quote) and sent to the OP
  recipient.

## Files

| File | Purpose |
|------|---------|
| `report.py` | Main entry point. P&L report + operator action plan. |
| `execute-withdrawals.sh` | Runs steps [1]+[2] (`withdraw` + `handleAll` + `distribute` each stable) with reconciliation. Fork mode by default; mainnet is guarded. |
| `prepare-safe-batch.py` | Generates a Safe Transaction Builder JSON batch for step [4]. |
| `dune_sequencer_fees.sql` | Reference copy of the Dune query (`6898547`). |
| `ALGORITHM.md` | Full algorithm documentation. |

### Running steps [1]+[2]

```bash
# Safe: fork Celo mainnet, run with a throwaway key, reconcile every balance
./execute-withdrawals.sh --fork

# Mainnet (irreversible): guarded — needs a clean key + explicit opt-in
EXECUTE_MAINNET=1 PK=<clean-key> RPC_URL=https://forno.celo.org \
  ./execute-withdrawals.sh --mainnet
```

The script drains the vault (native CELO) and the FeeHandler (CELO + all five
stablecoins) to the Operations Safe, then asserts: vault CELO == 0, each
FeeHandler stablecoin == 0, and each Safe stablecoin grew by exactly the
FeeHandler amount. Exit code 0 only if every check passes. It does **not** touch
Governance — that is the 2-of-5 Safe batch (step [4]).

## Prerequisites

- Python 3.9+
- [foundry](https://book.getfoundry.sh/) (`cast` in `$PATH`)
- Dune Analytics API key — [dune.com/settings/api](https://dune.com/settings/api)

## Quick Start

```bash
cd scripts/sequencer-fees
export DUNE_API_KEY=<your-dune-api-key>

# Default: lean output — current state + next actions
python3 report.py

# Full P&L tables, daily breakdown, reconciliation, progress logs
python3 report.py --detail

# Force / auto refresh Dune data
python3 report.py --refresh
```

## Operator Action Plan

The report's "NEXT STEPS" section prints exact commands. Summary:

| Step | Action | Permission |
|------|--------|------------|
| `[0]` | Pre-cutoff funds note (informational) | — |
| `[1]` | `vault.withdraw()` → Safe (native CELO) | permissionless |
| `[2]` | `feeHandler.handleAll()` + `distribute(token)` per stablecoin | permissionless |
| `[3]` | Cold wallet sends the gap CELO → Safe | operator cold wallet |
| `[4]` | Safe batch: CELO → Gov; OP share → WETH swap → OP recipient | 2-of-5 multisig |

### Step 1 — Withdraw (permissionless)

```bash
cast send 0x4200000000000000000000000000000000000011 'withdraw()' \
  --rpc-url https://forno.celo.org --private-key $PK
```

### Step 2 — Process FeeHandler (permissionless)

`handleAll()` distributes base-fee CELO per the live beneficiary fractions
(0% Carbon Fund + 100% Operations Safe after
[CGP-288](https://forum.celo.org/t/celoccelerate-celo-tokenomics-proposal-pausing-carbon-fund-payments/13218)).
FeeHandler stablecoins are released with a separate `distribute(token)` call each
(the report prints the exact command per non-zero balance).

```bash
cast send 0xcD437749E43A154C07F3553504c68fBfD56B8778 'handleAll()' \
  --rpc-url https://forno.celo.org --private-key $PK
```

### Step 3 — Cold-wallet exchange

The cold wallet supplies the stables' CELO-equivalent **minus** the pre-cutoff
CELO already in the Safe. The report prints the exact `cast send` for the
remaining `cold_send`.

### Step 4 — Distribute via Safe batch (2-of-5)

```bash
python3 prepare-safe-batch.py --l1-cost-celo <amount> --op-share-celo <amount> \
  --op-share-recipient <op-addr> --op-share-weth-min <min> > batch.json
```

Upload `batch.json` to the Safe Transaction Builder:

```
https://app.safe.global/transactions/queue?safe=celo:0x7A1E98FC9a008107DbD1f430a05Ace8cf6f3FE19
```

→ drag & drop → 2-of-5 signers approve.

## Address Reference

| Name | Address | Role |
|------|---------|------|
| SequencerFeeVault | `0x4200000000000000000000000000000000000011` | Collects tip + L1 data fee |
| FeeHandler | `0xcD437749E43A154C07F3553504c68fBfD56B8778` | Collects base fee; distributes per fractions |
| Operations Safe | `0x7A1E98FC9a008107DbD1f430a05Ace8cf6f3FE19` | 2-of-5 Gnosis Safe, "cLabs" beneficiary |
| Governance | `0xD533Ca259b330c7A88f74E000a3FaEa2d63B7972` | Community Fund (destination) |
| CELO token | `0x471EcE3750Da237f93B8E339c536989b8978a438` | Native + ERC-20 |
| Uniswap V3 QuoterV2 | `0x82825d0554fA07f7FC52Ab63c961F330fdEFa8E8` | Live CELO→WETH quote |

## P&L Pricing

| Asset | Source |
|-------|--------|
| CELO | Daily VWAP `prices.day` (Coinpaprika) |
| USDT, USDC, USDm | Hardcoded `$1.00` (USD peg) |
| EURm | Daily `prices.day` (tracks EUR/USD) |
| ETH | Daily VWAP `prices.day` |

```
Carbon  = revenue × carbon_fraction       (live from FeeHandler, 0% post-CGP-288)
L1      = (batcher + proposer + challenger + EigenDA gas in ETH) × eth_price / celo_price
OP      = max(2.5% of revenue, 15% of profit)   (per-day)
Profit  = revenue − Carbon − L1 − OP
```

## Flags & Env

| Flag / Env | Effect |
|------------|--------|
| `--detail` | Full P&L tables, daily breakdown, reconciliation, progress logs |
| `--from` / `--to` | Override auto-detected period |
| `--refresh` / `--auto-refresh` | Re-execute the Dune query |
| `--csv` / `--json` | Export |
| `L1_COST_RECIPIENT` | L1 reimbursement address |
| `OP_SHARE_RECIPIENT` | OP treasury (enables real WETH swap; default = Safe placeholder) |
| `RPC_URL` | Celo RPC (default forno) |
| `NO_COLOR` | Disable ANSI colors (also off when piped) |

## Anvil Fork Testing

```bash
# MUST use --celo for native CELO support
anvil --fork-url https://forno.celo.org --port 8546 --celo --no-storage-caching
```

Without `--celo`, anvil doesn't handle Celo's native↔ERC-20 CELO unification —
ERC-20 transfers silently succeed at the tx level but balances don't change.

Impersonate the Safe to execute step [4]:

```bash
cast rpc anvil_impersonateAccount 0x7A1E98FC9a008107DbD1f430a05Ace8cf6f3FE19 \
  --rpc-url http://localhost:8546
# Do NOT use anvil_setBalance on the Safe — it overwrites the CELO balance.
```

## Known Limitations

- **Stablecoins stuck in vault.** SequencerFeeVault (v1.5.0-beta.3) lacks
  `sweepERC20()`. Stablecoins paid as fees accumulate in the vault and can't be
  withdrawn until a vault upgrade. They are **excluded from all distribution
  math** and left untouched.
- **OP Share recipient.** The OP Superchain destination is not yet defined.
  Until `OP_SHARE_RECIPIENT` is set, the WETH swap is shown but not executed and
  the OP share stays in the Safe.

## Dune Query

The underlying Dune query is `6898547`. Re-execute with `python3 report.py
--refresh`. A standalone copy of the SQL is at `dune_sequencer_fees.sql`.
