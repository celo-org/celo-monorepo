#!/usr/bin/env python3
"""
Prepare a Safe Transaction Builder batch for sequencer fee distribution.

Stablecoins are RETAINED in the Safe (offset by cold-wallet CELO top-up in
report). OP Superchain share is swapped CELO -> WETH on Uniswap V3 (Celo)
and sent to the OP recipient as WETH. Remaining CELO is sent to Governance.

Usage:
    # Step 1: Withdraw from vault (anyone can do this, permissionless)
    cast send 0x4200000000000000000000000000000000000011 "withdraw()" \\
      --rpc-url https://forno.celo.org --private-key $PK

    # Step 2: Generate the Safe batch
    python3 prepare-safe-batch.py \\
        --l1-cost-celo 10000 \\
        --op-share-celo 5000 \\
        --op-share-recipient 0x... \\
        --op-share-weth-min 1.23 > batch.json

    # Step 3: Go to app.safe.global -> Transaction Builder -> upload batch.json
    # Step 4: Two signers approve and execute

Requires: cast (foundry) for on-chain reads
"""

import argparse
import json
import os
import subprocess
import sys
from decimal import Decimal

# ---------------------------------------------------------------------------
# Addresses
# ---------------------------------------------------------------------------

SAFE = "0x7A1E98FC9a008107DbD1f430a05Ace8cf6f3FE19"
GOVERNANCE = "0xD533Ca259b330c7A88f74E000a3FaEa2d63B7972"
CELO_TOKEN = "0x471EcE3750Da237f93B8E339c536989b8978a438"
VAULT = "0x4200000000000000000000000000000000000011"

# L1 cost reimbursement recipient (hardwired; --l1-cost-recipient CLI overrides)
L1_COST_RECIPIENT_DEFAULT = "0x6b145ebf66602ec524b196426b46631259689583"

# OP revenue share recipient PLACEHOLDER (= Operations Safe).
# When recipient == SAFE, swap is SKIPPED (CELO retained in Safe, no slippage).
# Override via --op-share-recipient once real OP address is known.
OP_SHARE_RECIPIENT_DEFAULT = SAFE

# Surplus recipient PLACEHOLDER (= Operations Safe).
# Receives CGP-287 pre-cutoff residual (revenue equiv - CGP-287 already paid).
# Override via --surplus-recipient once real surplus wallet is known.
SURPLUS_RECIPIENT_DEFAULT = SAFE

# CGP-287 already paid to Governance on 2026-04-01 (Safe -> Gov, on-chain confirmed).
# Used to compute pre-cutoff residual that gets routed to SURPLUS_RECIPIENT.
CGP_287_PAID_TO_GOV_CELO = 1748952

# Canonical bridged WETH on Celo L2 (name: "Wrapped Ether (Celo native bridge)")
WETH = "0xD221812de1BD094f35587EE8E174B07B6167D9Af"

# Uniswap V3 SwapRouter02 on Celo (factory: 0xAfE208a311B21f13EF87E33A90049fC17A7acDEc)
SWAP_ROUTER = "0x5615CDAb10dc425a742d643d949a7F474C01abc4"

# CELO/WETH Uniswap V3 pool fee tier (0.3% - only tier with material liquidity)
POOL_FEE = 3000

# Tokens read from Safe for reporting only (stablecoins are retained, not sent)
TOKENS = {
    "CELO": {"address": CELO_TOKEN, "decimals": 18},
    "USDT": {"address": "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e", "decimals": 6},
    "USDC": {"address": "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", "decimals": 6},
    "USDm": {"address": "0x765DE816845861e75A25fCA122bb6898B8B1282a", "decimals": 18},
    "EURm": {"address": "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73", "decimals": 18},
}

RPC_URL = os.environ.get("RPC_URL", "https://forno.celo.org")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def cast_call(to: str, sig: str, args: list = None) -> str:
    cmd = ["cast", "call", to, sig] + (args or []) + ["--rpc-url", RPC_URL]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        return "0"
    return result.stdout.strip().split()[0]


def cast_calldata(sig: str, args: list = None) -> str:
    cmd = ["cast", "calldata", sig] + (args or [])
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout.strip()


def get_balance(token_addr: str, holder: str) -> int:
    raw = cast_call(token_addr, "balanceOf(address)(uint256)", [holder])
    return int(raw)


def get_native_balance(addr: str) -> int:
    cmd = ["cast", "balance", addr, "--rpc-url", RPC_URL]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return int(result.stdout.strip()) if result.returncode == 0 else 0


