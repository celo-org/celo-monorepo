#!/usr/bin/env python3
"""Verify one window end-to-end: all distribution identities + an additivity split.

Prints a single JSON line: {window, pass, fails, fee, equiv, surplus, cold, gov, add_diff}.
Retries Dune/cast transients internally so a flake doesn't false-fail.

Usage:  DUNE_API_KEY=... python3 check_one.py 2026-04-09 2026-06-18
"""
import json
import os
import sys
import time
import datetime as dt

import report as R

EPS = 5.0
API = os.environ.get("DUNE_API_KEY")
RPC = os.environ.get("RPC_URL", "https://forno.celo.org")


def approx(a, b, eps=EPS):
    return abs(a - b) <= eps


def retry(fn, tries=4):
    last = None
    for i in range(tries):
        try:
            return fn()
        except Exception as e:  # DuneRunError / CastError / transient
            last = e
            time.sleep(2 + 2 * i)
    raise last


def accrual_celo(api, rpc, a, b, clabs):
    return retry(lambda: R.compute_token_accruals(api, rpc, a, b, clabs))[0]["CELO"]


def main():
    a, b = sys.argv[1], sys.argv[2]
    out = {"window": f"{a}->{b}", "pass": False, "fails": []}
    try:
        clabs_raw = R.cast_strict(["cast", "call", R.FEE_HANDLER, "getCarbonFraction()(uint256)", "--rpc-url", RPC])
        clabs = max(0.0, 1.0 - int(clabs_raw.split()[0]) / 1e24)

        accr = retry(lambda: R.compute_token_accruals(API, RPC, a, b, clabs))[0]
        rows = retry(lambda: R.fetch_results(API))
        computed = [R.compute_row(r) for r in R.filter_rows(rows, a, b)]
        cps = [r["celo_price_usd"] for r in computed if r.get("celo_price_usd")]
        cp = sum(cps) / len(cps) if cps else 0
        eur = next((r["fee_EURm_usd"] / r["fee_EURm"] for r in reversed(computed)
                    if r.get("fee_EURm") and r.get("fee_EURm_usd")), 1.08)
        stables_usd = (accr["USDT"] + accr["USDC"] + accr["USDm"]) + accr["EURm"] * eur + accr["BRLm"] * 0.18
        equiv = stables_usd / cp if cp > 0 else 0.0
        l1 = sum(r.get("total_l1_cost_celo", 0) for r in computed)

        bal = lambda x: float(R.cast_strict(["cast", "balance", x, "--rpc-url", RPC, "--ether"]))
        safe_now = bal(R.SAFE_ADDR)
        vault_now = sum(bal(v) for v in R.FEE_VAULTS)
        fh_now = bal(R.FEE_HANDLER)
        wd = retry(lambda: R.dune_run_sql(API, ("SELECT max(block_time) AS t FROM celo.logs "
              f"WHERE contract_address IN ({','.join(v.lower() for v in R.FEE_VAULTS)}) "
              f"AND topic0 = {R.WITHDRAWAL_TOPIC0}"), "tmp_lastwd_check1"))
        last_wd = (wd[0].get("t") or "")[:10] if wd else ""
        settled = last_wd != "" and last_wd >= b

        d = R.build_distribution(accr["CELO"], stables_usd, equiv, l1,
                                 safe_now, vault_now, fh_now, clabs, settled)
        fee, rev, op, gov = d["fee_celo"], d["revenue_celo"], d["op_share"], d["gov_celo"]
        surplus, used, cold, proj, leftover = (d["surplus"], d["surplus_used"], d["cold_send"],
                                               d["projected_safe"], d["leftover_surplus"])

        F = out["fails"]
        if not approx(rev, fee + equiv): F.append("revenue")
        if not approx(op, max(0.025 * rev, 0.15 * (rev - l1))): F.append("op")
        if not approx(gov, rev - op - l1): F.append("gov")
        if not approx(surplus, max(0.0, proj - fee)): F.append("surplus")
        if not approx(used, min(surplus, equiv)): F.append("surplus_used")
        if not approx(cold, max(0.0, equiv - used)): F.append("cold")
        if not approx(proj + cold - (l1 + op + gov), leftover): F.append("conservation")
        if not approx((fee - l1 - op) + used + cold, gov): F.append("gov_decomp")
        if cold < -EPS or surplus < -EPS or leftover < -EPS: F.append("negative")
        if accr["CELO"] < -EPS: F.append("accr_neg")

        # Additivity: split the window in half, assert full == left + right.
        # Works for any multi-day window (>=1 day gap); a 1-day window can't split.
        d0 = dt.date.fromisoformat(a); d1 = dt.date.fromisoformat(b)
        if (d1 - d0).days >= 1:
            mid = (d0 + dt.timedelta(days=max(0, (d1 - d0).days // 2)))
            ln = accrual_celo(API, RPC, a, mid.isoformat(), clabs)
            rn = accrual_celo(API, RPC, (mid + dt.timedelta(days=1)).isoformat(), b, clabs)
            add_diff = (ln + rn) - accr["CELO"]
            out["add_diff"] = round(add_diff, 2)
            if abs(add_diff) > 50:
                F.append("additivity")
        else:
            out["add_diff"] = None

        out.update({"fee": round(fee, 0), "equiv": round(equiv, 0), "surplus": round(surplus, 0),
                    "cold": round(cold, 0), "gov": round(gov, 0)})
        out["pass"] = not F
    except Exception as e:
        out["fails"].append(f"ERROR:{type(e).__name__}:{str(e)[:80]}")
    print(json.dumps(out))


if __name__ == "__main__":
    main()
