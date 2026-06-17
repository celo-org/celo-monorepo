#!/usr/bin/env python3
"""
Celo L2 Sequencer Fee P&L Report Generator

Fetches revenue and cost data from Dune Analytics for a given date range,
converts everything to both CELO and USD using daily exchange rates,
and outputs per-day and total summaries.

Usage:
    # Default: current state + next actions only
    python3 report.py

    # Full P&L tables + daily breakdown
    python3 report.py --detail

    # Detail without per-day table
    python3 report.py --detail --no-daily

    # Explicit date range
    python3 report.py --from 2025-03-26 --to 2025-04-30

    # Force re-execution of Dune query (even if fresh)
    python3 report.py --refresh

    # Skip default auto-refresh of stale Dune data
    python3 report.py --no-auto-refresh

    # Export
    python3 report.py --csv output.csv
    python3 report.py --json output.json

Flags:
    --from YYYY-MM-DD       Start date (default: day after last vault withdrawal)
    --to YYYY-MM-DD         End date (default: yesterday)
    --detail                Show full P&L tables and daily breakdown
    --no-daily              With --detail, skip per-day table
    --refresh               Force re-execute Dune query (even if fresh)
    --no-auto-refresh       Disable default auto-refresh of stale Dune data
    --csv FILE              Export daily rows + totals to CSV
    --json FILE             Export daily rows + totals to JSON
    --api-key KEY           Dune API key (default: DUNE_API_KEY env var)

Env vars (optional):
    DUNE_API_KEY            Dune API key (required)
    RPC_URL                 Celo RPC (default: https://forno.celo.org)
    L1_COST_RECIPIENT       Address for L1 cost reimbursement (shown in step [4])
    OP_SHARE_RECIPIENT      Address for OP Superchain share (shown in step [5])

Requires:
    DUNE_API_KEY environment variable (or --api-key flag)
    cast (foundry) for on-chain reconciliation checks

Pricing strategy:
    CELO:  Daily market price from Dune prices.day (reliable - heavily traded)
    USDT:  $1.00 (USD peg)
    USDC:  $1.00 (USD peg)
    USDm:  $1.00 (Mento USD peg)
    EURm:  Daily price from Dune prices.day (tracks EUR/USD forex via Mento DEX)
    ETH:   Daily market price from Dune prices.day (reliable - top-3 asset)
"""

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
import time

DUNE_API = "https://api.dune.com/api/v1"
QUERY_ID = 6898547  # Celo Mainnet P&L input

VAULT = "0x4200000000000000000000000000000000000011"
FEE_HANDLER = "0xcD437749E43A154C07F3553504c68fBfD56B8778"
CELO_TOKEN_ADDR = "0x471EcE3750Da237f93B8E339c536989b8978a438"
SAFE_ADDR = "0x7A1E98FC9a008107DbD1f430a05Ace8cf6f3FE19"
L2_GENESIS_DATE = "2025-03-26"

# CGP-287 (https://mondo.celo.org/governance/287) returned pre-cutoff revenue
# to Governance. Revenue on/before this date is EXCLUDED from this report.
CGP_287_CUTOFF_DATE = "2026-04-08"

# CGP-287 already paid to Governance on 2026-04-01 (Safe -> Gov, tx
# 0xfbe1dac031726b6f580b561bfc2a80262b9529d09e4463fc3600cc74dce31a86).
# The pre-cutoff revenue equivalent computed below is reduced by this amount;
# the remainder is the surplus that gets routed to SURPLUS_RECIPIENT_DEFAULT.
CGP_287_PAID_TO_GOV_CELO = 1748952

# Recipient defaults (overridable via env vars). Placeholders point to the
# Operations Safe itself; real addresses TBD.
L1_COST_RECIPIENT_DEFAULT = "0x6b145ebf66602ec524b196426b46631259689583"
OP_SHARE_RECIPIENT_DEFAULT = SAFE_ADDR     # placeholder = Operations Safe
SURPLUS_RECIPIENT_DEFAULT = SAFE_ADDR      # placeholder = Operations Safe

# SequencerFeeVault Withdrawal event topic
WITHDRAWAL_TOPIC = "0x38e04cbeb8c10f8f568618aa75be0f10b6729b8b4237743b4de20cbcde2839ee"

# Stablecoin USD prices (hardcoded pegs)
STABLE_PEGS = {
    "USDT": 1.00,
    "USDC": 1.00,
    "USDm": 1.00,
}

# Carbon fund fraction (read live from FeeHandler in main(), default 0)
CARBON_FRACTION = 0.0


# ---------------------------------------------------------------------------
# Dune API
# ---------------------------------------------------------------------------

def dune_request(path: str, api_key: str, method: str = "GET", body: dict = None) -> dict:
    from urllib.request import Request, urlopen
    from urllib.error import HTTPError

    url = f"{DUNE_API}{path}"
    headers = {"X-Dune-API-Key": api_key, "Content-Type": "application/json"}
    data = json.dumps(body).encode() if body else None
    req = Request(url, data=data, headers=headers, method=method)
    try:
        with urlopen(req) as resp:
            return json.loads(resp.read())
    except HTTPError as e:
        error_body = e.read().decode()
        print(f"Dune API error {e.code}: {error_body}", file=sys.stderr)
        sys.exit(1)


def trigger_execution(api_key: str) -> str:
    result = dune_request(f"/query/{QUERY_ID}/execute", api_key, method="POST")
    return result["execution_id"]


def wait_for_execution(execution_id: str, api_key: str, timeout: int = 300) -> None:
    start = time.time()
    while time.time() - start < timeout:
        status = dune_request(f"/execution/{execution_id}/status", api_key)
        if status.get("is_execution_finished"):
            state = status.get("state", "")
            if state == "QUERY_STATE_COMPLETED":
                return
            print(f"Query failed with state: {state}", file=sys.stderr)
            sys.exit(1)
        time.sleep(3)
    print(f"Query timed out after {timeout}s", file=sys.stderr)
    sys.exit(1)


def get_last_execution_info(api_key: str) -> dict:
    data = dune_request(f"/query/{QUERY_ID}/results?limit=1", api_key)
    result = data.get("result", {})
    rows = result.get("rows", [])
    metadata = result.get("metadata", {})

    latest_day = ""
    if rows:
        total = metadata.get("total_row_count", 0)
        if total > 1:
            last_page = dune_request(
                f"/query/{QUERY_ID}/results?limit=1&offset={total - 1}", api_key
            )
            last_rows = last_page.get("result", {}).get("rows", [])
            if last_rows:
                latest_day = parse_day(last_rows[0].get("day", ""))
        elif rows:
            latest_day = parse_day(rows[0].get("day", ""))

    return {
        "total_rows": metadata.get("total_row_count", 0),
        "latest_day": latest_day,
        "execution_started": data.get("execution_started_at", ""),
        "execution_ended": data.get("execution_ended_at", ""),
    }


