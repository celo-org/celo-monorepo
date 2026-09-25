"""Unit tests for the ledger netting in main.reconcile.

Amounts are micro-USA₮. A Dune row carries earned/paid_out/owed as Dune
computes them from indexed on-chain transfers; the ledger is what the
function itself has sent so far (cumulative per wallet).
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from main import ledger_add, reconcile  # noqa: E402

W = "0x6d2c5e1fa357c62e671b289e0ff7fc89accd8b3a"


def row(wallet, earned, paid, owed=None):
    owed = max(0, earned - paid) if owed is None else owed
    return {
        "wallet": wallet,
        "earned_usat": f"{earned / 1e6:.2f}",
        "paid_out_usat": paid / 1e6,
        "owed_usat": owed / 1e6,
    }


def ledger(**amounts):
    wallets = sorted(amounts)
    return {"recipients": wallets, "amounts": [amounts[w] for w in wallets], "recorded_tx_hashes": []}


def test_new_earner_is_paid_in_full():
    owed, _ = reconcile([row(W, 800_000, 0)], ledger())
    assert owed == {W: 800_000}


def test_indexed_payment_is_netted_by_dune_alone():
    owed, _ = reconcile([row(W, 800_000, 800_000)], ledger(**{W: 800_000}))
    assert owed == {}


def test_unindexed_payment_is_netted_by_ledger():
    # Paid 0.80 a minute ago; Dune has not seen it yet.
    owed, _ = reconcile([row(W, 800_000, 0)], ledger(**{W: 800_000}))
    assert owed == {}


def test_second_milestone_after_first_was_indexed():
    # P2P 0.40 paid and indexed, hold 0.60 newly earned.
    owed, _ = reconcile([row(W, 1_000_000, 400_000)], ledger(**{W: 400_000}))
    assert owed == {W: 600_000}


def test_regression_old_indexed_plus_fresh_unindexed_payment():
    # The 2026-09-25 double payment: 0.40 paid on Sep 14 (indexed), 0.60 paid
    # by run 1 at 08:08 (not indexed when run 2 fetched Dune at 08:30).
    # Cumulative ledger 1.00 vs Dune 0.40 -> 0.60 unindexed -> nothing owed.
    dune = [row(W, 1_000_000, 400_000)]
    owed, kept = reconcile(dune, ledger(**{W: 1_000_000}))
    assert owed == {}
    # The ledger must come back untouched, not trimmed to the surplus.
    assert dict(zip(kept["recipients"], kept["amounts"])) == {W: 1_000_000}


def test_trimmed_ledger_reproduces_the_bug():
    # Documents why trimming is wrong: the old code left only the 0.60 surplus
    # in the ledger, and 0.60 - 0.40 under-counts the unindexed part.
    owed, _ = reconcile([row(W, 1_000_000, 400_000)], ledger(**{W: 600_000}))
    assert owed == {W: 400_000}  # exactly the erroneous second payment


def test_ledger_missing_old_payments_defers_to_dune():
    # Ledger only knows a recent 0.60; Dune knows 1.00 total. Dune wins.
    owed, _ = reconcile([row(W, 1_000_000, 1_000_000)], ledger(**{W: 600_000}))
    assert owed == {}


def test_back_to_back_runs_never_double_pay():
    # Run A pays a fresh earner; Dune lags for runs B and C; then catches up.
    led = ledger()
    owed, led = reconcile([row(W, 800_000, 0)], led)
    assert owed == {W: 800_000}
    led = ledger_add(led, W, 800_000, "0xaa")
    for _ in range(2):  # runs B, C: Dune still shows nothing paid
        owed, led = reconcile([row(W, 800_000, 0)], led)
        assert owed == {}
    owed, led = reconcile([row(W, 800_000, 800_000)], led)  # Dune caught up
    assert owed == {}
    assert dict(zip(led["recipients"], led["amounts"])) == {W: 800_000}


def test_wallet_case_is_merged():
    mixed = {"recipients": [W, W.upper().replace("0X", "0x")], "amounts": [300_000, 300_000], "recorded_tx_hashes": []}
    owed, kept = reconcile([row(W, 1_000_000, 0)], mixed)
    assert owed == {W: 400_000}
    assert kept["recipients"] == [W] and kept["amounts"] == [600_000]
