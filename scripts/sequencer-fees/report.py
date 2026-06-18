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

# ---------------------------------------------------------------------------
# Color palette (ANSI). Disabled if stdout is not a TTY or NO_COLOR is set.
# ---------------------------------------------------------------------------
_USE_COLOR = sys.stdout.isatty() and not os.environ.get("NO_COLOR")

# Verbose progress logging to stderr — only when --detail (set in main()).
_VERBOSE = False


def vlog(msg: str = "") -> None:
    if _VERBOSE:
        print(msg, file=sys.stderr)


def _c(code: str) -> str:
    return code if _USE_COLOR else ""


RESET   = _c("\033[0m")
BOLD    = _c("\033[1m")
DIM     = _c("\033[2m")
RED     = _c("\033[1;31m")
GREEN   = _c("\033[1;32m")
YELLOW  = _c("\033[1;33m")
BLUE    = _c("\033[1;34m")
MAGENTA = _c("\033[1;35m")
CYAN    = _c("\033[1;36m")
WHITE   = _c("\033[1;37m")
# 256-color accents
ORANGE  = _c("\033[38;5;208m")
TEAL    = _c("\033[38;5;43m")
PURPLE  = _c("\033[38;5;141m")
GREY    = _c("\033[38;5;245m")


def celo(amount, w=0):
    """Bright green CELO amount."""
    s = f"{amount:>{w},.2f}" if w else f"{amount:,.2f}"
    return f"{GREEN}{s}{RESET} {DIM}CELO{RESET}"


def usd(amount, w=0):
    """Teal USD amount."""
    s = f"{amount:>{w},.2f}" if w else f"{amount:,.2f}"
    return f"{TEAL}${s}{RESET}"


def num(amount, w=0):
    """Bright white bare number."""
    s = f"{amount:>{w},.2f}" if w else f"{amount:,.2f}"
    return f"{WHITE}{s}{RESET}"


def addr(a):
    """Dim purple address."""
    return f"{PURPLE}{a}{RESET}"


def hdr(text):
    """Colored section header line padded to 68 chars with dashes."""
    dashes = "-" * max(0, 68 - len(text) - 4)
    return f"{BOLD}{ORANGE}-- {text} {dashes}{RESET}"

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

    vlog(f"Dune data: {info['total_rows']} rows, latest day: {latest}, last run: {executed}")

    if latest and latest < date_to:
        gap_days = (dt.datetime.strptime(date_to, "%Y-%m-%d") - dt.datetime.strptime(latest, "%Y-%m-%d")).days

        # 1 day behind is normal — prices.day updates at midnight UTC
        if gap_days <= 1:
            vlog(f"Data is 1 day behind (normal — prices.day updates at midnight UTC).")
            vlog(f"Using --to {latest} instead.")
            return  # don't refresh, just use what's available

        vlog(f"WARNING: Data is {gap_days} day(s) behind requested --to date ({date_to}).")

        if auto_refresh:
            vlog("Auto-refreshing Dune query...")
            exec_id = trigger_execution(api_key)
            wait_for_execution(exec_id, api_key)
            new_info = get_last_execution_info(api_key)
            vlog(f"Refreshed: {new_info['total_rows']} rows, latest day: {new_info['latest_day']}")
        else:
            vlog("Use --refresh to update, or --auto-refresh to do it automatically.")


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