def ensure_fresh_data(api_key: str, date_to: str, auto_refresh: bool) -> None:
    info = get_last_execution_info(api_key)
    latest = info["latest_day"]
    executed = info["execution_ended"][:10] if info["execution_ended"] else "unknown"

    print(f"Dune data: {info['total_rows']} rows, latest day: {latest}, last run: {executed}", file=sys.stderr)

    if latest and latest < date_to:
        gap_days = (dt.datetime.strptime(date_to, "%Y-%m-%d") - dt.datetime.strptime(latest, "%Y-%m-%d")).days

        # 1 day behind is normal — prices.day updates at midnight UTC
        if gap_days <= 1:
            print(f"Data is 1 day behind (normal — prices.day updates at midnight UTC).", file=sys.stderr)
            print(f"Using --to {latest} instead.", file=sys.stderr)
            return  # don't refresh, just use what's available

        print(f"WARNING: Data is {gap_days} day(s) behind requested --to date ({date_to}).", file=sys.stderr)

        if auto_refresh:
            print("Auto-refreshing Dune query...", file=sys.stderr)
            exec_id = trigger_execution(api_key)
            wait_for_execution(exec_id, api_key)
            new_info = get_last_execution_info(api_key)
            print(f"Refreshed: {new_info['total_rows']} rows, latest day: {new_info['latest_day']}", file=sys.stderr)
        else:
            print("Use --refresh to update, or --auto-refresh to do it automatically.", file=sys.stderr)


def fetch_results(api_key: str, limit: int = 500) -> list:
    all_rows = []
    offset = 0
    while True:
        data = dune_request(
            f"/query/{QUERY_ID}/results?limit={limit}&offset={offset}", api_key
        )
        rows = data.get("result", {}).get("rows", [])
        all_rows.extend(rows)
        total = data.get("result", {}).get("metadata", {}).get("total_row_count", 0)
        offset += limit
        if offset >= total or not rows:
            break
    return all_rows


# ---------------------------------------------------------------------------
# Computation
# ---------------------------------------------------------------------------

def parse_day(day_str: str) -> str:
    return day_str[:10]


def compute_row(row: dict) -> dict:
    """Compute derived P&L fields for a single day."""
    fee_celo = row.get("fee_CELO", 0) or 0
    fee_usdt = row.get("fee_USDT", 0) or 0
    fee_usdm = row.get("fee_USDm", 0) or 0
    fee_eurm = row.get("fee_EURm", 0) or 0
    fee_usdc = row.get("fee_USDC", 0) or 0

    fee_celo_usd = row.get("fee_CELO_usd", 0) or 0
    fee_eurm_usd = row.get("fee_EURm_usd", 0) or 0
    others_usd = row.get("others_usd", 0) or 0

    # Override stablecoin USD values with hardcoded pegs
    fee_usdt_usd = fee_usdt * STABLE_PEGS["USDT"]
    fee_usdc_usd = fee_usdc * STABLE_PEGS["USDC"]
    fee_usdm_usd = fee_usdm * STABLE_PEGS["USDm"]
    # EURm: keep Dune's price (tracks EUR/USD forex)

    celo_price = fee_celo_usd / fee_celo if fee_celo > 0 else 0

    total_revenue_usd = (
        fee_celo_usd + fee_usdt_usd + fee_usdm_usd
        + fee_eurm_usd + fee_usdc_usd + others_usd
    )
    total_revenue_celo = total_revenue_usd / celo_price if celo_price > 0 else 0

    # L1 costs - convert each item at THIS day's prices
    batcher_eth = row.get("batcher_cost_eth", 0) or 0
    proposer_eth = row.get("proposer_cost_eth", 0) or 0
    challenger_eth = row.get("challenger_cost_eth", 0) or 0
    eigenda_eth = row.get("EigenDA_cost_eth", 0) or 0
    total_l1_eth = batcher_eth + proposer_eth + challenger_eth + eigenda_eth

    eth_price = row.get("eth_price_usd", 0) or 0

    batcher_usd = batcher_eth * eth_price
    proposer_usd = proposer_eth * eth_price
    challenger_usd = challenger_eth * eth_price
    eigenda_usd = eigenda_eth * eth_price
    total_l1_usd = batcher_usd + proposer_usd + challenger_usd + eigenda_usd

    batcher_celo = batcher_usd / celo_price if celo_price > 0 else 0
    proposer_celo = proposer_usd / celo_price if celo_price > 0 else 0
    challenger_celo = challenger_usd / celo_price if celo_price > 0 else 0
    eigenda_celo = eigenda_usd / celo_price if celo_price > 0 else 0
    total_l1_celo = batcher_celo + proposer_celo + challenger_celo + eigenda_celo

    # Stablecoins are retained in the Safe (not sent to Governance).
    # Cold wallet sends the CELO equivalent (at this day's CELO price) to the
    # Safe, so Governance receives an equivalent CELO amount in place of stables.
    stables_usd = fee_usdt_usd + fee_usdc_usd + fee_usdm_usd + fee_eurm_usd
    stables_celo_equiv = stables_usd / celo_price if celo_price > 0 else 0

    carbon_celo = total_revenue_celo * CARBON_FRACTION
    carbon_usd = total_revenue_usd * CARBON_FRACTION

    # OP Superchain revenue share: max(2.5% of revenue, 15% of profit)
    # Profit for OP calc = revenue - L1 costs (carbon fund is NOT deducted before OP share)
    op_profit_celo = total_revenue_celo - total_l1_celo
    op_profit_usd = total_revenue_usd - total_l1_usd
    op_share_pct_revenue_celo = total_revenue_celo * 0.025
    op_share_pct_profit_celo = op_profit_celo * 0.15
    op_share_celo = max(op_share_pct_revenue_celo, op_share_pct_profit_celo)
    op_share_pct_revenue_usd = total_revenue_usd * 0.025
    op_share_pct_profit_usd = op_profit_usd * 0.15
    op_share_usd = max(op_share_pct_revenue_usd, op_share_pct_profit_usd)
    op_share_method = "15% of profit" if op_share_pct_profit_celo >= op_share_pct_revenue_celo else "2.5% of revenue"
    # OP share is paid as WETH (CELO -> WETH swap on Uniswap V3 inside Safe batch)
    op_share_weth = op_share_usd / eth_price if eth_price > 0 else 0

    total_costs_celo = carbon_celo + total_l1_celo + op_share_celo
    total_costs_usd = carbon_usd + total_l1_usd + op_share_usd

    profit_celo = total_revenue_celo - total_costs_celo
    profit_usd = total_revenue_usd - total_costs_usd

    return {
        "day": parse_day(row.get("day", "")),
        "celo_price_usd": celo_price,
        "eth_price_usd": eth_price,
        "fee_CELO": fee_celo,
        "fee_USDT": fee_usdt,
        "fee_USDm": fee_usdm,
        "fee_EURm": fee_eurm,
        "fee_USDC": fee_usdc,
        "fee_CELO_usd": fee_celo_usd,
        "fee_USDT_usd": fee_usdt_usd,
        "fee_USDm_usd": fee_usdm_usd,
        "fee_EURm_usd": fee_eurm_usd,
        "fee_USDC_usd": fee_usdc_usd,
        "others_usd": others_usd,
        "total_revenue_usd": total_revenue_usd,
        "total_revenue_celo": total_revenue_celo,
        "batcher_cost_eth": batcher_eth,
        "batcher_cost_usd": batcher_usd,
        "batcher_cost_celo": batcher_celo,
        "proposer_cost_eth": proposer_eth,
        "proposer_cost_usd": proposer_usd,
        "proposer_cost_celo": proposer_celo,
        "challenger_cost_eth": challenger_eth,
        "challenger_cost_usd": challenger_usd,
        "challenger_cost_celo": challenger_celo,
        "eigenda_cost_eth": eigenda_eth,
        "eigenda_cost_usd": eigenda_usd,
        "eigenda_cost_celo": eigenda_celo,
        "total_l1_cost_eth": total_l1_eth,
        "total_l1_cost_usd": total_l1_usd,
        "total_l1_cost_celo": total_l1_celo,
        "carbon_fund_celo": carbon_celo,
        "carbon_fund_usd": carbon_usd,
        "op_share_celo": op_share_celo,
        "op_share_usd": op_share_usd,
        "op_share_weth": op_share_weth,
        "op_share_method": op_share_method,
        "stables_usd": stables_usd,
        "stables_celo_equiv": stables_celo_equiv,
        "total_costs_celo": total_costs_celo,
        "total_costs_usd": total_costs_usd,
        "profit_celo": profit_celo,
        "profit_usd": profit_usd,
    }


