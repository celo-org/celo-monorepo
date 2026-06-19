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
| SequencerFeeVault | `0x4200…0011` | Collects the priority tip; `withdraw()` → Safe |
| BaseFeeVault | `0x4200…0019` | Collects the base fee; `withdraw()` → Safe |
| L1FeeVault | `0x4200…001A` | Collects the L1 data fee; `withdraw()` → Safe |
| FeeHandler | `0xcD43…8778` | Stablecoin fee-abstraction + CELO; distributes per beneficiary fractions |
| Operations Safe (multisig) | `0x7A1E…FE19` | 2-of-5 beneficiary; receives all withdrawals |
| Governance / Community Fund | `0xD533…7972` | Final CELO destination |
| CELO token | `0x471E…a438` | Native + ERC-20 unified |
| Uniswap V3 QuoterV2 | `0x8282…a8E8` | Live CELO→WETH quote for OP share |

> **All three OP-stack fee vaults route to the Safe.** An earlier version tracked
> only SequencerFeeVault + FeeHandler and silently missed the base/L1 fee CELO.
> Protocol-burned base fee never enters any vault and is correctly excluded — it
> never had a chance to reach the Safe.

## Reporting Period

- **Auto-detect:** `--from` = day after the last vault withdrawal; `--to` = yesterday.
- **Any window works.** The distributable is a flow reconciliation between the
  window's boundary blocks (see below), so picking an arbitrary `[A, B]` —
  including one that straddles past withdrawals/distributes — yields the correct
  in-window amount. No special pre-cutoff handling is needed: funds that accrued
  before `A` are removed by the `−balance_at(A)` term.

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

## Distributable: Per-Token Accrual (flow reconciliation)

The distributable for a window `[A, B]` is **everything that would land in the
Safe if you flushed the contracts the day before A** (so pre-window funds don't
count) **and flushed again at B** — regardless of whether it is still sitting in
the contracts or was already withdrawn/distributed mid-window. Equivalently, a
per-token flow reconciliation:

```
accrued[tok] = (sink balance at end of B) − (sink balance at block(A)) + withdrawn_to_Safe[A,B]
```

- **CELO sink** = the three OP fee vaults (native) + `clabs%`·FeeHandler (native).
- **stablecoin sink** = the FeeHandler only (vault ERC-20s are stuck — no
  `sweepERC20()` — and never reach the Safe).
- `withdrawn_to_Safe[A,B]` = vault `Withdrawal` event amounts (CELO) +
  FeeHandler→Safe `Transfer` amounts (every token), summed from Dune. The
  FeeHandler→Safe leg already nets out the carbon fraction.

Why this shape:
- `− balance_at(A)` is the "flush the day before" term: if a mid-window withdrawal
  swept funds that accrued **before** A, this cancels them out (you only get the
  in-window portion).
- `+ withdrawn_to_Safe[A,B]` adds back fees that already left the contracts during
  the window.
- Both balances are read at fixed boundary blocks, so a past window is
  **reproducible** and post-window fees do not leak in.

Burned base fee never enters a sink, so it is excluded automatically.

## Distribution Model

**Invariants:**
- Stablecoins **never** leave the Safe (retained permanently).
- Governance is paid **only in CELO**.
- The Safe's pre-existing CELO is not part of the window's accrual.

**Governance receives (all CELO):**

```
revenue_celo = accrued[CELO] + stables_CELO_equivalent
OP_share     = max(2.5% · revenue_celo, 15% · (revenue_celo − L1_costs))   # on the accrual basis
Gov          = revenue_celo − OP_share − L1_costs
```

The retained stablecoins' CELO-equivalent is supplied by a **cold wallet** so Gov
is paid entirely in CELO (the operator may offset it with pre-window CELO already
in the Safe):

```
stables_usd        = Σ accrued[stable] × price        # USD pegs + EURm/BRLm FX
stables_celo_equiv = stables_usd / celo_price          # window-average CELO price
```

## OP Superchain Share

`OP_share` is recomputed on the **accrual** revenue (not gross fees — burned base
fee isn't revenue). The CELO is swapped to WETH on Uniswap V3 (CELO/WETH 0.3%
pool) and sent to the OP recipient; the report shows a **live** QuoterV2 quote at
the current rate. If `OP_SHARE_RECIPIENT` is the Safe placeholder, the swap is
shown but not executed (recipient TBD).

## Operator Action Plan (report output)

| Step | Action | Permission |
|------|--------|------------|
| `[1]` | `withdraw()` on each of the 3 fee vaults → Safe | permissionless |
| `[2]` | `feeHandler.handleAll()` + `distribute(token)` per stablecoin | permissionless |
| `[3]` | Cold wallet sends the stables CELO-equivalent → Safe | operator cold wallet |
| `[4]` | Safe batch: CELO → Gov, OP share → WETH swap → OP recipient | 2-of-5 multisig |

Steps `[1]`–`[2]` flush the contracts into the Safe at window end (the accrual
already counts anything flushed earlier in the window). Step `[3]` tops up the
retained-stables CELO-equivalent. Step `[4]` distributes CELO to Governance.

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