def print_pre_cutoff_sweep(sweep_from: str, num_days: int, celo_landed: float, stables: dict) -> None:
    """One-time sweep batch for un-withdrawn pre-CGP-287 revenue.

    Window = day after last vault withdrawal on/before cutoff -> cutoff. Already-
    withdrawn pre-cutoff revenue is excluded (it's already in the Safe). Amounts
    are the CELO + stables that landed in Vault+FeeHandler during the window.
    """
    print("")
    print(hdr("[0] PRE-CUTOFF FUNDS (CGP-287, informational)"))
    print(f"  {GREY}Window:{RESET} {CYAN}{sweep_from}{RESET} {GREY}->{RESET} {CYAN}{CGP_287_CUTOFF_DATE}{RESET} {DIM}({num_days} days){RESET}")
    print(f"  {GREY}Accrued before CGP-287 cutoff (already paid to Governance by CGP-287).")
    print(f"  This CELO lands in the Safe after step [1] and is reused in step [3]")
    print(f"  to fund the stables exchange — not paid to Gov again.{RESET}")
    print(f"  {BOLD}CELO:{RESET}    {celo(celo_landed, 14)}")
    stable_str = "   ".join(f"{WHITE}{k}{RESET} {num(v)}" for k, v in stables.items() if v >= 0.01)
    if stable_str:
        print(f"  {BOLD}Stables:{RESET} {stable_str}")


def write_csv(computed: list, totals: dict, path: str):
    if not computed:
        return
    keys = list(computed[0].keys())
    with open(path, "w") as f:
        f.write(",".join(keys) + "\n")
        for row in computed:
            f.write(",".join(str(row[k]) for k in keys) + "\n")
        f.write(",".join(str(totals.get(k, "")) for k in keys) + "\n")
    vlog(f"CSV written to {path}")


def write_json(computed: list, totals: dict, path: str):
    output = {"daily": computed, "totals": totals}
    with open(path, "w") as f:
        json.dump(output, f, indent=2)
    vlog(f"JSON written to {path}")


# ---------------------------------------------------------------------------
# On-chain helpers
# ---------------------------------------------------------------------------

def cast_cmd(args: list[str], timeout: int = 15) -> str:
    result = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
    return result.stdout.strip() if result.returncode == 0 else ""


# Uniswap V3 on Celo: QuoterV2, CELO/WETH 0.3% pool
UNI_QUOTER = "0x82825d0554fA07f7FC52Ab63c961F330fdEFa8E8"
CELO_TOKEN = "0x471EcE3750Da237f93B8E339c536989b8978a438"
WETH_TOKEN = "0xD221812de1BD094f35587EE8E174B07B6167D9Af"


def quote_celo_to_weth(celo_amount: float, rpc: str) -> float:
    """Live Uniswap V3 quote: CELO -> WETH (0.3% fee). Returns WETH out, or 0 on failure."""
    try:
        amt_wei = int(celo_amount * 1e18)
        out = cast_cmd([
            "cast", "call", UNI_QUOTER,
            "quoteExactInputSingle((address,address,uint256,uint24,uint160))(uint256,uint160,uint32,uint256)",
            f"({CELO_TOKEN},{WETH_TOKEN},{amt_wei},3000,0)",
            "--rpc-url", rpc,
        ])
        return int(out.split("\n")[0].split()[0]) / 1e18 if out else 0.0
    except Exception:
        return 0.0


def timestamp_to_block(ts: int, rpc: str) -> str:
    return cast_cmd(["cast", "find-block", "--rpc-url", rpc, str(ts)])


class DuneRunError(Exception):
    """Raised when a one-shot Dune SQL run fails or times out (as opposed to
    completing successfully with zero rows)."""