def filter_rows(rows: list, date_from: str, date_to: str) -> list:
    return [r for r in rows if date_from <= parse_day(r.get("day", "")) <= date_to]


def sum_rows(computed: list) -> dict:
    if not computed:
        return {}
    totals = {}
    for key in computed[0]:
        if key == "day":
            continue
        if key == "op_share_method":
            continue  # recalculated below
        if key in ("celo_price_usd", "eth_price_usd"):
            vals = [r[key] for r in computed if r[key] > 0]
            totals[key] = sum(vals) / len(vals) if vals else 0
        else:
            totals[key] = sum(r[key] for r in computed)

    # Recalculate OP share method for the total period
    totals["op_share_method"] = (
        "15% of profit" if totals.get("op_share_celo", 0) > totals.get("total_revenue_celo", 0) * 0.025 + 0.01
        else "2.5% of revenue"
    )
    totals["day"] = f"{computed[0]['day']} to {computed[-1]['day']}"
    totals["num_days"] = len(computed)
    return totals


# ---------------------------------------------------------------------------
# Display
# ---------------------------------------------------------------------------

def print_report(computed: list, totals: dict, show_daily: bool = True):
    print("=" * 80)
    print("  CELO L2 SEQUENCER FEE P&L REPORT")
    print(f"  Period: {totals['day']} ({totals['num_days']} days)")
    print("=" * 80)

    print("\n-- REVENUE ----------------------------------------------------------")
    print(f"  {'Token':<8} {'Amount':>14} {'USD Value':>14} {'% of Total':>10}")
    print(f"  {'--------'} {'----------':>14} {'----------':>14} {'------':>10}")

    rev_items = [
        ("CELO", totals["fee_CELO"], totals["fee_CELO_usd"]),
        ("USDT", totals["fee_USDT"], totals["fee_USDT_usd"]),
        ("USDm", totals["fee_USDm"], totals["fee_USDm_usd"]),
        ("EURm", totals["fee_EURm"], totals["fee_EURm_usd"]),
        ("USDC", totals["fee_USDC"], totals["fee_USDC_usd"]),
        ("Others", 0, totals["others_usd"]),
    ]
    total_usd = totals["total_revenue_usd"]
    for name, amount, usd in rev_items:
        pct = (usd / total_usd * 100) if total_usd > 0 else 0
        amt_str = f"{amount:,.2f}" if name != "Others" else ""
        print(f"  {name:<8} {amt_str:>14}  ${usd:>13,.2f} {pct:>9.1f}%")

    print(f"  {'--------'} {'-'*14}  {'-'*14} {'-'*10}")
    print(f"  {'TOTAL':<8} {totals['total_revenue_celo']:>14,.2f}  ${total_usd:>13,.2f} {'100.0%':>10}")
    print(f"  {'':8} {'CELO':>14}")

    print("\n-- L1 COSTS ---------------------------------------------------------")
    print(f"  {'Item':<14} {'ETH':>12} {'USD':>14} {'CELO':>14}")
    print(f"  {'-'*14} {'-'*12} {'-'*14} {'-'*14}")

    cost_items = [
        ("Batcher", totals["batcher_cost_eth"], totals["batcher_cost_usd"], totals["batcher_cost_celo"]),
        ("Proposer", totals["proposer_cost_eth"], totals["proposer_cost_usd"], totals["proposer_cost_celo"]),
        ("Challenger", totals["challenger_cost_eth"], totals["challenger_cost_usd"], totals["challenger_cost_celo"]),
        ("EigenDA", totals["eigenda_cost_eth"], totals["eigenda_cost_usd"], totals["eigenda_cost_celo"]),
    ]
    for name, eth, usd, celo in cost_items:
        print(f"  {name:<14} {eth:>12.4f} ${usd:>13,.2f} {celo:>14,.2f}")

    print(f"  {'-'*14} {'-'*12} {'-'*14} {'-'*14}")
    print(f"  {'TOTAL L1':<14} {totals['total_l1_cost_eth']:>12.4f} ${totals['total_l1_cost_usd']:>13,.2f} {totals['total_l1_cost_celo']:>14,.2f}")

    print("\n-- P&L SUMMARY ------------------------------------------------------")
    print(f"  {'':30} {'CELO':>14} {'USD':>14}")
    print(f"  {'-'*30} {'-'*14} {'-'*14}")
    op_method = totals.get('op_share_method', '?')
    print(f"  {'Total Revenue':<30} {totals['total_revenue_celo']:>14,.2f} ${totals['total_revenue_usd']:>13,.2f}")
    carbon_label = f"Carbon Fund ({CARBON_FRACTION*100:.0f}%)"
    print(f"  {carbon_label:<30} {totals['carbon_fund_celo']:>14,.2f} ${totals['carbon_fund_usd']:>13,.2f}")
    print(f"  {'L1 Operating Costs':<30} {totals['total_l1_cost_celo']:>14,.2f} ${totals['total_l1_cost_usd']:>13,.2f}")
    op_weth = totals.get('op_share_weth', 0)
    print(f"  {'OP Share (' + op_method + ')':<30} {totals['op_share_celo']:>14,.2f} ${totals['op_share_usd']:>13,.2f}")
    print(f"  {'  -> swapped to WETH':<30} {op_weth:>14,.6f} {'(WETH)':>14}")
    print(f"  {'-'*30} {'-'*14} {'-'*14}")
    print(f"  {'Total Costs':<30} {totals['total_costs_celo']:>14,.2f} ${totals['total_costs_usd']:>13,.2f}")
    print(f"  {'='*30} {'='*14} {'='*14}")
    print(f"  {'NET PROFIT':<30} {totals['profit_celo']:>14,.2f} ${totals['profit_usd']:>13,.2f}")

    print(f"\n-- STABLES RETAINED / COLD-WALLET TOP-UP ----------------------------")
    print(f"  Stables stay in Safe. Cold wallet provides CELO equivalent")
    print(f"  (computed per-day at that day's CELO price) to Governance.")
    print(f"  {'Stables retained (USD)':<30} {'':>14} ${totals['stables_usd']:>13,.2f}")
    print(f"  {'Cold-wallet CELO top-up':<30} {totals['stables_celo_equiv']:>14,.2f} {'CELO':>14}")

    n = totals["num_days"]
    print(f"\n-- DAILY AVERAGES ---------------------------------------------------")
    print(f"  Avg CELO price:    ${totals['celo_price_usd']:.4f}")
    print(f"  Avg ETH price:     ${totals['eth_price_usd']:,.2f}")
    print(f"  Avg daily revenue: {totals['total_revenue_celo']/n:,.2f} CELO (${totals['total_revenue_usd']/n:,.2f})")
    print(f"  Avg daily costs:   {totals['total_costs_celo']/n:,.2f} CELO (${totals['total_costs_usd']/n:,.2f})")
    print(f"  Avg daily profit:  {totals['profit_celo']/n:,.2f} CELO (${totals['profit_usd']/n:,.2f})")

    if show_daily:
        print(f"\n-- DAILY BREAKDOWN --------------------------------------------------")
        print(f"  {'Day':<12} {'CELO$':>7} {'Rev CELO':>12} {'Rev USD':>12} {'L1 ETH':>10} {'Cost CELO':>12} {'Profit CELO':>12}")
        print(f"  {'-'*12} {'-'*7} {'-'*12} {'-'*12} {'-'*10} {'-'*12} {'-'*12}")
        for r in computed:
            print(
                f"  {r['day']:<12} "
                f"${r['celo_price_usd']:>6.4f} "
                f"{r['total_revenue_celo']:>12,.1f} "
                f"${r['total_revenue_usd']:>11,.1f} "
                f"{r['total_l1_cost_eth']:>10.4f} "
                f"{r['total_costs_celo']:>12,.1f} "
                f"{r['profit_celo']:>12,.1f}"
            )

    print("\n" + "=" * 80)


