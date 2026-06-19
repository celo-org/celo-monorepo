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


# ---------------------------------------------------------------------------
# Per-token accrual engine
#
# "Distributable for [A, B]" = every token that would land in the Safe if you
# flushed the contracts the day before A (so pre-window funds don't count) and
# flushed again at B. Equivalently, a flow reconciliation:
#
#   accrued[tok] = (sink balance now) - (sink balance at block(A)) + withdrawn_to_Safe[A,B]
#
# where the "sink" for CELO is the three OP fee vaults + the Safe-beneficiary
# fraction of FeeHandler, and for stablecoins is the FeeHandler (vault ERC-20s
# are stuck and never reach the Safe). Protocol-burned base fee never enters a
# sink, so it is correctly excluded — it never had a chance to hit the Safe.
# ---------------------------------------------------------------------------

# OP-stack fee vaults (all withdraw 100% of native CELO to RECIPIENT = the Safe).
FEE_VAULTS = [
    "0x4200000000000000000000000000000000000011",  # SequencerFeeVault (priority tip)
    "0x4200000000000000000000000000000000000019",  # BaseFeeVault (base fee)
    "0x420000000000000000000000000000000000001A",  # L1FeeVault (L1 data fee)
]
WITHDRAWAL_TOPIC0 = "0x38e04cbeb8c10f8f568618aa75be0f10b6729b8b4237743b4de20cbcde2839ee"
TRANSFER_TOPIC0 = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"

# token symbol -> (address, decimals). CELO first (native + ERC-20 unified).
FEE_TOKENS = [
    ("CELO", "0x471EcE3750Da237f93B8E339c536989b8978a438", 18),
    ("USDT", "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e", 6),
    ("USDC", "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", 6),
    ("USDm", "0x765DE816845861e75A25fCA122bb6898B8B1282a", 18),
    ("EURm", "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73", 18),
    ("BRLm", "0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787", 18),
]


def block_at_date(date_str: str, rpc: str) -> int:
    """Block number at 00:00 UTC of date_str (the window start boundary)."""
    ts = int(dt.datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=dt.timezone.utc).timestamp())
    out = cast_cmd(["cast", "find-block", str(ts), "--rpc-url", rpc], timeout=30)
    return int(out.split()[0]) if out else 0


def dune_withdrawn_to_safe(api_key: str, date_from: str, date_to: str) -> dict:
    """Tokens that left the fee sinks to the Safe during [date_from, date_to].

    CELO  = sum of vault Withdrawal events (all 3 vaults) + FeeHandler->Safe CELO transfers.
    stable = sum of FeeHandler->Safe transfers for that token.
    Returns {symbol: float amount}.
    """
    safe_topic = "0x000000000000000000000000" + SAFE_ADDR[2:].lower()
    fh_topic = "0x000000000000000000000000" + FEE_HANDLER[2:].lower()
    vaults_sql = ",".join(v.lower() for v in FEE_VAULTS)

    # Vault Withdrawal events -> CELO to the Safe (withdraw() sends 100% to RECIPIENT).
    vault_rows = dune_run_sql(api_key, (
        "SELECT COALESCE(SUM(varbinary_to_uint256(substr(data,1,32))),0) AS raw "
        "FROM celo.logs "
        f"WHERE contract_address IN ({vaults_sql}) "
        f"AND topic0 = {WITHDRAWAL_TOPIC0} "
        f"AND block_time >= TIMESTAMP '{date_from}' "
        f"AND block_time < TIMESTAMP '{date_to}' + INTERVAL '1' day"
    ), "tmp_vault_withdrawals_celo")
    vault_celo = int(vault_rows[0].get("raw", 0) or 0) / 1e18 if vault_rows else 0.0

    # FeeHandler -> Safe ERC-20 transfers, per token.
    fh_rows = dune_run_sql(api_key, (
        "SELECT contract_address AS token, "
        "SUM(varbinary_to_uint256(substr(data,1,32))) AS raw "
        "FROM celo.logs "
        f"WHERE topic0 = {TRANSFER_TOPIC0} "
        f"AND topic1 = {fh_topic} AND topic2 = {safe_topic} "
        f"AND block_time >= TIMESTAMP '{date_from}' "
        f"AND block_time < TIMESTAMP '{date_to}' + INTERVAL '1' day "
        "GROUP BY 1"
    ), "tmp_feehandler_to_safe")

    out = {sym: 0.0 for sym, _, _ in FEE_TOKENS}
    by_addr = {a.lower(): (s, d) for s, a, d in FEE_TOKENS}
    for r in fh_rows:
        info = by_addr.get((r.get("token") or "").lower())
        if not info:
            continue
        sym, dec = info
        out[sym] += int(r.get("raw", 0) or 0) / (10 ** dec)
    out["CELO"] += vault_celo
    return out