def dune_run_sql(api_key: str, sql: str, name: str, poll_secs: int = 3, max_polls: int = 60) -> list:
    """Create, execute, and fetch a one-shot Dune query — deterministically.

    Results are tied to THIS execution_id (not the query's latest execution), and
    a not-finished execution raises DuneRunError rather than returning stale/empty
    rows. An empty list means the query completed with zero rows (a real answer);
    any failure raises so callers never silently use a wrong fallback.
    """
    create_resp = dune_request("/query", api_key, method="POST", body={
        "name": name, "query_sql": sql, "is_private": False,
    })
    qid = create_resp.get("query_id")
    if not qid:
        raise DuneRunError("could not create Dune query")

    exec_id = dune_request(f"/query/{qid}/execute", api_key, method="POST").get("execution_id")
    if not exec_id:
        raise DuneRunError("could not start Dune execution")

    state = ""
    for _ in range(max_polls):
        status = dune_request(f"/execution/{exec_id}/status", api_key)
        if status.get("is_execution_finished"):
            state = status.get("state", "")
            break
        time.sleep(poll_secs)
    else:
        raise DuneRunError(f"execution {exec_id} did not finish in {poll_secs * max_polls}s")

    if state != "QUERY_STATE_COMPLETED":
        raise DuneRunError(f"execution {exec_id} ended in state {state}")

    # Fetch results for THIS execution (not /query/{qid}/results, which returns
    # the latest execution and can be stale or from a different run).
    results = dune_request(f"/execution/{exec_id}/results", api_key)
    return results.get("result", {}).get("rows", [])


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
        rows = dune_run_sql(api_key, (
            "SELECT block_time FROM celo.logs "
            "WHERE contract_address = 0x4200000000000000000000000000000000000011 "
            "AND topic0 = 0x38e04cbeb8c10f8f568618aa75be0f10b6729b8b4237743b4de20cbcde2839ee "
            "ORDER BY block_number DESC LIMIT 1"
        ), "tmp_last_vault_withdrawal")
    except DuneRunError as e:
        # Do NOT silently fall back to genesis — a wrong window corrupts every
        # downstream amount. Surface the failure so the operator re-runs.
        raise SystemExit(f"Error: Dune withdrawal lookup failed ({e}). Re-run; do not trust a guessed range.")

    if not rows:
        return L2_GENESIS_DATE, yesterday, "no prior withdrawals found, using L2 genesis"

    withdrawal_time = rows[0].get("block_time", "")[:10]
    from_date = (dt.datetime.strptime(withdrawal_time, "%Y-%m-%d") + dt.timedelta(days=1)).strftime("%Y-%m-%d")
    return from_date, yesterday, f"last withdrawal was on {withdrawal_time}"


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


def last_withdrawal_on_or_before(api_key: str, cutoff: str) -> str:
    """Return date (YYYY-MM-DD) of the last vault Withdrawal on/before cutoff.

    Empty string means there genuinely are no withdrawals in range. A query
    failure raises (via dune_run_sql) rather than returning '' — otherwise a
    transient Dune flake would silently widen the sweep window to L2 genesis and
    corrupt every downstream amount.
    """
    rows = dune_run_sql(api_key, (
        "SELECT block_time FROM celo.logs "
        "WHERE contract_address = 0x4200000000000000000000000000000000000011 "
        "AND topic0 = 0x38e04cbeb8c10f8f568618aa75be0f10b6729b8b4237743b4de20cbcde2839ee "
        f"AND block_time < TIMESTAMP '{cutoff}' + INTERVAL '1' day "
        "ORDER BY block_number DESC LIMIT 1"
    ), "tmp_last_withdrawal_before_cutoff")
    return rows[0].get("block_time", "")[:10] if rows else ""


def count_withdrawals_via_dune(api_key: str, date_from: str, date_to: str) -> tuple:
    """Count vault Withdrawal events in [date_from, date_to] via Dune (no block limit).

    Returns (count, days_list) or (None, None) on failure.
    """
    try:
        rows = dune_run_sql(api_key, (
            "SELECT date_trunc('day', block_time) AS day, COUNT(*) AS n "
            "FROM celo.logs "
            "WHERE contract_address = 0x4200000000000000000000000000000000000011 "
            "AND topic0 = 0x38e04cbeb8c10f8f568618aa75be0f10b6729b8b4237743b4de20cbcde2839ee "
            f"AND block_time >= TIMESTAMP '{date_from}' "
            f"AND block_time < TIMESTAMP '{date_to}' + INTERVAL '1' day "
            "GROUP BY 1 ORDER BY 1"
        ), "tmp_vault_withdrawals_in_period")
    except DuneRunError:
        # Reconciliation is informational (--detail only); a flake here is
        # non-fatal — report it as "could not check" rather than crashing.
        return None, None

    total = sum(int(r.get("n", 0)) for r in rows)
    days = [r.get("day", "")[:10] for r in rows]
    return total, days