def print_pre_cutoff_sweep(celo_total: float, usd_total: float, num_days: int) -> None:
    """One-time sweep batch for pre-CGP-287 revenue.

    CGP-287 already returned this revenue to Governance. The sweep moves the
    equivalent CELO amount from a cold wallet to a TBD recipient (provided by
    the operator). Generated as a separate Safe batch (sweep-batch.json).
    """
    YELLOW = "\033[1;33m"
    CYAN = "\033[1;36m"
    BOLD = "\033[1m"
    RESET = "\033[0m"

    print("")
    print(f"{BOLD}-- CGP-287 PRE-CUTOFF SWEEP (one-time) ------------------------------{RESET}")
    print(f"  Cutoff date:               {CGP_287_CUTOFF_DATE} (last day covered by CGP-287)")
    print(f"  Pre-cutoff period:         {L2_GENESIS_DATE} -> {CGP_287_CUTOFF_DATE} ({num_days} days)")
    print(f"  Pre-cutoff revenue (USD):  ${usd_total:,.2f}")
    print(f"  {BOLD}Pre-cutoff CELO equiv:     {celo_total:,.2f} CELO{RESET}  (at daily prices)")
    print(f"")
    print(f"  {YELLOW}Generate sweep batch (cold wallet Safe -> TBD recipient):{RESET}")
    print(f"  {CYAN}python3 prepare-sweep-batch.py \\")
    print(f"    --celo-amount {celo_total:.6f} \\")
    print(f"    --recipient <RECIPIENT_TBD> \\")
    print(f"    --cold-wallet-safe <COLD_WALLET_SAFE> \\")
    print(f"    > sweep-batch.json{RESET}")


def write_csv(computed: list, totals: dict, path: str):
    if not computed:
        return
    keys = list(computed[0].keys())
    with open(path, "w") as f:
        f.write(",".join(keys) + "\n")
        for row in computed:
            f.write(",".join(str(row[k]) for k in keys) + "\n")
        f.write(",".join(str(totals.get(k, "")) for k in keys) + "\n")
    print(f"CSV written to {path}", file=sys.stderr)


def write_json(computed: list, totals: dict, path: str):
    output = {"daily": computed, "totals": totals}
    with open(path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"JSON written to {path}", file=sys.stderr)


# ---------------------------------------------------------------------------
# On-chain helpers
# ---------------------------------------------------------------------------

def cast_cmd(args: list[str], timeout: int = 15) -> str:
    result = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
    return result.stdout.strip() if result.returncode == 0 else ""


def timestamp_to_block(ts: int, rpc: str) -> str:
    return cast_cmd(["cast", "find-block", "--rpc-url", rpc, str(ts)])


def suggest_date_range(rpc: str, api_key: str = None) -> tuple:
    """Suggest a date range: day after last withdrawal to yesterday.

    Uses Dune API to find the last vault withdrawal (much faster than scanning
    logs via RPC). Falls back to RPC if no API key.
    """
    yesterday = (dt.datetime.now(dt.timezone.utc).date() - dt.timedelta(days=1)).isoformat()

    if api_key:
        return _suggest_via_dune(api_key, yesterday)

    return _suggest_via_rpc(rpc, yesterday)


