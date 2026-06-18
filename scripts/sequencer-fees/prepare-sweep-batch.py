#!/usr/bin/env python3
"""
Prepare a Safe Transaction Builder batch for the one-time CGP-287 pre-cutoff
sweep.

Pre-cutoff sequencer revenue (before 2026-04-08) was returned to Governance
via CGP-287. This batch moves the equivalent CELO amount from the cold wallet
Safe to a recipient address provided by the operator.

Usage:
    python3 prepare-sweep-batch.py \\
        --celo-amount 250000.5 \\
        --recipient 0xRECIPIENT \\
        --cold-wallet-safe 0xCOLDSAFE \\
        > sweep-batch.json

    # Upload sweep-batch.json to Safe Transaction Builder of the cold wallet Safe.

Requires: cast (foundry) for calldata encoding
"""

import argparse
import json
import subprocess
import sys
from decimal import Decimal

CELO_TOKEN = "0x471EcE3750Da237f93B8E339c536989b8978a438"
CHAIN_ID = "42220"


def cast_calldata(sig: str, args: list) -> str:
    cmd = ["cast", "calldata", sig] + args
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"cast calldata failed: {result.stderr}", file=sys.stderr)
        sys.exit(1)
    return result.stdout.strip()


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Safe batch for CGP-287 pre-cutoff sweep")
    parser.add_argument("--celo-amount", type=Decimal, required=True, help="CELO amount to sweep (human units, decimal string)")
    parser.add_argument("--recipient", required=True, help="Recipient address (TBD per operator)")
    parser.add_argument("--cold-wallet-safe", required=True, help="Cold wallet Safe address (createdFromSafeAddress)")
    args = parser.parse_args()

    if args.celo_amount <= 0:
        print("ERROR: --celo-amount must be > 0", file=sys.stderr)
        sys.exit(1)

    amount_wei = int(args.celo_amount * Decimal(10) ** 18)

    print(f"=== CGP-287 Pre-cutoff Sweep Batch ===", file=sys.stderr)
    print(f"  Cold wallet Safe: {args.cold_wallet_safe}", file=sys.stderr)
    print(f"  Recipient:        {args.recipient}", file=sys.stderr)
    print(f"  Amount:           {args.celo_amount:,.6f} CELO ({amount_wei} wei)", file=sys.stderr)
    print("", file=sys.stderr)

    data = cast_calldata("transfer(address,uint256)", [args.recipient, str(amount_wei)])

    batch = {
        "version": "1.0",
        "chainId": CHAIN_ID,
        "createdAt": 0,
        "meta": {
            "name": "CGP-287 Pre-cutoff Sweep",
            "description": (
                f"One-time sweep of pre-CGP-287 sequencer revenue equivalent. "
                f"Transfers {args.celo_amount} CELO to {args.recipient}."
            ),
            "txBuilderVersion": "1.16.5",
            "createdFromSafeAddress": args.cold_wallet_safe,
            "createdFromOwnerAddress": "",
        },
        "transactions": [
            {
                "to": CELO_TOKEN,
                "value": "0",
                "data": data,
                "contractMethod": None,
                "contractInputsValues": None,
            },
        ],
    }

    print(json.dumps(batch, indent=2))


if __name__ == "__main__":
    main()