def check_operations_during_period(date_from: str, date_to: str, rpc: str, computed: list = None, totals: dict = None, api_key: str = None, sweep_celo: float = 0.0, detail: bool = False) -> None:
    """Check if vault.withdraw() was called during the reporting period (via Dune).

    Reconciliation block (withdrawal scan + on-chain balances + NOTE) is only
    printed with --detail. Vault/FeeHandler balances are always read (silently)
    because the next-steps section needs them.
    """
    if detail:
        print("\n-- RECONCILIATION CHECK ---------------------------------------------")
        count, days = (None, None)
        if api_key:
            count, days = count_withdrawals_via_dune(api_key, date_from, date_to)
        if count is None:
            print(f"  Could not query withdrawals via Dune - skipping check.")
        elif count > 0:
            print(f"  WARNING: vault.withdraw() called {count} time(s) during this period!")
            print(f"  Days: {', '.join(days)}")
            print(f"  Some CELO was already moved to the Safe.")
            print(f"  RECOMMENDATION: Use --from the day AFTER the last withdrawal.")
        else:
            print(f"  OK: No vault withdrawals during {date_from} to {date_to} (full-period Dune scan).")

    # Read current vault + FeeHandler balances (always — needed by next steps)
    try:
        vault_celo = cast_cmd(["cast", "balance", VAULT, "--rpc-url", rpc, "--ether"])
        fh_celo = cast_cmd(["cast", "balance", FEE_HANDLER, "--rpc-url", rpc, "--ether"])
        vault_f = float(vault_celo) if vault_celo else 0
        fh_f = float(fh_celo) if fh_celo else 0

        if detail:
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

    print("")
    print(hdr("NEXT STEPS"))
    print("")

    # Step 1: Withdraw
    if vault_f > 1:
        print(f"  {BOLD}{YELLOW}[1]{RESET} {BOLD}WITHDRAW FROM VAULT{RESET}")
        print(f"      {celo(vault_f)} ready to withdraw  {DIM}(permissionless){RESET}")
        print(f"      {CYAN}cast send 0x4200000000000000000000000000000000000011 'withdraw()' \\")
        print(f"        --rpc-url https://forno.celo.org --private-key $PK{RESET}")
    else:
        print(f"  {BOLD}{GREEN}[1]{RESET} {BOLD}WITHDRAW FROM VAULT{RESET} {GREEN}- already empty{RESET}")

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
        print(f"  {BOLD}{YELLOW}[2]{RESET} {BOLD}PROCESS FEEHANDLER{RESET}")
        print(f"      {celo(fh_f)} + stablecoins  {DIM}(base fee portion){RESET}")
        print(f"      handleAll() distributes: {ORANGE}{carbon_frac*100:.0f}%{RESET} Carbon Fund, {GREEN}{clabs_frac*100:.0f}%{RESET} Operations Safe")
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
        for sym, taddr, dec in fh_tokens:
            try:
                raw = cast_cmd(["cast", "call", taddr, "balanceOf(address)(uint256)", FEE_HANDLER, "--rpc-url", rpc])
                bal = int(raw.split()[0]) / (10 ** dec) if raw else 0
                if bal >= 1:
                    fh_with_balance.append((sym, taddr, bal))
            except Exception:
                pass

        if fh_with_balance:
            print(f"      {GREY}Also stablecoins in FeeHandler — distribute(token) each:{RESET}")
            for sym, taddr, bal in fh_with_balance:
                print(f"        {WHITE}{sym}{RESET}  {num(bal)}")
                print(f"        {CYAN}cast send 0xcD437749E43A154C07F3553504c68fBfD56B8778 'distribute(address)' \\")
                print(f"          {taddr} \\")
                print(f"          --rpc-url https://forno.celo.org --private-key $PK{RESET}")

    print("")

    # ---- Compute all distribution figures once (used by steps [3] and [4]) ----
    safe_addr = "0x7A1E98FC9a008107DbD1f430a05Ace8cf6f3FE19"
    cold_topup = totals.get("stables_celo_equiv", 0) if totals else 0
    stables_usd_total = totals.get("stables_usd", 0) if totals else 0
    surplus_celo = 0
    safe_tokens = [
        ("CELO", "0x471EcE3750Da237f93B8E339c536989b8978a438", 18),
        ("USDT", "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e", 6),
        ("USDC", "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", 6),
        ("USDm", "0x765DE816845861e75A25fCA122bb6898B8B1282a", 18),
        ("EURm", "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73", 18),
    ]
    try:
        l1_cost = sum(r.get("total_l1_cost_celo", 0) for r in computed) if computed else 0
        vault_celo_raw = cast_cmd(["cast", "balance", VAULT, "--rpc-url", rpc, "--ether"])
        vault_celo_f = float(vault_celo_raw) if vault_celo_raw else 0
        fh_celo_to_safe = fh_f * clabs_frac
        fee_celo = vault_celo_f + fh_celo_to_safe  # newly-withdrawn CELO fees

        op_share = totals.get("op_share_celo", 0) if totals else 0
        op_method_str = totals.get("op_share_method", "?") if totals else "?"
        # Live Uniswap V3 quote: OP share CELO -> WETH at current rate
        op_share_weth_amt = quote_celo_to_weth(op_share, rpc) if op_share > 0 else 0
        op_recipient = os.environ.get("OP_SHARE_RECIPIENT", OP_SHARE_RECIPIENT_DEFAULT)
        op_is_placeholder = op_recipient.lower() == SAFE_ADDR.lower()

        # Pre-cutoff CELO (sweep_celo) lands in the Safe after step [1] and is
        # operator funds. Use it toward the stables CELO-equiv top-up so the cold
        # wallet only sends the remainder. Any leftover stays in the multisig.
        precutoff_used = min(sweep_celo, cold_topup)
        precutoff_leftover = sweep_celo - precutoff_used
        cold_send = cold_topup - precutoff_used  # what the cold wallet must send

        # Gov's net CELO from fees (after L1/OP and any pre-cutoff that stays):
        gov_from_fees = fee_celo - l1_cost - op_share - precutoff_leftover
        total_celo = fee_celo + cold_send
        gov_celo = gov_from_fees + cold_send
        compute_ok = True
    except Exception:
        l1_cost = op_share = op_share_weth_amt = 0
        vault_celo_f = fh_celo_to_safe = fee_celo = 0
        gov_from_fees = gov_celo = total_celo = 0
        precutoff_used = precutoff_leftover = cold_send = 0
        op_is_placeholder = True
        op_recipient = OP_SHARE_RECIPIENT_DEFAULT
        op_method_str = "?"
        compute_ok = False

    # ---- Step 3: Cold-wallet exchange ----
    print(f"  {BOLD}{YELLOW}[3]{RESET} {BOLD}COLD-WALLET EXCHANGE FOR RETAINED STABLES{RESET}")
    print(f"      {GREY}Stablecoins STAY in the Safe (never sent to Gov). Pre-cutoff CELO")
    print(f"      already in the Safe is used first; the cold wallet sends only the rest.{RESET}")
    print(f"      Stables retained:           {usd(stables_usd_total)}  {DIM}(stay in Safe){RESET}")
    print(f"      Stables CELO-equivalent:    {num(cold_topup, 14)}  {DIM}(= {usd(stables_usd_total)} at period prices){RESET}")
    if precutoff_used > 0:
        print(f"        - covered by pre-cutoff:  {num(precutoff_used, 14)}  {DIM}(CGP-287 CELO now in Safe after step [1]){RESET}")
    print(f"        {BOLD}= Cold wallet provides:   {RED}{cold_send:>14,.2f}{RESET} {DIM}CELO{RESET}")
    print(f"      {CYAN}cast send 0x471EcE3750Da237f93B8E339c536989b8978a438 'transfer(address,uint256)' \\")
    print(f"        {safe_addr} \\")
    print(f"        $(cast --to-wei {cold_send:.6f} ether)  --rpc-url https://forno.celo.org --private-key $COLD_PK{RESET}")
    print(f"")

    # ---- Step 4: Distribute CELO via Safe batch ----
    print(f"  {BOLD}{YELLOW}[4]{RESET} {BOLD}DISTRIBUTE CELO VIA SAFE BATCH{RESET}")
    print(f"      {GREY}Gov gets ONLY CELO (fees + stables equiv - OP - L1). OP share")
    print(f"      -> WETH swap -> OP recipient. Stables stay. Run AFTER [1]-[3].{RESET}")
    print(f"")
    if compute_ok:
        topup_note = f" + {cold_send:,.0f} cold send" if cold_send > 0 else ""
        print(f"        {GREY}Distributable:{RESET}   {num(total_celo, 14)}  {DIM}(Vault + {clabs_frac*100:.0f}% FeeHandler{topup_note}; Safe pre-existing untouched){RESET}")
        if precutoff_leftover > 0:
            print(f"        {RED}- Pre-cutoff left:{RESET} {RED}{precutoff_leftover:>14,.0f}{RESET}  CELO  {DIM}-> stays in multisig (CGP-287){RESET}")
        print(f"        {RED}- L1 costs:{RESET}      {RED}{l1_cost:>14,.0f}{RESET}  CELO  {DIM}->{RESET} {addr(L1_COST_RECIPIENT_DEFAULT)}")
        print(f"        {RED}- OP share:{RESET}      {RED}{op_share:>14,.0f}{RESET}  CELO  {DIM}({op_method_str}){RESET}")
        print(f"          {ORANGE}swap -> {op_share_weth_amt:.6f} WETH{RESET}  {DIM}(live Uniswap V3 quote, CELO/WETH 0.3%){RESET}")
        if op_is_placeholder:
            print(f"          {DIM}-> OP recipient TBD (set OP_SHARE_RECIPIENT; currently Safe placeholder){RESET}")
        else:
            print(f"          {DIM}-> {op_recipient}{RESET}")
        print(f"        {BOLD}{GREEN}= To Governance: {gov_celo:>14,.2f} CELO{RESET}  {DIM}(all CELO, incl. stables equiv){RESET}")

        print(f"")
        print(f"      {BOLD}Stablecoins RETAINED in Safe{RESET} {DIM}(never sent to Gov):{RESET}")
        for name, taddr, dec in safe_tokens:
            if name == "CELO":
                continue
            bal_raw = cast_cmd(["cast", "call", taddr, "balanceOf(address)(uint256)", safe_addr, "--rpc-url", rpc])
            bal = int(bal_raw.split()[0]) / (10 ** dec) if bal_raw else 0
            fh_bal_raw = cast_cmd(["cast", "call", taddr, "balanceOf(address)(uint256)", FEE_HANDLER, "--rpc-url", rpc])
            fh_bal = int(fh_bal_raw.split()[0]) / (10 ** dec) if fh_bal_raw else 0
            total = bal + fh_bal * clabs_frac
            if total >= 0.01:
                print(f"        {WHITE}{name}{RESET}  {num(total, 12)}  {DIM}-> Safe{RESET}")

    # NOTE: ERC-20 stablecoins stuck in the vault (no sweepERC20) are intentionally
    # left untouched and excluded from all distribution math until a vault upgrade.

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

    global _VERBOSE
    _VERBOSE = args.detail

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
            vlog(f"Auto-detected --from: {args.date_from} ({last_withdrawal_info})")
        if not args.date_to:
            args.date_to = suggested_to
            vlog(f"Auto-detected --to:   {args.date_to} (yesterday)")
        print("", file=sys.stderr)

    # Enforce CGP-287 cutoff: report covers strictly AFTER cutoff
    min_from = (dt.datetime.strptime(CGP_287_CUTOFF_DATE, "%Y-%m-%d") + dt.timedelta(days=1)).strftime("%Y-%m-%d")
    if args.date_from < min_from:
        vlog(f"NOTE: --from {args.date_from} is on/before CGP-287 cutoff ({CGP_287_CUTOFF_DATE}).")
        vlog(f"      Bumping --from to {min_from} (pre-cutoff revenue handled by sweep batch).")
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
        vlog("Triggering Dune query execution...")
        exec_id = trigger_execution(args.api_key)
        vlog(f"Execution ID: {exec_id}")
        wait_for_execution(exec_id, args.api_key)
        vlog("Query completed.")
    else:
        ensure_fresh_data(args.api_key, args.date_to, auto_refresh=args.auto_refresh)

    # Fetch results
    vlog("Fetching Dune query results...")
    rows = fetch_results(args.api_key)
    vlog(f"Fetched {len(rows)} total rows.")

    # Pre-cutoff sweep auto-detect: only needed when the latest vault withdrawal
    # happened BEFORE the CGP-287 cutoff (so pre-cutoff revenue is still un-withdrawn
    # in the contracts). If a withdrawal happened on/after cutoff, pre-cutoff was
    # already drained -> no sweep.
    today = dt.datetime.now(dt.timezone.utc).date().isoformat()
    overall_last_wd = last_withdrawal_on_or_before(args.api_key, today)
    show_sweep = (overall_last_wd == "") or (overall_last_wd < CGP_287_CUTOFF_DATE)

    if overall_last_wd:
        sweep_from = (dt.datetime.strptime(overall_last_wd, "%Y-%m-%d") + dt.timedelta(days=1)).strftime("%Y-%m-%d")
    else:
        sweep_from = L2_GENESIS_DATE
    pre_cutoff_rows = filter_rows(rows, sweep_from, CGP_287_CUTOFF_DATE)
    pre_cutoff_days = len(pre_cutoff_rows)
    pre_cutoff_computed = [compute_row(r) for r in pre_cutoff_rows]
    sweep_celo = sum((r.get("fee_CELO", 0) or 0) for r in pre_cutoff_rows)
    sweep_stables = {
        "USDT": sum((r.get("fee_USDT", 0) or 0) for r in pre_cutoff_rows),
        "USDC": sum((r.get("fee_USDC", 0) or 0) for r in pre_cutoff_rows),
        "USDm": sum((r.get("fee_USDm", 0) or 0) for r in pre_cutoff_rows),
        "EURm": sum((r.get("fee_EURm", 0) or 0) for r in pre_cutoff_rows),
    }
    if not show_sweep:
        sweep_celo = 0  # already settled; nothing to carve in step [4]

    # Filter to date range
    filtered = filter_rows(rows, args.date_from, args.date_to)
    if not filtered:
        print(f"No data found for {args.date_from} to {args.date_to}.", file=sys.stderr)
        print("Try --refresh to update the Dune query.", file=sys.stderr)
        sys.exit(1)

    vlog(f"Processing {len(filtered)} days in range.")

    # Compute derived fields
    computed = [compute_row(r) for r in filtered]
    totals = sum_rows(computed)

    # Output
    if args.detail:
        print_report(computed, totals, show_daily=not args.no_daily)
    else:
        print(f"{BOLD}{CYAN}{'=' * 80}{RESET}")
        print(f"  {BOLD}{WHITE}CELO L2 SEQUENCER FEE REPORT{RESET}  {DIM}|{RESET}  {CYAN}{totals['day']}{RESET} {DIM}({totals['num_days']} days){RESET}")
        print(f"  {DIM}run with --detail for full P&L and daily breakdown{RESET}")
        print(f"{BOLD}{CYAN}{'=' * 80}{RESET}")

    # Print pre-cutoff sweep section (step [0], one-time CGP-287 handling)
    # Shown only when last withdrawal predates the CGP-287 cutoff (auto-detected).
    if show_sweep:
        print_pre_cutoff_sweep(sweep_from, pre_cutoff_days, sweep_celo, sweep_stables)

    # Reconciliation check
    check_operations_during_period(args.date_from, args.date_to, rpc, computed, totals, args.api_key, sweep_celo, args.detail)

    if args.csv:
        write_csv(computed, totals, args.csv)

    if args.json_out:
        write_json(computed, totals, args.json_out)


if __name__ == "__main__":
    main()