def _suggest_via_dune(api_key: str, yesterday: str) -> tuple:
    """Find last vault withdrawal using Dune API."""
    try:
        # Create a temp query to find the last withdrawal
        create_resp = dune_request("/query", api_key, method="POST", body={
            "name": "tmp_last_vault_withdrawal",
            "query_sql": (
                "SELECT block_time FROM celo.logs "
                "WHERE contract_address = 0x4200000000000000000000000000000000000011 "
                "AND topic0 = 0x38e04cbeb8c10f8f568618aa75be0f10b6729b8b4237743b4de20cbcde2839ee "
                "ORDER BY block_number DESC LIMIT 1"
            ),
            "is_private": False,
        })
        qid = create_resp.get("query_id")
        if not qid:
            return L2_GENESIS_DATE, yesterday, "could not create Dune query"

        # Execute
        exec_resp = dune_request(f"/query/{qid}/execute", api_key, method="POST")
        exec_id = exec_resp.get("execution_id")

        # Wait
        for _ in range(20):
            status = dune_request(f"/execution/{exec_id}/status", api_key)
            if status.get("is_execution_finished"):
                break
            time.sleep(3)

        # Fetch result
        results = dune_request(f"/query/{qid}/results", api_key)
        rows = results.get("result", {}).get("rows", [])

        if not rows:
            return L2_GENESIS_DATE, yesterday, "no prior withdrawals found, using L2 genesis"

        withdrawal_time = rows[0].get("block_time", "")[:10]
        from_date = (dt.datetime.strptime(withdrawal_time, "%Y-%m-%d") + dt.timedelta(days=1)).strftime("%Y-%m-%d")

        return from_date, yesterday, f"last withdrawal was on {withdrawal_time}"

    except Exception as e:
        return L2_GENESIS_DATE, yesterday, f"Dune auto-detect failed ({e}), using L2 genesis"


def _suggest_via_rpc(rpc: str, yesterday: str) -> tuple:
    """Find last vault withdrawal by scanning recent logs via RPC."""
    try:
        latest_block = cast_cmd(["cast", "block-number", "--rpc-url", rpc])
        scan_from = str(max(31056500, int(latest_block) - 5_000_000)) if latest_block else "31056500"

        logs_raw = cast_cmd([
            "cast", "logs",
            "--from-block", scan_from,
            "--to-block", "latest",
            "--address", VAULT,
            WITHDRAWAL_TOPIC,
            "--rpc-url", rpc,
        ], timeout=30)

        if not logs_raw or "transactionHash" not in logs_raw:
            return L2_GENESIS_DATE, yesterday, "no recent withdrawals found (scanned last ~170 days), using L2 genesis"

        block_numbers = re.findall(r'"blockNumber"\s*:\s*"(0x[0-9a-fA-F]+)"', logs_raw)
        if not block_numbers:
            return L2_GENESIS_DATE, yesterday, "could not parse withdrawal blocks"

        last_block = int(block_numbers[-1], 16)
        ts_raw = cast_cmd(["cast", "block", str(last_block), "--field", "timestamp", "--rpc-url", rpc])
        if not ts_raw:
            return L2_GENESIS_DATE, yesterday, "could not get withdrawal block timestamp"

        withdrawal_date = dt.datetime.utcfromtimestamp(int(ts_raw)).strftime("%Y-%m-%d")
        from_date = (dt.datetime.strptime(withdrawal_date, "%Y-%m-%d") + dt.timedelta(days=1)).strftime("%Y-%m-%d")

        return from_date, yesterday, f"last withdrawal was on {withdrawal_date}"

    except Exception as e:
        return L2_GENESIS_DATE, yesterday, f"auto-detect failed ({e}), using L2 genesis"


