# Sequencer Fee Distribution Tooling

Tooling to track and distribute Celo L2 sequencer fee revenue per [CGP-286
(CELOccelerate)](https://forum.celo.org/t/celoccelerate-celo-tokenomics-proposal/13147).

## What This Does

The Celo L2 sequencer collects transaction fees in two on-chain contracts:

- **SequencerFeeVault** (`0x4200000000000000000000000000000000000011`) — tip + L1 data fee portion
- **FeeHandler** (`0xcD437749E43A154C07F3553504c68fBfD56B8778`) — base fee portion

This tooling:

1. Generates a P&L report from on-chain data via Dune Analytics
2. Calculates costs: L1 operating costs (batcher, proposer, challenger, EigenDA), OP Superchain revenue share, optional Carbon Fund
3. Shows actionable next steps to move fees from vault + FeeHandler → Operations Safe → Governance (Community Fund)
4. Generates a Safe Transaction Builder batch JSON to execute the distribution via the 2-of-5 Operations Safe

## Files

| File | Purpose |
|------|---------|
| `report.py` | Main entry point. Generates P&L report and next steps. |
| `prepare-safe-batch.py` | Generates a Safe Transaction Builder JSON batch for the Governance transfer. |
| `dune_sequencer_fees.sql` | Reference copy of the Dune query (`6898547`) used by `report.py`. |

## Prerequisites

- Python 3.9+
- [foundry](https://book.getfoundry.sh/) (`cast` binary in `$PATH`)
- Dune Analytics API key — get at [dune.com/settings/api](https://dune.com/settings/api)

## Quick Start

```bash
cd scripts/sequencer-fees
export DUNE_API_KEY=<your-dune-api-key>

# Default: current state + next actions only
python3 report.py

# Full P&L breakdown + per-day table
python3 report.py --detail

# Auto-refresh Dune data if stale
python3 report.py --auto-refresh
```

## Full Distribution Flow

The report's "NEXT STEPS" section walks through the full cycle. Summary:

### Step 1: Withdraw from SequencerFeeVault — permissionless

Anyone can call. Native CELO moves from vault to Operations Safe.

```bash
cast send 0x4200000000000000000000000000000000000011 'withdraw()' \
  --rpc-url https://forno.celo.org --private-key $PK
```

### Step 2: Process FeeHandler — permissionless

`handleAll()` distributes base-fee CELO per current fractions
(currently 0% Carbon Fund + 100% Operations Safe after [CGP-288](https://forum.celo.org/t/celoccelerate-celo-tokenomics-proposal-pausing-carbon-fund-payments/13218)).

```bash
cast send 0xcD437749E43A154C07F3553504c68fBfD56B8778 'handleAll()' \
  --rpc-url https://forno.celo.org --private-key $PK
```

FeeHandler also accumulates stablecoins (USDT, USDC, USDm, EURm, BRLm). Each
must be distributed via a separate `distribute(token)` call:

```bash
cast send 0xcD437749E43A154C07F3553504c68fBfD56B8778 'distribute(address)' \
  <token-address> --rpc-url https://forno.celo.org --private-key $PK
```

The report prints the exact `cast send` command for each non-zero stablecoin
balance.

### Step 3: Send Tokens to Governance via Safe — requires 2-of-5

Generate the Safe batch JSON, upload to Safe Transaction Builder, get
2 signatures.

```bash
python3 prepare-safe-batch.py \
  --l1-cost-celo <amount> \
  --op-share-celo <amount> > batch.json
```

The batch contains `transfer(governance, balance)` calls for each token held
by the Safe. No swapping — CELO is sent as CELO, stablecoins are sent as
stablecoins.

Then upload `batch.json` at:

```
https://app.safe.global/transactions/queue?safe=celo:0x7A1E98FC9a008107DbD1f430a05Ace8cf6f3FE19
```

→ Transaction Builder → drag & drop `batch.json` → 2-of-5 signers approve.

### Steps 4 & 5: L1 Reimbursement and OP Superchain Share

The `--l1-cost-celo` and `--op-share-celo` amounts are withheld from the Safe
(not sent to Governance). To send these to specific recipients in the same
batch:

```bash
python3 prepare-safe-batch.py \
  --l1-cost-celo <amount> --l1-cost-recipient <addr> \
  --op-share-celo <amount> --op-share-recipient <addr> > batch.json
```

You can also set `L1_COST_RECIPIENT` and `OP_SHARE_RECIPIENT` env vars before
running `report.py` — the report then prints the full command including the
recipients.

## Address Reference

| Name | Address | Role |
|------|---------|------|
| SequencerFeeVault | `0x4200000000000000000000000000000000000011` | Collects tip + L1 data fee |
| FeeHandler | `0xcD437749E43A154C07F3553504c68fBfD56B8778` | Collects base fee, distributes per fractions |
| Operations Safe | `0x7A1E98FC9a008107DbD1f430a05Ace8cf6f3FE19` | 2-of-5 Gnosis Safe, "cLabs" beneficiary in FeeHandler |
| Governance | `0xD533Ca259b330c7A88f74E000a3FaEa2d63B7972` | Community Fund (destination) |
| CELO token | `0x471EcE3750Da237f93B8E339c536989b8978a438` | Native CELO ERC-20 |

## P&L Calculation

The report uses on-chain Dune data and the following pricing strategy:

| Asset | Source |
|-------|--------|
| CELO | Daily VWAP from `prices.day` (Coinpaprika) |
| USDT, USDC, USDm | Hardcoded $1.00 (USD peg) |
| EURm | Daily price from `prices.day` (tracks EUR/USD) |
| ETH | Daily VWAP from `prices.day` |

### Cost Formula

```
Carbon Fund    = revenue × carbon_fraction       (read live from FeeHandler, 0% post-CGP-288)
L1 Costs       = sum of batcher + proposer + challenger + EigenDA gas costs (ETH → CELO at daily price)
OP Share       = max(2.5% of revenue, 15% of profit)   computed per-day
Net Profit     = Revenue − Carbon − L1 − OP Share
```

### Reconciliation

The report includes a reconciliation check that:

- Auto-detects the period start from the last `Withdrawal` event on the vault
  (queried via Dune)
- Reads current on-chain balances of vault + FeeHandler
- Flags any vault withdrawals that occurred during the reporting period
  (which would split that day's revenue between Safe and vault)

## Anvil Fork Testing

To test the full distribution cycle locally:

```bash
# Start anvil fork — MUST use --celo for native CELO support
anvil --fork-url https://forno.celo.org --port 8546 --celo --no-storage-caching
```

The `--celo` flag is critical. Without it, anvil doesn't handle Celo's
native↔ERC-20 CELO unification — ERC-20 transfers will silently succeed at
the tx level but balances won't change.

Then run each step against `http://localhost:8546`. Impersonate the
Operations Safe to execute step 3:

```bash
cast rpc anvil_impersonateAccount 0x7A1E98FC9a008107DbD1f430a05Ace8cf6f3FE19 \
  --rpc-url http://localhost:8546
# Do NOT use anvil_setBalance on the Safe — it overwrites CELO balance.
```

## Known Limitations

- **Stablecoins stuck in vault.** The current SequencerFeeVault
  (v1.5.0-beta.3) lacks a `sweepERC20()` function. Stablecoins paid as fees
  via fee abstraction accumulate in the vault and cannot be withdrawn until
  the vault contract is upgraded. The report shows the stuck amounts under
  `[!] STABLECOINS STUCK IN VAULT`.
- **Reconciliation block scan limit.** The reconciliation check scans the
  last ~2M blocks of vault `Withdrawal` events to avoid RPC timeouts. For
  very long periods, earlier withdrawals are not detected (the auto-detect
  uses Dune, which has no limit).
- **OP Share recipient.** The OP Superchain revenue share destination address
  is not yet defined — currently the share is withheld in the Safe until a
  recipient is configured.

## Dune Query

The underlying Dune query is `6898547`. The report fetches data via the Dune
API. To force a re-execution:

```bash
python3 report.py --refresh
```

A standalone copy of the query SQL is at `dune_sequencer_fees.sql` for
reference.