def _balance_at(token_addr: str, decimals: int, holder: str, block: str, rpc: str, native: bool) -> float:
    """Token (or native CELO) balance of `holder` at a given block (or 'latest')."""
    blk = ["--block", str(block)] if block != "latest" else []
    if native:
        out = cast_cmd(["cast", "balance", holder, "--rpc-url", rpc] + blk)
        return float(out) / 1e18 if out else 0.0
    out = cast_cmd(["cast", "call", token_addr, "balanceOf(address)(uint256)", holder, "--rpc-url", rpc] + blk)
    return int(out.split()[0]) / (10 ** decimals) if out else 0.0


def compute_token_accruals(api_key: str, rpc: str, date_from: str, date_to: str, clabs_frac: float) -> tuple:
    """Per-token CELO/stable that accrued to the Safe during [date_from, date_to].

    Balances are read at the window boundaries — block(date_from) and block(end of
    date_to) — so a past window is reproducible and post-window fees don't leak in.
    Returns (accruals_dict, block_A). See module note above for the formula.
    """
    block_A = block_at_date(date_from, rpc)
    end_date = (dt.datetime.strptime(date_to, "%Y-%m-%d") + dt.timedelta(days=1)).strftime("%Y-%m-%d")
    block_B = block_at_date(end_date, rpc)
    # Cap at chain head if the window end is in the future (date_to = today/yesterday).
    head = cast_cmd(["cast", "block-number", "--rpc-url", rpc])
    block_B_str = str(min(block_B, int(head))) if head and block_B else "latest"

    withdrawn = dune_withdrawn_to_safe(api_key, date_from, date_to)

    # CELO sink balance = 3 vaults (native) + clabs_frac * FeeHandler (native).
    def celo_sink(block):
        v = sum(_balance_at("", 18, vault, block, rpc, native=True) for vault in FEE_VAULTS)
        fh = _balance_at("", 18, FEE_HANDLER, block, rpc, native=True)
        return v + clabs_frac * fh

    accr = {}
    accr["CELO"] = (celo_sink(block_B_str) - celo_sink(str(block_A))) + withdrawn["CELO"]

    # Stables: FeeHandler balanceOf only (vault ERC-20s are stuck, never reach Safe).
    for sym, addr, dec in FEE_TOKENS:
        if sym == "CELO":
            continue
        at_b = _balance_at(addr, dec, FEE_HANDLER, block_B_str, rpc, native=False)
        at_a = _balance_at(addr, dec, FEE_HANDLER, str(block_A), rpc, native=False)
        accr[sym] = clabs_frac * (at_b - at_a) + withdrawn[sym]
    return accr, block_A


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