def check_operations_during_period(date_from: str, date_to: str, rpc: str, computed: list = None, totals: dict = None) -> None:
    """Check if vault.withdraw() was called during the reporting period."""
    print("\n-- RECONCILIATION CHECK ---------------------------------------------")

    try:
        ts_from = int(dt.datetime.strptime(date_from, "%Y-%m-%d").replace(
            tzinfo=dt.timezone.utc).timestamp())
        ts_to = int(dt.datetime.strptime(date_to, "%Y-%m-%d").replace(
            tzinfo=dt.timezone.utc).timestamp()) + 86400

        block_from = timestamp_to_block(ts_from, rpc)
        block_to = timestamp_to_block(ts_to, rpc)

        if not block_from or not block_to:
            print("  Could not resolve block numbers - skipping check.")
            return

        # Limit scan to 2M blocks to avoid timeout
        partial_scan = False
        if int(block_to) - int(block_from) > 2_000_000:
            print(f"  Period spans {int(block_to) - int(block_from):,} blocks (>2M limit).")
            print(f"  Scanning last 2M blocks only.")
            block_from = str(int(block_to) - 2_000_000)
            partial_scan = True

        logs_raw = cast_cmd([
            "cast", "logs",
            "--from-block", block_from,
            "--to-block", block_to,
            "--address", VAULT,
            WITHDRAWAL_TOPIC,
            "--rpc-url", rpc,
        ], timeout=30)

        withdrawal_count = logs_raw.count("transactionHash") if logs_raw else 0

        if withdrawal_count > 0:
            print(f"  WARNING: vault.withdraw() was called {withdrawal_count} time(s) during this period!")
            print(f"  Some CELO was already moved to the Safe.")
            print(f"  RECOMMENDATION: Use --from with the day AFTER the last withdrawal.")
        elif partial_scan:
            print(f"  PARTIAL: No vault withdrawals in scanned 2M blocks (earlier blocks NOT checked).")
            print(f"  Verify manually for blocks before {block_from} if period extends earlier.")
        else:
            print(f"  OK: No vault withdrawals during {date_from} to {date_to}.")

    except Exception as e:
        print(f"  Withdrawal check failed: {e}", file=sys.stderr)

    # Read current on-chain balances for reconciliation
    try:
        vault_celo = cast_cmd(["cast", "balance", VAULT, "--rpc-url", rpc, "--ether"])
        fh_celo = cast_cmd(["cast", "balance", FEE_HANDLER, "--rpc-url", rpc, "--ether"])

        vault_f = float(vault_celo) if vault_celo else 0
        fh_f = float(fh_celo) if fh_celo else 0

        print(f"")
        print(f"  CURRENT ON-CHAIN BALANCES:")
        print(f"  SequencerFeeVault:  {vault_f:>12,.2f} CELO  (tip + L1 data fee)")
        print(f"  FeeHandler:         {fh_f:>12,.2f} CELO  (base fee)")
        print(f"  Combined:           {vault_f + fh_f:>12,.2f} CELO")
        print(f"")
        print(f"  NOTE: The report shows TOTAL revenue ({date_from} to {date_to}),")
        print(f"  but fees are split between two contracts:")
        print(f"    - SequencerFeeVault receives tip + L1 data fee")
        print(f"    - FeeHandler receives base fee")
        print(f"  The combined balance will be LESS than the report total if")
        print(f"  FeeHandler.handleAll() was called (it sells/burns CELO).")
    except Exception:
        vault_f = 0
        fh_f = 0

    # Next steps with colors
    YELLOW = "\033[1;33m"
    GREEN = "\033[1;32m"
    CYAN = "\033[1;36m"
    RED = "\033[1;31m"
    BOLD = "\033[1m"
    RESET = "\033[0m"

    print("")
    print(f"{BOLD}-- NEXT STEPS -------------------------------------------------------{RESET}")
    print("")

    # Step 1: Withdraw
    if vault_f > 1:
        print(f"  {YELLOW}[1] WITHDRAW FROM VAULT{RESET}")
        print(f"      {vault_f:,.0f} CELO ready to withdraw (permissionless, anyone can call)")
        print(f"      {CYAN}cast send 0x4200000000000000000000000000000000000011 'withdraw()' \\")
        print(f"        --rpc-url https://forno.celo.org --private-key $PK{RESET}")
    else:
        print(f"  {GREEN}[1] WITHDRAW FROM VAULT - already empty{RESET}")

    print("")

    # Read current FeeHandler fractions from on-chain
    try:
        carbon_raw = cast_cmd(["cast", "call", FEE_HANDLER, "getCarbonFraction()(uint256)", "--rpc-url", rpc])
        carbon_frac = int(carbon_raw.split()[0]) / 1e24 if carbon_raw else 0
        clabs_raw = cast_cmd(["cast", "call", FEE_HANDLER,
            "getOtherBeneficiariesInfo(address)(uint256,string,bool)",
            "0x7A1E98FC9a008107DbD1f430a05Ace8cf6f3FE19", "--rpc-url", rpc])
        clabs_frac = int(clabs_raw.split("\n")[0].strip().split()[0]) / 1e24 if clabs_raw else 0
    except Exception:
        carbon_frac = 0.10
        clabs_frac = 0.90

    # Step 2: Process FeeHandler (permissionless, sends to beneficiaries per current fractions)
    if fh_f > 1:
        print(f"  {YELLOW}[2] PROCESS FEEHANDLER{RESET}")
        print(f"      {fh_f:,.0f} CELO + stablecoins in FeeHandler (base fee portion)")
        print(f"      handleAll() distributes: {carbon_frac*100:.0f}% to Carbon Fund, {clabs_frac*100:.0f}% to Operations Safe")
        print(f"      {CYAN}cast send 0xcD437749E43A154C07F3553504c68fBfD56B8778 'handleAll()' \\")
        print(f"        --rpc-url https://forno.celo.org --private-key $PK{RESET}")
        # Iterate all known fee currency tokens in FeeHandler
        fh_tokens = [
            ("USDT", "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e", 6),
            ("USDC", "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", 6),
            ("USDm", "0x765DE816845861e75A25fCA122bb6898B8B1282a", 18),
            ("EURm", "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73", 18),
            ("BRLm", "0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787", 18),
        ]
        fh_with_balance = []
        for sym, addr, dec in fh_tokens:
            try:
                raw = cast_cmd(["cast", "call", addr, "balanceOf(address)(uint256)", FEE_HANDLER, "--rpc-url", rpc])
                bal = int(raw.split()[0]) / (10 ** dec) if raw else 0
                if bal >= 1:
                    fh_with_balance.append((sym, addr, bal))
            except Exception:
                pass

        if fh_with_balance:
            print(f"      Also stablecoins in FeeHandler — call distribute(token) for each:")
            for sym, addr, bal in fh_with_balance:
                print(f"        {sym}: {bal:,.2f}")
                print(f"        {CYAN}cast send 0xcD437749E43A154C07F3553504c68fBfD56B8778 'distribute(address)' \\")
                print(f"          {addr} \\")
                print(f"          --rpc-url https://forno.celo.org --private-key $PK{RESET}")

    print("")

    # Step 3: Cold-wallet top-up (BEFORE Safe batch)
    cold_topup = totals.get("stables_celo_equiv", 0) if totals else 0
    stables_usd_total = totals.get("stables_usd", 0) if totals else 0

    safe_addr = "0x7A1E98FC9a008107DbD1f430a05Ace8cf6f3FE19"

    print(f"  {YELLOW}[3] COLD-WALLET CELO TOP-UP TO SAFE{RESET}")
    print(f"      Stables (${stables_usd_total:,.2f} USD) are RETAINED in the Safe.")
    print(f"      Cold wallet sends the daily-priced CELO equivalent to the Safe so")
    print(f"      Governance receives full revenue equivalent in CELO.")
    print(f"      {BOLD}Amount to send from cold wallet: {cold_topup:,.2f} CELO{RESET}")
    print(f"      Destination: {CYAN}{safe_addr}{RESET}")
    print(f"      {CYAN}cast send {CELO_TOKEN_ADDR} 'transfer(address,uint256)' \\")
    print(f"        {safe_addr} \\")
    print(f"        $(cast --to-wei {cold_topup:.6f} ether) \\")
    print(f"        --rpc-url https://forno.celo.org --private-key $COLD_PK{RESET}")
    print("")

    # Step 4: Generate Safe batch + execute
    print(f"  {YELLOW}[4] DISTRIBUTE VIA SAFE BATCH{RESET}")
    print(f"      - CELO -> Governance (after L1 cost + OP share + reserve withheld)")
    print(f"      - OP share: CELO swapped -> WETH via Uniswap V3 -> OP recipient")
    print(f"      - Stables: stay in Safe (NOT transferred)")
    print(f"      Run AFTER steps [1], [2], [3] so all CELO is in the Safe")
    print(f"")

    try:
        l1_cost = sum(r.get("total_l1_cost_celo", 0) for r in computed) if computed else 0

        safe_tokens = [
            ("CELO", "0x471EcE3750Da237f93B8E339c536989b8978a438", 18),
            ("USDT", "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e", 6),
            ("USDC", "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", 6),
            ("USDm", "0x765DE816845861e75A25fCA122bb6898B8B1282a", 18),
            ("EURm", "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73", 18),
        ]

        # Estimate Safe CELO after steps [1]+[2]+[3]
        vault_celo_raw = cast_cmd(["cast", "balance", VAULT, "--rpc-url", rpc, "--ether"])
        vault_celo_f = float(vault_celo_raw) if vault_celo_raw else 0
        fh_celo_to_safe = fh_f * clabs_frac

        op_share = totals.get("op_share_celo", 0) if totals else 0
        op_share_weth_amt = totals.get("op_share_weth", 0) if totals else 0
        op_method_str = totals.get("op_share_method", "?") if totals else "?"

        print(f"      Estimated Safe CELO after steps [1]+[2]+[3]:")
        total_celo = 0
        for name, addr, dec in safe_tokens:
            bal_raw = cast_cmd(["cast", "call", addr, "balanceOf(address)(uint256)", safe_addr, "--rpc-url", rpc])
            bal = int(bal_raw.split()[0]) / (10 ** dec) if bal_raw else 0
            if name == "CELO":
                total_celo = bal + vault_celo_f + fh_celo_to_safe + cold_topup

        # CGP-287 residual: pre-cutoff revenue equiv MINUS what CGP-287 already paid to Gov.
        # This residual physically sits in Vault/FH/Safe right now and must be carved out
        # of the Gov transfer, routed to SURPLUS_RECIPIENT_DEFAULT (placeholder = Safe).
        pre_cutoff_total_celo = sum(r["total_revenue_celo"] for r in pre_cutoff_computed) \
            if 'pre_cutoff_computed' in globals() else 2600103
        surplus_celo = max(pre_cutoff_total_celo - CGP_287_PAID_TO_GOV_CELO, 0)

        # OP recipient placeholder = Safe -> swap SKIPPED, OP CELO stays in Safe.
        op_recipient = os.environ.get("OP_SHARE_RECIPIENT", OP_SHARE_RECIPIENT_DEFAULT)
        op_is_placeholder = op_recipient.lower() == SAFE_ADDR.lower()
        # Surplus recipient placeholder = Safe -> self-transfer (audit trail), stays in Safe.
        surplus_recipient = os.environ.get("SURPLUS_RECIPIENT", SURPLUS_RECIPIENT_DEFAULT)
        surplus_is_self = surplus_recipient.lower() == SAFE_ADDR.lower()

        # OP CELO leaves Safe only if swap runs; surplus only if recipient != Safe.
        op_celo_out = op_share if not op_is_placeholder else 0
        surplus_celo_out = surplus_celo if not surplus_is_self else 0
        # When OP/surplus stay in Safe, deduct from Gov so they remain rather than leak.
        gov_celo = total_celo - l1_cost - op_celo_out - surplus_celo_out
        if op_is_placeholder:
            gov_celo -= op_share
        if surplus_is_self:
            gov_celo -= surplus_celo

        print(f"        Total CELO:       {total_celo:>12,.2f}  (Safe + Vault + {clabs_frac*100:.0f}% FeeHandler + cold top-up)")
        print(f"        - L1 costs:       {l1_cost:>12,.0f}  CELO  -> {L1_COST_RECIPIENT_DEFAULT}")
        if op_is_placeholder:
            print(f"        - OP share:       {op_share:>12,.0f}  CELO  ({op_method_str})  -> Safe (placeholder, swap SKIPPED)")
        else:
            print(f"        - OP share:       {op_share:>12,.0f}  CELO  ({op_method_str})  -> swap to WETH (~{op_share_weth_amt:.4f}) -> {op_recipient}")
        if surplus_is_self:
            print(f"        - Surplus (CGP):  {surplus_celo:>12,.0f}  CELO  -> Safe self-transfer (residual = {pre_cutoff_total_celo:,.0f} - {CGP_287_PAID_TO_GOV_CELO:,.0f} paid)")
        else:
            print(f"        - Surplus (CGP):  {surplus_celo:>12,.0f}  CELO  -> {surplus_recipient}")
        print(f"        = {BOLD}To Governance:  {gov_celo:>12,.2f} CELO{RESET}")

        print(f"")
        print(f"      Stablecoins RETAINED in Safe (not transferred):")
        for name, addr, dec in safe_tokens:
            if name == "CELO":
                continue
            bal_raw = cast_cmd(["cast", "call", addr, "balanceOf(address)(uint256)", safe_addr, "--rpc-url", rpc])
            bal = int(bal_raw.split()[0]) / (10 ** dec) if bal_raw else 0
            fh_bal_raw = cast_cmd(["cast", "call", addr, "balanceOf(address)(uint256)", FEE_HANDLER, "--rpc-url", rpc])
            fh_bal = int(fh_bal_raw.split()[0]) / (10 ** dec) if fh_bal_raw else 0
            total = bal + fh_bal * clabs_frac
            if total >= 0.01:
                print(f"        {BOLD}{name}:  {total:>12,.2f}{RESET}  -> Safe")
    except Exception:
        l1_cost = 0
        op_share = 0
        op_share_weth_amt = 0
        surplus_celo = 0
        op_is_placeholder = True
        surplus_is_self = True

    l1_recipient = os.environ.get("L1_COST_RECIPIENT", L1_COST_RECIPIENT_DEFAULT)
    op_recipient = os.environ.get("OP_SHARE_RECIPIENT", OP_SHARE_RECIPIENT_DEFAULT)
    surplus_recipient = os.environ.get("SURPLUS_RECIPIENT", SURPLUS_RECIPIENT_DEFAULT)

    # Slippage suggestion: 99% of expected (1% slippage tolerance) — operator can override
    weth_min_suggest = op_share_weth_amt * 0.99 if op_share_weth_amt > 0 else 0

    print(f"")
    print(f"      a) Generate the batch (run AFTER steps [1]+[2]+[3]):")
    if op_is_placeholder:
        print(f"         (OP recipient = Safe placeholder -> swap SKIPPED; --op-share-weth-min not needed)")
    else:
        print(f"         (--op-share-weth-min = {weth_min_suggest:.6f} WETH = 1% slippage; VERIFY via live pool quote before signing)")
    print(f"      {CYAN}python3 prepare-safe-batch.py \\")
    print(f"        --l1-cost-celo {l1_cost:.0f} \\")
    print(f"        --l1-cost-recipient {l1_recipient} \\")
    print(f"        --op-share-celo {op_share:.0f} \\")
    print(f"        --op-share-recipient {op_recipient} \\")
    if not op_is_placeholder:
        print(f"        --op-share-weth-min {weth_min_suggest:.6f} \\")
    print(f"        --surplus-celo {surplus_celo:.0f} \\")
    print(f"        --surplus-recipient {surplus_recipient} \\")
    print(f"        > batch.json{RESET}")
    print(f"")
    print(f"      b) Upload batch.json to Safe Transaction Builder:")
    print(f"         {CYAN}https://app.safe.global/transactions/queue?safe=celo:{safe_addr}{RESET}")
    print(f"         -> Transaction Builder -> drag & drop batch.json")
    print(f"")
    print(f"      c) 2-of-5 signers approve and execute")

    print("")
    print(f"  {YELLOW}[5] RECIPIENT ADDRESSES{RESET}")
    print(f"      L1_COST_RECIPIENT  = {l1_recipient}  (hardwired default)")
    if op_is_placeholder:
        print(f"      OP_SHARE_RECIPIENT = {op_recipient}  {RED}(placeholder = Safe -> swap SKIPPED){RESET}")
    else:
        print(f"      OP_SHARE_RECIPIENT = {op_recipient}  (real address -> swap to WETH enabled)")
    if surplus_is_self:
        print(f"      SURPLUS_RECIPIENT  = {surplus_recipient}  {RED}(placeholder = Safe -> self-transfer){RESET}")
    else:
        print(f"      SURPLUS_RECIPIENT  = {surplus_recipient}  (real address)")
    print(f"      Override via env vars (L1_COST_RECIPIENT, OP_SHARE_RECIPIENT, SURPLUS_RECIPIENT)")

    # Stuck stablecoins in vault
    try:
        vault_usdt_raw = cast_cmd(["cast", "call",
            "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e",
            "balanceOf(address)(uint256)", VAULT, "--rpc-url", rpc])
        vault_usdm_raw = cast_cmd(["cast", "call",
            "0x765DE816845861e75A25fCA122bb6898B8B1282a",
            "balanceOf(address)(uint256)", VAULT, "--rpc-url", rpc])
        usdt_f = int(vault_usdt_raw.split()[0]) / 1e6 if vault_usdt_raw else 0
        usdm_f = int(vault_usdm_raw.split()[0]) / 1e18 if vault_usdm_raw else 0
        if usdt_f > 1 or usdm_f > 1:
            print("")
            print(f"  {RED}[!] STABLECOINS STUCK IN VAULT (no sweepERC20){RESET}")
            if usdt_f > 1:
                print(f"      USDT: {usdt_f:,.2f}")
            if usdm_f > 1:
                print(f"      USDm: {usdm_f:,.2f}")
            print(f"      {BOLD}Requires vault contract upgrade to add sweepERC20().{RESET}")
    except Exception:
        pass

    print("")
    print("=" * 80)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Celo L2 Sequencer Fee P&L Report")
    parser.add_argument("--from", dest="date_from", help="Start date (YYYY-MM-DD). Omit to auto-detect from last vault withdrawal.")
    parser.add_argument("--to", dest="date_to", help="End date (YYYY-MM-DD). Omit to use yesterday.")
    parser.add_argument("--api-key", default=os.environ.get("DUNE_API_KEY"), help="Dune API key")
    parser.add_argument("--refresh", action="store_true", help="Force re-execution of Dune query")
    parser.add_argument("--auto-refresh", dest="auto_refresh", action="store_true", default=True, help="Auto-refresh if data is stale (default: on)")
    parser.add_argument("--no-auto-refresh", dest="auto_refresh", action="store_false", help="Disable auto-refresh of stale Dune data")
    parser.add_argument("--detail", action="store_true", help="Show full P&L tables and daily breakdown (default: only reconciliation + next steps)")
    parser.add_argument("--no-daily", action="store_true", help="With --detail, skip per-day breakdown table")
    parser.add_argument("--csv", help="Output CSV to file")
    parser.add_argument("--json", dest="json_out", help="Output JSON to file")
    args = parser.parse_args()

    if not args.api_key:
        print("Error: DUNE_API_KEY not set. Use --api-key or set the env variable.", file=sys.stderr)
        sys.exit(1)

    rpc = os.environ.get("RPC_URL", "https://forno.celo.org")

    # Read live carbon fraction from FeeHandler
    global CARBON_FRACTION
    try:
        cf_raw = cast_cmd(["cast", "call", FEE_HANDLER, "getCarbonFraction()(uint256)", "--rpc-url", rpc])
        CARBON_FRACTION = int(cf_raw.split()[0]) / 1e24 if cf_raw else 0.0
    except Exception:
        CARBON_FRACTION = 0.0

    # Auto-detect date range if not provided
    if not args.date_from or not args.date_to:
        suggested_from, suggested_to, last_withdrawal_info = suggest_date_range(rpc, args.api_key)
        if not args.date_from:
            args.date_from = suggested_from
            print(f"Auto-detected --from: {args.date_from} ({last_withdrawal_info})", file=sys.stderr)
        if not args.date_to:
            args.date_to = suggested_to
            print(f"Auto-detected --to:   {args.date_to} (yesterday)", file=sys.stderr)
        print("", file=sys.stderr)

    # Enforce CGP-287 cutoff: report covers strictly AFTER cutoff
    min_from = (dt.datetime.strptime(CGP_287_CUTOFF_DATE, "%Y-%m-%d") + dt.timedelta(days=1)).strftime("%Y-%m-%d")
    if args.date_from < min_from:
        print(f"NOTE: --from {args.date_from} is on/before CGP-287 cutoff ({CGP_287_CUTOFF_DATE}).", file=sys.stderr)
        print(f"      Bumping --from to {min_from} (pre-cutoff revenue handled by sweep batch).", file=sys.stderr)
        args.date_from = min_from
        print("", file=sys.stderr)

    # Validate dates
    try:
        dt.datetime.strptime(args.date_from, "%Y-%m-%d")
        dt.datetime.strptime(args.date_to, "%Y-%m-%d")
    except ValueError:
        print("Error: dates must be YYYY-MM-DD format", file=sys.stderr)
        sys.exit(1)

    if args.date_from > args.date_to:
        print("Error: --from must be before --to", file=sys.stderr)
        sys.exit(1)

    # Check freshness and optionally refresh
    if args.refresh:
        print("Triggering Dune query execution...", file=sys.stderr)
        exec_id = trigger_execution(args.api_key)
        print(f"Execution ID: {exec_id}", file=sys.stderr)
        wait_for_execution(exec_id, args.api_key)
        print("Query completed.", file=sys.stderr)
    else:
        ensure_fresh_data(args.api_key, args.date_to, auto_refresh=args.auto_refresh)

    # Fetch results
    print("Fetching Dune query results...", file=sys.stderr)
    rows = fetch_results(args.api_key)
    print(f"Fetched {len(rows)} total rows.", file=sys.stderr)

    # Compute pre-cutoff sweep total (L2 genesis -> CGP-287 cutoff, inclusive)
    pre_cutoff_rows = filter_rows(rows, L2_GENESIS_DATE, CGP_287_CUTOFF_DATE)
    pre_cutoff_computed = [compute_row(r) for r in pre_cutoff_rows]
    pre_cutoff_celo = sum(r["total_revenue_celo"] for r in pre_cutoff_computed)
    pre_cutoff_usd = sum(r["total_revenue_usd"] for r in pre_cutoff_computed)

    # Filter to date range
    filtered = filter_rows(rows, args.date_from, args.date_to)
    if not filtered:
        print(f"No data found for {args.date_from} to {args.date_to}.", file=sys.stderr)
        print("Try --refresh to update the Dune query.", file=sys.stderr)
        sys.exit(1)

    print(f"Processing {len(filtered)} days in range.", file=sys.stderr)

    # Compute derived fields
    computed = [compute_row(r) for r in filtered]
    totals = sum_rows(computed)

    # Output
    if args.detail:
        print_report(computed, totals, show_daily=not args.no_daily)
    else:
        print("=" * 80)
        print(f"  CELO L2 SEQUENCER FEE REPORT  |  Period: {totals['day']} ({totals['num_days']} days)")
        print(f"  (run with --detail for full P&L and daily breakdown)")
        print("=" * 80)

    # Print pre-cutoff sweep section (one-time CGP-287 handling)
    print_pre_cutoff_sweep(pre_cutoff_celo, pre_cutoff_usd, len(pre_cutoff_computed))

    # Reconciliation check
    check_operations_during_period(args.date_from, args.date_to, rpc, computed, totals)

    if args.csv:
        write_csv(computed, totals, args.csv)

    if args.json_out:
        write_json(computed, totals, args.json_out)


if __name__ == "__main__":
    main()
