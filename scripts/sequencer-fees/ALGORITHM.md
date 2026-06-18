# Sequencer Fee Distribution — Algorithm

How `report.py` computes the distribution of Celo L2 sequencer fee revenue and
produces the operator action plan.

## Inputs

| Source | What |
|--------|------|
| Dune query `6898547` | Daily revenue (CELO + stablecoin fees) and L1 costs |
| `cast` (Celo RPC) | Live on-chain balances, FeeHandler fractions, Uniswap quote |

## Key Addresses

| Name | Address | Role |
|------|---------|------|
| SequencerFeeVault | `0x4200…0011` | Collects tip + L1 data fee (native CELO + ERC-20) |
| FeeHandler | `0xcD43…8778` | Collects base fee; distributes per beneficiary fractions |
| Operations Safe (multisig) | `0x7A1E…FE19` | 2-of-5 beneficiary; receives withdrawals |
| Governance / Community Fund | `0xD533…7972` | Final CELO destination |
| CELO token | `0x471E…a438` | Native + ERC-20 unified |
| Uniswap V3 QuoterV2 | `0x8282…a8E8` | Live CELO→WETH quote for OP share |

## Reporting Period

- **Auto-detect:** `--from` = day after the last vault withdrawal; `--to` = yesterday.
- **CGP-287 cutoff (`2026-04-08`):** the period is forced to start strictly after
  the cutoff. Revenue on/before the cutoff was settled by CGP-287 and is handled
  separately (pre-cutoff window, see below).

## Pricing Strategy

| Asset | Price source |
|-------|--------------|
| CELO | Dune `prices.day` (Coinpaprika; reliable) |
| USDT, USDC, USDm | Hardcoded `$1.00` (USD peg) |
| EURm | Dune `prices.day` (tracks EUR/USD) |
| ETH | Dune `prices.day` (reliable) |

USD↔CELO conversions are done **per day** at that day's price, then summed.
This is more accurate than converting period totals (non-linear with `max()`).

## P&L Math (per day, summed)

```
revenue_celo  = CELO_fees + (stablecoin_fees_usd / celo_price)
carbon        = revenue_celo × carbon_fraction          # read live (0% post-CGP-288)
L1_costs_celo = (batcher + proposer + challenger + eigenDA gas in ETH) × eth_price / celo_price
op_profit     = revenue_celo − L1_costs_celo
OP_share      = max(2.5% × revenue_celo, 15% × op_profit)   # whichever is higher
net_profit    = revenue_celo − carbon − L1_costs − OP_share
```

## Pre-Cutoff Window (CGP-287)

Revenue that accrued **before** the cutoff but was **never withdrawn** still sits
in the Vault/FeeHandler. The window is:

```
sweep_from = (last vault withdrawal on/before cutoff) + 1 day
sweep_to   = CGP-287 cutoff (2026-04-08)
```

`sweep_celo` = native CELO that landed in Vault + FeeHandler during that window
(queried from Dune; 100% of native CELO fees route to those two contracts).

CGP-287 already paid Governance for the pre-cutoff value, so this CELO is **not**
paid to Gov again. Instead it lands in the Safe after withdrawal and is **reused**
to fund the stablecoin exchange (step [3]).

## Distribution Model

**Invariants:**
- Stablecoins **never** leave the Safe (retained permanently).
- Governance is paid **only in CELO**.
- The Safe's **pre-existing** CELO is **not touched** — only newly-withdrawn fees
  (Vault + FeeHandler) plus the cold-wallet top-up are distributed.

**Governance receives (all CELO):**

```
Gov = CELO_fees + stables_CELO_equivalent − OP_share − L1_costs
```

The stablecoins stay in the Safe, so their CELO-equivalent must be supplied from
elsewhere. Sources, in order:

1. **Pre-cutoff CELO** already in the Safe (operator funds) — used first.
2. **Cold wallet** — sends only the remaining gap.

```
stables_equiv   = stablecoin_fees_usd / celo_price       # report period
precutoff_used  = min(sweep_celo, stables_equiv)
cold_send       = stables_equiv − precutoff_used          # cold wallet outflow
precutoff_left  = sweep_celo − precutoff_used             # stays in multisig if any
```

**Step [4] totals:**

```
distributable = (Vault + clabs_fraction × FeeHandler) + cold_send
Gov           = distributable − precutoff_left − L1_costs − OP_share
```

## OP Superchain Share

`OP_share` CELO is swapped to WETH on Uniswap V3 (CELO/WETH 0.3% pool) and sent
to the OP recipient. The report shows a **live** quote from the QuoterV2 at the
current rate. If `OP_SHARE_RECIPIENT` is the Safe placeholder, the swap is shown
but not executed (recipient TBD).

## Operator Action Plan (report output)

| Step | Action | Permission |
|------|--------|------------|
| `[0]` | Pre-cutoff funds note (informational) | — |
| `[1]` | `vault.withdraw()` → Safe | permissionless |
| `[2]` | `feeHandler.handleAll()` + `distribute(token)` per stablecoin | permissionless |
| `[3]` | Cold wallet sends `cold_send` CELO → Safe | operator cold wallet |
| `[4]` | Safe batch: CELO → Gov, OP share → WETH swap → OP recipient | 2-of-5 multisig |

Steps `[1]`–`[2]` drain the contracts into the Safe. Step `[3]` tops up the
stables CELO-equivalent. Step `[4]` distributes.

## Reconciliation (—detail only)

- Queries Dune (no block limit) for vault withdrawals within the period; warns if
  any happened (would split a day's revenue between Safe and Vault).
- Prints current Vault + FeeHandler balances.

## Flags & Env

| Flag / Env | Effect |
|------------|--------|
| `--detail` | Full P&L tables, daily breakdown, reconciliation, progress logs |
| `--from` / `--to` | Override the auto-detected period |
| `--refresh` / `--auto-refresh` | Re-execute the Dune query |
| `--csv` / `--json` | Export |
| `L1_COST_RECIPIENT` | L1 reimbursement address |
| `OP_SHARE_RECIPIENT` | OP treasury address (enables real WETH swap) |
| `RPC_URL` | Celo RPC (default forno) |
| `NO_COLOR` | Disable ANSI colors (also off when piped) |

## Stuck Vault Stablecoins

ERC-20 stablecoins paid as fees accumulate in the Vault, which (v1.5.0-beta.3)
lacks `sweepERC20()`. They are **excluded from all distribution math** and left
untouched until a vault upgrade.
