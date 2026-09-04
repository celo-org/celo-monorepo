# USA₮ Launch Rewards Distribution

Tooling to pay out the USA₮ launch-campaign rewards, computed by the Dune
queries below. Rates were bumped 10x effective 2026-09-02, forward-only — a
milestone's reward is decided by its completion date:

| Milestone | before 2026-09-02 | from 2026-09-02 |
|---|---|---|
| Base drip (separate drip system) | 0.50 | 5.00 |
| P2P transfer to an EOA | 0.20 | 2.00 |
| Hold for ≥10 consecutive days | 0.30 (> $5) | 3.00 (> $50) |

This tooling pays the P2P + hold portion (max 5.00 USA₮ per wallet). All
milestone activity is measured on USA₮ only. A wallet counts as verified when
it holds the Self SBT or has received a faucet drip (the faucet only pays
Self-verified humans). The drip itself is the faucet's job and is not part of
this tooling.

- [7505627 — Verified-User Reward Funnel](https://dune.com/queries/7505627)
- [7506058 — Per-Account Rewards Ledger (Earned / Paid / Owed)](https://dune.com/queries/7506058)

Token: USA₮ ("Tether America USD", 6 decimals) at
`0xD2ab3C9A02DBBAB236BfEC45D1d755DF4267F771` on Celo mainnet.

## Flow

1. **Fetch the ledger** into `recipients.json` (wallets with `owed_usat > 0`,
   amounts in micro-USA₮):

   ```bash
   DUNE_API_KEY=... ./fetch-recipients.py --distributor <HOT_WALLET_ADDRESS>
   ```

   `--distributor` makes the ledger subtract USA₮ already sent by the hot
   wallet, so re-running after a payout only lists the remainder. Omitting it
   treats every reward as unpaid — only safe for the very first round.

2. **Simulate** (no transactions sent):

   ```bash
   PRIVATE_KEY=... ./distribute_usat_rewards.sh
   ```

   Review the logged recipient count, total payout, and hot wallet balance.

3. **Broadcast**:

   ```bash
   PRIVATE_KEY=... ./distribute_usat_rewards.sh --broadcast
   ```

   Instead of `PRIVATE_KEY`, a keystore or hardware wallet can be used:
   `./distribute_usat_rewards.sh --broadcast --account hotwallet` (or
   `--ledger --sender <addr>`).

4. **Record the distributor on Dune**: set the `distributor_address` parameter
   of both queries to the hot wallet address so the dashboard's
   `paid_out_usat` / `payment_status` columns reflect the payout.

## Safety rails in the forge script

- Recipients must be strictly ascending — rejects duplicates in O(n).
- Every amount must be `> 0` and `<= MAX_PER_WALLET` (default 1 USA₮).
- Aborts if the hot wallet balance is below the total payout.
- Plain `forge script` run is a simulation; nothing is sent without
  `--broadcast`.

## Double-payment protection (idempotency)

The **on-chain record via Dune is the authority**; the local ledger only covers
the window Dune has not indexed yet. Every payment is counted exactly once:

1. **Fresh Dune fetch before every run.** With `DUNE_API_KEY` and
   `DISTRIBUTOR_ADDRESS` set, the wrapper re-executes ledger query 7506058
   (never cached) before broadcasting. Dune computes `owed = earned − paid`
   from actual on-chain USA₮ transfers out of the hot wallet — a wallet paid
   its 0.30 in the past is owed only the remainder. Without those env vars the
   wrapper refuses to broadcast (`ALLOW_STALE=1` to override).
2. **Reconciliation at fetch time.** `fetch-recipients.py` subtracts any
   local-ledger surplus Dune has not indexed yet
   (`max(0, local_paid − dune_paid)` per wallet) from the owed amounts, then
   clears the ledger's amounts (tx hashes kept for recorder dedupe). Invariant:
   after a fetch, the ledger only ever holds payments made *after* it.
3. **Local paid ledger between fetches.** After every broadcast — including a
   failed one — the wrapper records each confirmed transfer from the forge
   receipts (`record-payments.py`, tx-hash deduped). The forge script subtracts
   the ledger in full, so a no-fetch re-run (e.g. right after a crash) sends
   only the outstanding remainder.
4. If reconciliation leaves nobody owed, the wrapper skips the forge run
   entirely ("Nothing owed").

Verified end-to-end on anvil: past-payment netting (0.30 paid → only 0.20
sent) in all three visibility cases (Dune indexed / Dune stale / both layers
aware), crash mid-broadcast + recovery, stale-Dune refetch after full payout
(sends nothing), and plain identical re-runs (send nothing).

Never delete `paid-ledger.json` between a broadcast and the next successful
fetch — in that window it is the only payment memory.
