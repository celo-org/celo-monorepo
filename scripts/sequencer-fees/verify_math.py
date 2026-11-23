#!/usr/bin/env python3
"""Math verification harness for report.py.

Runs the real distribution pipeline (compute_token_accruals + build_distribution)
over many windows and asserts every accounting identity. Also checks that the
per-token accrual is ADDITIVE across adjacent sub-windows (a flow reconciliation
must satisfy accrued[A,C] == accrued[A,B] + accrued[B+1,C]).

Usage:  DUNE_API_KEY=... python3 verify_math.py [N]
"""
import os
import sys
import random
import datetime as dt

import report as R

EPS = 5.0  # CELO tolerance (boundary-block rounding, price granularity)
API = os.environ.get("DUNE_API_KEY")
RPC = os.environ.get("RPC_URL", "https://forno.celo.org")
CUTOFF_NEXT = "2026-04-09"
DATA_START = "2025-04-01"   # safely after L2 genesis; archive-readable
DATA_END = "2026-06-18"


def approx(a, b, eps=EPS):
    return abs(a - b) <= eps


def cell_bal(a):
    out = R.cast_cmd(["cast", "balance", a, "--rpc-url", RPC, "--ether"])
    return float(out) if out else 0.0


def price_from(computed):
    cps = [r["celo_price_usd"] for r in computed if r.get("celo_price_usd")]
    cp = sum(cps) / len(cps) if cps else 0
    eur = next((r["fee_EURm_usd"] / r["fee_EURm"] for r in reversed(computed)
                if r.get("fee_EURm") and r.get("fee_EURm_usd")), 1.08)
    return cp, eur


def run_window(rows, date_from, date_to, safe_now, vault_now, fh_now, clabs, last_wd):
    computed = [R.compute_row(r) for r in R.filter_rows(rows, date_from, date_to)]
    if not computed:
        return None
    accr, block_A = R.compute_token_accruals(API, RPC, date_from, date_to, clabs)
    cp, eur = price_from(computed)
    stables_usd = (accr["USDT"] + accr["USDC"] + accr["USDm"]) + accr["EURm"] * eur + accr["BRLm"] * 0.18
    stables_equiv = stables_usd / cp if cp > 0 else 0.0
    l1 = sum(r.get("total_l1_cost_celo", 0) for r in computed)
    settled = last_wd != "" and last_wd >= date_to
    d = R.build_distribution(accr["CELO"], stables_usd, stables_equiv, l1,
                             safe_now, vault_now, fh_now, clabs, settled)
    d["accr"] = accr
    return d


def check_identities(tag, d):
    fails = []
    fee, eq, l1 = d["fee_celo"], d["stables_celo_equiv"], d["l1_cost"]
    rev, op, gov = d["revenue_celo"], d["op_share"], d["gov_celo"]
    surplus, used, cold = d["surplus"], d["surplus_used"], d["cold_send"]
    proj, leftover = d["projected_safe"], d["leftover_surplus"]

    def want(name, cond):
        if not cond:
            fails.append(name)

    want("revenue=fee+equiv", approx(rev, fee + eq))
    want("op=max(2.5%rev,15%(rev-l1))", approx(op, max(0.025 * rev, 0.15 * (rev - l1))))
    want("op>=2.5%rev", op >= 0.025 * rev - EPS)
    want("op>=15%(rev-l1)", op >= 0.15 * (rev - l1) - EPS)
    want("gov=rev-op-l1", approx(gov, rev - op - l1))
    want("surplus=max(0,proj-fee)", approx(surplus, max(0.0, proj - fee)))
    want("used=min(surplus,equiv)", approx(used, min(surplus, eq)))
    want("cold=max(0,equiv-used)", approx(cold, max(0.0, eq - used)))
    want("cold>=0", cold >= -EPS)
    want("surplus>=0", surplus >= -EPS)
    # Conservation: CELO into the Safe (projected + cold) minus what flows out
    # (L1+OP+Gov) equals the leftover surplus that stays in the Safe (>=0).
    want("conservation", approx(proj + cold - (l1 + op + gov), leftover))
    want("leftover>=0", leftover >= -EPS)
    # Gov funding decomposition: fee-portion + surplus_used + cold == gov
    want("gov-decomp", approx((fee - l1 - op) + used + cold, gov))
    want("accr_CELO>=0", d["accr"]["CELO"] >= -EPS)
    return fails