def check_operations_during_period(date_from: str, date_to: str, rpc: str, dist: dict, api_key: str = None, detail: bool = False) -> None:
    """Print the operator action plan from the accrual-based distribution bundle.

    `dist` is computed in main(): per-token accruals (what reached the Safe in the
    window), the retained-stables CELO-equivalent, L1 cost, OP share, and Gov total.
    Steps [1]/[2] flush whatever is currently in the contracts; the accrual already
    accounts for anything withdrawn earlier in the window.
    """
    accr = dist["accr"]
    clabs_frac = dist["clabs_frac"]

    if detail:
        print("\n-- RECONCILIATION (accrual basis) ----------------------------------")
        print(f"  Window: {date_from} -> {date_to}   (start block {dist['block_A']})")
        print(f"  CELO that reached the Safe (vaults + {clabs_frac*100:.0f}% FeeHandler,")
        print(f"  incl. amounts already withdrawn mid-window): {accr['CELO']:,.2f}")
        print(f"  Stablecoins reached the Safe:")
        for sym in ("USDT", "USDC", "USDm", "EURm", "BRLm"):
            if accr.get(sym, 0) >= 0.01:
                print(f"    {sym}: {accr[sym]:,.2f}")

    # Current contract balances to flush at window end (steps [1]/[2]).
    def bal(addr_):
        out = cast_cmd(["cast", "balance", addr_, "--rpc-url", rpc, "--ether"])
        return float(out) if out else 0.0
    vault_now = sum(bal(v) for v in FEE_VAULTS)
    fh_now = bal(FEE_HANDLER)

    print("")
    print(hdr("NEXT STEPS"))
    print("")

    if dist.get("window_settled"):
        # A withdrawal on/after the window end already flushed this window into the
        # Safe; the accrual below is settled. Anything in the contracts now is
        # post-window and must NOT be re-flushed for this distribution.
        print(f"  {BOLD}{GREEN}[1]+[2]{RESET} {BOLD}ALREADY FLUSHED{RESET}")
        print(f"      {GREY}A fee-vault withdrawal on {dist.get('last_wd','?')} (on/after the window")
        print(f"      end {date_to}) already moved this window's fees to the Safe.")
        print(f"      The accrual below is settled — do NOT run withdraw()/handleAll()")
        print(f"      for this window. Current contract balance ({vault_now + fh_now:,.0f} CELO)")
        print(f"      is post-window revenue, part of a later window.{RESET}")
        print("")
    else:
        # Step 1: Withdraw from the fee vaults (flush window-end balance)
        if vault_now > 1:
            print(f"  {BOLD}{YELLOW}[1]{RESET} {BOLD}WITHDRAW FROM FEE VAULTS{RESET}")
            print(f"      {celo(vault_now)} currently in the 3 OP fee vaults  {DIM}(permissionless){RESET}")
            for v in FEE_VAULTS:
                if bal(v) > 1:
                    print(f"      {CYAN}cast send {v} 'withdraw()' --rpc-url https://forno.celo.org --private-key $PK{RESET}")
        else:
            print(f"  {BOLD}{GREEN}[1]{RESET} {BOLD}WITHDRAW FROM FEE VAULTS{RESET} {GREEN}- already empty{RESET}")
        print("")

        # Step 2: Process FeeHandler (CELO + each stablecoin)
        print(f"  {BOLD}{YELLOW}[2]{RESET} {BOLD}PROCESS FEEHANDLER{RESET}")
        print(f"      {celo(fh_now)} + stablecoins currently in FeeHandler")
        print(f"      handleAll() distributes: {GREEN}{clabs_frac*100:.0f}%{RESET} to Operations Safe, {ORANGE}{(1-clabs_frac)*100:.0f}%{RESET} Carbon Fund")
        print(f"      {CYAN}cast send {FEE_HANDLER} 'handleAll()' --rpc-url https://forno.celo.org --private-key $PK{RESET}")
        fh_with_balance = []
        for sym, taddr, dec in FEE_TOKENS:
            if sym == "CELO":
                continue
            raw = cast_cmd(["cast", "call", taddr, "balanceOf(address)(uint256)", FEE_HANDLER, "--rpc-url", rpc])
            b = int(raw.split()[0]) / (10 ** dec) if raw else 0
            if b >= 1:
                fh_with_balance.append((sym, taddr, b))
        if fh_with_balance:
            print(f"      {GREY}Stablecoins in FeeHandler — distribute(token) each:{RESET}")
            for sym, taddr, b in fh_with_balance:
                print(f"        {WHITE}{sym}{RESET}  {num(b)}")
                print(f"        {CYAN}cast send {FEE_HANDLER} 'distribute(address)' {taddr} --rpc-url https://forno.celo.org --private-key $PK{RESET}")
        print("")

    # Distribution figures (from the accrual bundle).
    fee_celo = dist["fee_celo"]
    stables_equiv = dist["stables_celo_equiv"]
    stables_usd = dist["stables_usd"]
    revenue_celo = dist["revenue_celo"]
    l1_cost = dist["l1_cost"]
    op_share = dist["op_share"]
    op_method_str = dist["op_method"]
    gov_celo = dist["gov_celo"]
    op_share_weth_amt = quote_celo_to_weth(op_share, rpc) if op_share > 0 else 0
    op_recipient = os.environ.get("OP_SHARE_RECIPIENT", OP_SHARE_RECIPIENT_DEFAULT)
    op_is_placeholder = op_recipient.lower() == SAFE_ADDR.lower()

    # Pre-window CELO already in the Safe (operator funds) that MAY offset the
    # cold-wallet top-up. Read the Safe's CELO balance at the window-start block.
    safe_pre = _balance_at("", 18, SAFE_ADDR, str(dist["block_A"]), rpc, native=True)
    cold_send = stables_equiv  # default: cold wallet covers the full stables equiv

    # ---- Step 3: Cold-wallet exchange for retained stablecoins ----
    print(f"  {BOLD}{YELLOW}[3]{RESET} {BOLD}COLD-WALLET EXCHANGE FOR RETAINED STABLES{RESET}")
    print(f"      {GREY}Stablecoins STAY in the Safe (never sent to Gov). The cold wallet")
    print(f"      provides their CELO-equivalent so Gov is paid entirely in CELO.{RESET}")
    print(f"      Stables retained:           {usd(stables_usd)}  {DIM}(stay in Safe){RESET}")
    print(f"      Stables CELO-equivalent:    {num(stables_equiv, 14)}  {DIM}(at current CELO price){RESET}")
    print(f"        {BOLD}= Cold wallet provides:   {RED}{cold_send:>14,.2f}{RESET} {DIM}CELO{RESET}")
    if safe_pre > 1:
        print(f"      {DIM}(Safe held {safe_pre:,.0f} pre-window CELO you may use to offset this){RESET}")
    print(f"      {CYAN}cast send {CELO_TOKEN} 'transfer(address,uint256)' \\")
    print(f"        {SAFE_ADDR} $(cast --to-wei {cold_send:.6f} ether) \\")
    print(f"        --rpc-url https://forno.celo.org --private-key $COLD_PK{RESET}")
    print("")

    # ---- Step 4: Distribute CELO to Governance via the Safe batch ----
    print(f"  {BOLD}{YELLOW}[4]{RESET} {BOLD}DISTRIBUTE CELO VIA SAFE BATCH{RESET}")
    print(f"      {GREY}Gov gets ONLY CELO. OP share -> WETH swap -> OP recipient.")
    print(f"      Stables stay in the Safe. Run AFTER [1]-[3].{RESET}")
    print("")
    print(f"        {GREY}CELO accrued to Safe:{RESET} {num(fee_celo, 14)}  {DIM}(this window, incl. mid-window withdrawals){RESET}")
    print(f"        {GREY}+ stables equiv:{RESET}      {num(stables_equiv, 14)}  {DIM}(cold wallet){RESET}")
    print(f"        {GREY}= revenue:{RESET}            {num(revenue_celo, 14)}")
    print(f"        {RED}- L1 costs:{RESET}           {RED}{l1_cost:>14,.0f}{RESET}  {DIM}->{RESET} {addr(L1_COST_RECIPIENT_DEFAULT)}")
    print(f"        {RED}- OP share:{RESET}           {RED}{op_share:>14,.0f}{RESET}  {DIM}({op_method_str}){RESET}")
    print(f"          {ORANGE}swap -> {op_share_weth_amt:.6f} WETH{RESET}  {DIM}(live Uniswap V3 quote, CELO/WETH 0.3%){RESET}")
    if op_is_placeholder:
        print(f"          {DIM}-> OP recipient TBD (set OP_SHARE_RECIPIENT; currently Safe placeholder){RESET}")
    else:
        print(f"          {DIM}-> {op_recipient}{RESET}")
    print(f"        {BOLD}{GREEN}= To Governance: {gov_celo:>14,.2f} CELO{RESET}")
    print("")
    print(f"      {BOLD}Stablecoins RETAINED in Safe{RESET} {DIM}(never sent to Gov):{RESET}")
    for sym, _, _ in FEE_TOKENS:
        if sym == "CELO":
            continue
        if accr.get(sym, 0) >= 0.01:
            print(f"        {WHITE}{sym}{RESET}  {num(accr[sym], 12)}  {DIM}-> Safe{RESET}")

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

    # Validate dates
    try:
        dt.datetime.strptime(args.date_from, "%Y-%m-%d")
        dt.datetime.strptime(args.date_to, "%Y-%m-%d")
    except ValueError:
        print("Error: dates must be YYYY-MM-DD format", file=sys.stderr)
        sys.exit(1)

    # CGP-287 settled all revenue on/before the cutoff. By default, ignore any
    # pre-cutoff portion: clamp the effective window start to the day after the
    # cutoff. This is shown visibly (not silently). Override with
    # INCLUDE_PRE_CUTOFF=1 to report the raw accrual including pre-cutoff.
    cutoff_next = (dt.datetime.strptime(CGP_287_CUTOFF_DATE, "%Y-%m-%d") + dt.timedelta(days=1)).strftime("%Y-%m-%d")
    requested_from = args.date_from
    include_pre_cutoff = bool(os.environ.get("INCLUDE_PRE_CUTOFF"))
    spans_pre_cutoff = args.date_from < cutoff_next
    cutoff_clamped = False
    if spans_pre_cutoff and not include_pre_cutoff:
        cutoff_clamped = (args.date_from, args.date_to)
        args.date_from = cutoff_next

    if args.date_from > args.date_to:
        # Common when auto-detecting right after a withdrawal: the next period
        # starts the day after the last withdrawal, which can be after "yesterday".
        last_day = (dt.datetime.strptime(args.date_from, "%Y-%m-%d") - dt.timedelta(days=1)).strftime("%Y-%m-%d")
        print(f"{GREEN}No new revenue to distribute.{RESET} The last withdrawal was on "
              f"{last_day}; nothing has accrued since. Pass an explicit --from/--to "
              f"to report a past window.")
        sys.exit(0)

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

    # Filter to date range
    filtered = filter_rows(rows, args.date_from, args.date_to)
    if not filtered:
        print(f"No data found for {args.date_from} to {args.date_to}.", file=sys.stderr)
        print("Try --refresh to update the Dune query.", file=sys.stderr)
        sys.exit(1)

    vlog(f"Processing {len(filtered)} days in range.")

    # Per-day P&L (gross fees — informational, shown with --detail)
    computed = [compute_row(r) for r in filtered]
    totals = sum_rows(computed)

    # ---- Distributable: per-token accrual (what actually reached the Safe) ----
    # Read the live Safe-beneficiary fraction of the FeeHandler (carbon goes
    # elsewhere). Post-CGP-288 this is 100%.
    try:
        carbon_raw = cast_cmd(["cast", "call", FEE_HANDLER, "getCarbonFraction()(uint256)", "--rpc-url", rpc])
        carbon_frac = int(carbon_raw.split()[0]) / 1e24 if carbon_raw else 0.0
    except Exception:
        carbon_frac = 0.0
    clabs_frac = max(0.0, 1.0 - carbon_frac)

    vlog("Computing per-token accruals (flow reconciliation)...")
    accr, block_A = compute_token_accruals(args.api_key, rpc, args.date_from, args.date_to, clabs_frac)

    # If the REQUESTED window reached before the CGP-287 cutoff, quantify that
    # pre-cutoff portion separately so the output can say exactly how much was
    # excluded (default) or how much extra is included (INCLUDE_PRE_CUTOFF=1).
    pre_cutoff = None
    if spans_pre_cutoff:
        vlog("Computing pre-cutoff portion...")
        try:
            pc_accr, _ = compute_token_accruals(args.api_key, rpc, requested_from, CGP_287_CUTOFF_DATE, clabs_frac)
            pre_cutoff = pc_accr
        except Exception:
            pre_cutoff = None

    # Value retained stablecoins -> USD -> CELO-equivalent (cold-wallet top-up).
    # Use the window-AVERAGE CELO price (a single Dune day can be noisy/incomplete);
    # eurm_price is the last day with EURm volume.
    celo_prices = [r["celo_price_usd"] for r in computed if r.get("celo_price_usd")]
    celo_price = sum(celo_prices) / len(celo_prices) if celo_prices else 0
    eurm_price = next((r["fee_EURm_usd"] / r["fee_EURm"] for r in reversed(computed)
                       if r.get("fee_EURm") and r.get("fee_EURm_usd")), 1.08)
    stables_usd = (accr["USDT"] + accr["USDC"] + accr["USDm"]) * 1.0 + accr["EURm"] * eurm_price + accr["BRLm"] * 0.18
    stables_celo_equiv = stables_usd / celo_price if celo_price > 0 else 0.0

    # Recompute OP share + Gov on the accrual basis (burned base fee excluded).
    fee_celo = accr["CELO"]
    revenue_celo = fee_celo + stables_celo_equiv
    l1_cost = sum(r.get("total_l1_cost_celo", 0) for r in computed)
    op_share = max(0.025 * revenue_celo, 0.15 * (revenue_celo - l1_cost))
    op_method = "15% of profit" if 0.15 * (revenue_celo - l1_cost) >= 0.025 * revenue_celo else "2.5% of revenue"
    gov_celo = revenue_celo - op_share - l1_cost

    # Was the window already flushed? If the last fee-vault withdrawal is on/after
    # the window end, the accrual is settled in the Safe and whatever is in the
    # contracts NOW is post-window — steps [1]/[2] should not re-flush it.
    try:
        wd_rows = dune_run_sql(args.api_key, (
            "SELECT max(block_time) AS t FROM celo.logs "
            f"WHERE contract_address IN ({','.join(v.lower() for v in FEE_VAULTS)}) "
            f"AND topic0 = {WITHDRAWAL_TOPIC0}"
        ), "tmp_last_any_vault_withdrawal")
        last_wd = (wd_rows[0].get("t") or "")[:10] if wd_rows else ""
    except DuneRunError:
        last_wd = ""
    window_settled = last_wd != "" and last_wd >= args.date_to

    dist = {
        "accr": accr, "block_A": block_A, "clabs_frac": clabs_frac,
        "stables_usd": stables_usd, "stables_celo_equiv": stables_celo_equiv,
        "fee_celo": fee_celo, "revenue_celo": revenue_celo, "l1_cost": l1_cost,
        "op_share": op_share, "op_method": op_method, "gov_celo": gov_celo,
        "celo_price": celo_price, "window_settled": window_settled, "last_wd": last_wd,
    }

    # Output
    if args.detail:
        print_report(computed, totals, show_daily=not args.no_daily)
    else:
        print(f"{BOLD}{CYAN}{'=' * 80}{RESET}")
        print(f"  {BOLD}{WHITE}CELO L2 SEQUENCER FEE REPORT{RESET}  {DIM}|{RESET}  {CYAN}{totals['day']}{RESET} {DIM}({totals['num_days']} days){RESET}")
        print(f"  {DIM}run with --detail for full P&L and daily breakdown{RESET}")
        print(f"{BOLD}{CYAN}{'=' * 80}{RESET}")

    def _fmt_pre(pc):
        if not pc:
            return "could not compute"
        parts = [f"{GREEN}{pc.get('CELO', 0):,.0f} CELO{RESET}"]
        for s in ("USDT", "USDC", "USDm", "EURm", "BRLm"):
            if pc.get(s, 0) >= 0.01:
                parts.append(f"{WHITE}{pc[s]:,.0f} {s}{RESET}")
        return ", ".join(parts)

    if cutoff_clamped:
        req_from, req_to = cutoff_clamped
        print(f"  {YELLOW}NOTE:{RESET} requested {req_from} -> {req_to}, but revenue on/before the "
              f"CGP-287 cutoff ({CGP_287_CUTOFF_DATE}) was already settled by CGP-287.")
        print(f"  {DIM}Window clamped to {args.date_from}.{RESET}")
        if pre_cutoff is not None:
            print(f"  {DIM}Pre-cutoff portion EXCLUDED ({requested_from} -> {CGP_287_CUTOFF_DATE}):{RESET} {_fmt_pre(pre_cutoff)}")
        print(f"  {DIM}Set INCLUDE_PRE_CUTOFF=1 to include it.{RESET}")
    elif include_pre_cutoff and spans_pre_cutoff:
        print(f"  {YELLOW}NOTE:{RESET} INCLUDE_PRE_CUTOFF=1 — pre-cutoff revenue is INCLUDED below.")
        print(f"  {DIM}It would normally be EXCLUDED: CGP-287 already settled revenue on/before")
        print(f"  the cutoff ({CGP_287_CUTOFF_DATE}), so including it double-counts that portion.{RESET}")
        print(f"  {DIM}Pre-cutoff portion INCLUDED ({requested_from} -> {CGP_287_CUTOFF_DATE}):{RESET} {_fmt_pre(pre_cutoff)}")

    # Distribution: steps [1]-[4] from the accrual basis
    check_operations_during_period(args.date_from, args.date_to, rpc, dist, args.api_key, args.detail)

    if args.csv:
        write_csv(computed, totals, args.csv)

    if args.json_out:
        write_json(computed, totals, args.json_out)


if __name__ == "__main__":
    main()