def safe_tx(to: str, data: str, value: str = "0") -> dict:
    return {
        "to": to,
        "value": value,
        "data": data,
        "contractMethod": None,
        "contractInputsValues": None,
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Generate Safe batch for sequencer fee distribution")
    parser.add_argument("--l1-cost-celo", type=Decimal, default=Decimal(0), help="L1 cost to withhold/send in CELO (human units)")
    parser.add_argument("--l1-cost-recipient", default=L1_COST_RECIPIENT_DEFAULT, help=f"Address to send L1 costs to (default: {L1_COST_RECIPIENT_DEFAULT})")
    parser.add_argument("--op-share-celo", type=Decimal, default=Decimal(0), help="OP share size in CELO (human units)")
    parser.add_argument("--op-share-recipient", default=OP_SHARE_RECIPIENT_DEFAULT, help=f"OP recipient. If == Safe ({SAFE}) (placeholder), swap is SKIPPED and OP CELO retained in Safe.")
    parser.add_argument("--op-share-weth-min", type=Decimal, default=Decimal(0), help="Minimum WETH out from swap (slippage protection, human units). REQUIRED when swap is enabled (recipient != Safe).")
    parser.add_argument("--surplus-celo", type=Decimal, default=Decimal(0), help="Pre-CGP-287 residual CELO (computed by report.py)")
    parser.add_argument("--surplus-recipient", default=SURPLUS_RECIPIENT_DEFAULT, help=f"Surplus recipient (default placeholder = Safe: {SURPLUS_RECIPIENT_DEFAULT})")
    parser.add_argument("--reserve-celo", type=Decimal, default=Decimal(0), help="CELO to keep in Safe as buffer")
    parser.add_argument("--dry-run", action="store_true", help="Print plan without generating batch JSON")
    parser.add_argument("--safe", default=SAFE, help=f"Safe address (default: {SAFE})")
    args = parser.parse_args()

    print("=== Sequencer Fee Distribution - Safe Batch Generator ===", file=sys.stderr)
    print("", file=sys.stderr)

    # ---- Check vault status ----
    vault_balance = get_native_balance(VAULT)
    if vault_balance > 10 ** 18:
        print(f"WARNING: Vault still holds {vault_balance / 1e18:,.2f} CELO.", file=sys.stderr)
        print(f"  Run first:  cast send {VAULT} 'withdraw()' --rpc-url {RPC_URL} --private-key $PK", file=sys.stderr)
        print("", file=sys.stderr)

    # ---- Read Safe balances ----
    balances = {}
    print(f"Safe balances:", file=sys.stderr)
    for name, info in TOKENS.items():
        bal = get_balance(info["address"], args.safe)
        balances[name] = bal
        if bal > 0:
            human = bal / 10 ** info["decimals"]
            print(f"  {name}: {human:,.2f}", file=sys.stderr)

    # ---- Validate OP swap inputs ----
    # Swap is SKIPPED when OP recipient is the Safe itself (placeholder mode).
    op_recipient_normalized = (args.op_share_recipient or "").lower()
    op_is_placeholder = op_recipient_normalized == args.safe.lower()
    swap_op_share = args.op_share_celo > 0 and not op_is_placeholder
    if swap_op_share and args.op_share_weth_min <= 0:
        print("\nERROR: --op-share-weth-min REQUIRED when OP recipient != Safe "
              "(slippage protection for CELO->WETH swap).", file=sys.stderr)
        sys.exit(1)

    # ---- Calculate CELO distribution ----
    one_eth = Decimal(10) ** 18
    l1_cost_wei = int(args.l1_cost_celo * one_eth)
    op_share_wei = int(args.op_share_celo * one_eth)
    surplus_wei = int(args.surplus_celo * one_eth)
    reserve_wei = int(args.reserve_celo * one_eth)
    weth_min_wei = int(args.op_share_weth_min * one_eth)
    celo_balance = balances.get("CELO", 0)
    # OP CELO leaves Safe ONLY when swap runs. When placeholder (no swap), OP CELO stays in Safe.
    op_celo_leaves_safe = op_share_wei if swap_op_share else 0
    # Surplus CELO leaves Safe ONLY when recipient != Safe.
    surplus_recipient_normalized = (args.surplus_recipient or "").lower()
    surplus_is_self = surplus_recipient_normalized == args.safe.lower()
    surplus_leaves_safe = surplus_wei if not surplus_is_self else 0
    celo_to_governance = (
        celo_balance - l1_cost_wei - op_celo_leaves_safe - surplus_leaves_safe - reserve_wei
    )
    # When OP / surplus stay in Safe (placeholder mode), reduce Gov amount by their nominal
    # withholding so they remain in Safe instead of leaking into the Gov transfer.
    if not swap_op_share:
        celo_to_governance -= op_share_wei
    if surplus_is_self:
        celo_to_governance -= surplus_wei

    if celo_to_governance <= 0:
        print(
            f"\nERROR: CELO balance ({celo_balance / 1e18:,.2f}) doesn't cover "
            f"L1 ({args.l1_cost_celo:,.0f}) + OP ({args.op_share_celo:,.0f}) + "
            f"surplus ({args.surplus_celo:,.0f}) + reserve ({args.reserve_celo:,.0f}).",
            file=sys.stderr,
        )
        print(f"  Cold wallet top-up may be required - see report.py", file=sys.stderr)
        sys.exit(1)

    # ---- Display plan ----
    print(f"\n=== Distribution Plan ===", file=sys.stderr)
    print(f"  CELO breakdown:", file=sys.stderr)
    print(f"    Total balance:    {celo_balance / 1e18:>12,.2f}", file=sys.stderr)
    print(f"    - L1 costs:       {l1_cost_wei / 1e18:>12,.2f} CELO  -> {args.l1_cost_recipient}", file=sys.stderr)
    if swap_op_share:
        print(f"    - OP share:       {op_share_wei / 1e18:>12,.2f} CELO  -> swap to WETH (min {args.op_share_weth_min:,.6f}) -> {args.op_share_recipient}", file=sys.stderr)
    else:
        print(f"    - OP share:       {op_share_wei / 1e18:>12,.2f} CELO  -> RETAINED in Safe (placeholder recipient, no swap)", file=sys.stderr)
    if surplus_wei > 0:
        if surplus_is_self:
            print(f"    - Surplus (CGP):  {surplus_wei / 1e18:>12,.2f} CELO  -> Safe (self-transfer, audit trail)", file=sys.stderr)
        else:
            print(f"    - Surplus (CGP):  {surplus_wei / 1e18:>12,.2f} CELO  -> {args.surplus_recipient}", file=sys.stderr)
    print(f"    - Reserve:        {reserve_wei / 1e18:>12,.2f} CELO  -> Safe", file=sys.stderr)
    print(f"    = To Governance:  {celo_to_governance / 1e18:>12,.2f} CELO  -> {GOVERNANCE}", file=sys.stderr)

    print(f"  Stablecoins (RETAINED in Safe - offset by cold-wallet CELO top-up):", file=sys.stderr)
    for name, info in TOKENS.items():
        if name == "CELO":
            continue
        bal = balances.get(name, 0)
        if bal > 0:
            print(f"    {name}: {bal / 10**info['decimals']:>12,.2f}  -> Safe", file=sys.stderr)

    if args.dry_run:
        print("\n--dry-run: no batch JSON generated.", file=sys.stderr)
        sys.exit(0)

    # ---- Build Safe batch transactions ----
    transactions = []

    # L1 cost transfer
    if l1_cost_wei > 0 and args.l1_cost_recipient:
        data = cast_calldata("transfer(address,uint256)", [args.l1_cost_recipient, str(l1_cost_wei)])
        transactions.append(safe_tx(CELO_TOKEN, data))

    # OP share: swap CELO -> WETH on Uniswap V3, send WETH to OP recipient (only if non-placeholder)
    if swap_op_share:
        # 1) Approve SwapRouter02 to spend op_share_wei CELO
        approve_data = cast_calldata("approve(address,uint256)", [SWAP_ROUTER, str(op_share_wei)])
        transactions.append(safe_tx(CELO_TOKEN, approve_data))

        # 2) exactInputSingle: CELO -> WETH at fee tier POOL_FEE, recipient = OP address
        # SwapRouter02 (no deadline param):
        #   struct ExactInputSingleParams { tokenIn, tokenOut, fee, recipient, amountIn, amountOutMinimum, sqrtPriceLimitX96 }
        params = f"({CELO_TOKEN},{WETH},{POOL_FEE},{args.op_share_recipient},{op_share_wei},{weth_min_wei},0)"
        swap_data = cast_calldata(
            "exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))",
            [params],
        )
        transactions.append(safe_tx(SWAP_ROUTER, swap_data))

    # Surplus (CGP-287 pre-cutoff residual): explicit transfer for audit trail.
    # If recipient == Safe (placeholder), this is a Safe -> Safe self-transfer
    # that documents the residual carve-out without moving funds elsewhere.
    if surplus_wei > 0:
        surplus_data = cast_calldata("transfer(address,uint256)", [args.surplus_recipient, str(surplus_wei)])
        transactions.append(safe_tx(CELO_TOKEN, surplus_data))

    # CELO to Governance (remaining)
    data = cast_calldata("transfer(address,uint256)", [GOVERNANCE, str(celo_to_governance)])
    transactions.append(safe_tx(CELO_TOKEN, data))

    # NOTE: Stablecoins intentionally NOT transferred. They are retained in the Safe.
    # The CELO equivalent is provided to Governance via cold-wallet top-up before
    # this batch runs - see report.py "Cold wallet top-up" line.

    # ---- Output Safe Transaction Builder JSON ----
    batch = {
        "version": "1.0",
        "chainId": "42220",
        "createdAt": 0,
        "meta": {
            "name": "Sequencer Fee Distribution",
            "description": (
                f"Sequencer revenue distribution. L1 costs: {args.l1_cost_celo} CELO. "
                f"OP share: {args.op_share_celo} CELO -> WETH. Stables retained in Safe."
            ),
            "txBuilderVersion": "1.16.5",
            "createdFromSafeAddress": args.safe,
            "createdFromOwnerAddress": "",
        },
        "transactions": transactions,
    }

    print(f"\nBatch has {len(transactions)} transactions:", file=sys.stderr)
    for i, tx in enumerate(transactions):
        print(f"  [{i+1}] to={tx['to'][:10]}... data={tx['data'][:20]}...", file=sys.stderr)

    print(json.dumps(batch, indent=2))


if __name__ == "__main__":
    main()