def main():
    if not API:
        print("Set DUNE_API_KEY"); sys.exit(1)
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 12
    random.seed(1234)

    print("Fetching Dune rows + current balances once...")
    rows = R.fetch_results(API)
    safe_now = cell_bal(R.SAFE_ADDR)
    vault_now = sum(cell_bal(v) for v in R.FEE_VAULTS)
    fh_now = cell_bal(R.FEE_HANDLER)
    try:
        cf = R.cast_cmd(["cast", "call", R.FEE_HANDLER, "getCarbonFraction()(uint256)", "--rpc-url", RPC])
        clabs = max(0.0, 1.0 - (int(cf.split()[0]) / 1e24 if cf else 0.0))
    except Exception:
        clabs = 1.0
    wd = R.dune_run_sql(API, ("SELECT max(block_time) AS t FROM celo.logs "
                              f"WHERE contract_address IN ({','.join(v.lower() for v in R.FEE_VAULTS)}) "
                              f"AND topic0 = {R.WITHDRAWAL_TOPIC0}"), "tmp_lastwd_verify")
    last_wd = (wd[0].get("t") or "")[:10] if wd else ""
    print(f"safe_now={safe_now:,.0f} vault_now={vault_now:,.0f} fh_now={fh_now:,.0f} "
          f"clabs={clabs:.2f} last_wd={last_wd}\n")

    start = dt.date.fromisoformat(DATA_START)
    end = dt.date.fromisoformat(DATA_END)
    span = (end - start).days

    # Deliberate windows + random ones (all clamped to post-cutoff to match the
    # default tool behavior; the engine is tested on the raw accrual either way).
    windows = [("2026-04-09", "2026-06-18"), ("2026-05-01", "2026-05-15"),
               ("2026-04-09", "2026-04-30"), ("2026-06-01", "2026-06-18")]
    while len(windows) < n:
        a = start + dt.timedelta(days=random.randint(0, span - 2))
        b = a + dt.timedelta(days=random.randint(1, max(1, (end - a).days)))
        fa = max(a.isoformat(), CUTOFF_NEXT)  # clamp like the tool
        if fa < b.isoformat():
            windows.append((fa, b.isoformat()))

    total_fail = 0
    results = []
    for i, (fa, fb) in enumerate(windows, 1):
        try:
            d = run_window(rows, fa, fb, safe_now, vault_now, fh_now, clabs, last_wd)
        except Exception as e:
            print(f"[{i:2}] {fa}->{fb}  ERROR: {e}")
            total_fail += 1
            continue
        if d is None:
            print(f"[{i:2}] {fa}->{fb}  (no data)")
            continue
        fails = check_identities(f"{fa}->{fb}", d)
        results.append((fa, fb, d))
        status = "OK  " if not fails else "FAIL"
        total_fail += len(fails)
        print(f"[{i:2}] {fa}->{fb}  {status}  "
              f"fee={d['fee_celo']:>12,.0f} equiv={d['stables_celo_equiv']:>11,.0f} "
              f"surplus={d['surplus']:>10,.0f} cold={d['cold_send']:>11,.0f} gov={d['gov_celo']:>12,.0f}"
              + ("  <<< " + ",".join(fails) if fails else ""))

    # Additivity: accr[A,C] == accr[A,M] + accr[M+1,C] for CELO, on 3 splits.
    print("\nAdditivity checks (CELO accrual composes across adjacent windows):")
    splits = [("2026-04-09", "2026-05-09", "2026-06-18"),
              ("2026-04-09", "2026-04-30", "2026-05-31"),
              ("2026-05-01", "2026-05-20", "2026-06-10")]
    for a, m, c in splits:
        try:
            full, _ = R.compute_token_accruals(API, RPC, a, c, clabs)
            left, _ = R.compute_token_accruals(API, RPC, a, m, clabs)
            mnext = (dt.date.fromisoformat(m) + dt.timedelta(days=1)).isoformat()
            right, _ = R.compute_token_accruals(API, RPC, mnext, c, clabs)
            lhs, rhs = full["CELO"], left["CELO"] + right["CELO"]
            ok = "OK  " if approx(lhs, rhs, eps=50) else "FAIL"
            if not approx(lhs, rhs, eps=50):
                total_fail += 1
            print(f"  {a}->{c}: full={lhs:>12,.0f}  parts={rhs:>12,.0f}  diff={lhs-rhs:>8,.0f}  {ok}")
        except Exception as e:
            print(f"  {a}->{c}: ERROR {e}")
            total_fail += 1

    print(f"\n{'='*60}\nTOTAL FAILURES: {total_fail}")
    sys.exit(1 if total_fail else 0)


if __name__ == "__main__":
    main()
