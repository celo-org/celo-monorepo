# USA₮ Launch Rewards Distribution

Tooling to pay out the USA₮ launch-campaign rewards, computed by the Dune
queries below. A wallet's reward tier is fixed by the amount of its first
faucet drip (the faucet enforces Self verification, 18+, and OFAC screening):

| First faucet drip | P2P send to an EOA | Hold ≥10 consecutive days | Max |
|---|---|---|---|
| $5 | 2.00 | 3.00 (> $50) | 5.00 |
| $1 | 0.40 | 0.60 (> $10) | 1.00 |
| $0.50 (legacy) or SBT-only | 0.20 | 0.30 (> $5) | 0.50 |
| $0.05 | none (unspecified) | none | 0 |

This tooling pays the P2P + hold portion only (max 5.00 USA₮ per wallet). All
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

2. **Simulate** (no transactions sent). Pass the same Dune credentials as the
   broadcast below, so the simulation refreshes the snapshot and reviews the
   numbers a real run would send — without them it simulates whatever
   `recipients.json` happens to hold, which is not what the broadcast sends:

   ```bash
   DUNE_API_KEY=... PRIVATE_KEY=... ./distribute_usat_rewards.sh
   ```

   Review the logged recipient count, total payout, and hot wallet balance. The
   broadcast refreshes again, so a wallet that qualifies in between is included
   there and not here; that is safe, because owed is always net of what has
   already been paid.

3. **Broadcast**. The wrapper refuses to broadcast without the credentials for
   its own fresh Dune fetch, so pass them here too (or keep them in a `.env`
   next to this script, which the wrapper sources):

   ```bash
   DUNE_API_KEY=... PRIVATE_KEY=... ./distribute_usat_rewards.sh --broadcast
   ```

   `DISTRIBUTOR_ADDRESS` defaults to the address derived from `PRIVATE_KEY`, and
   a value that is not that address aborts the run — the Dune snapshot would
   otherwise net out another wallet's payments.

   Instead of `PRIVATE_KEY`, a keystore or hardware wallet can be used:
   `DUNE_API_KEY=... DISTRIBUTOR_ADDRESS=0x... ./distribute_usat_rewards.sh
   --broadcast --account hotwallet` (or `--ledger --sender <addr>`). The signer
   cannot be derived in that case, so `DISTRIBUTOR_ADDRESS` must be set by hand
   and must be the wallet that actually sends the transfers.

4. **Record the distributor on Dune**: set the `distributor_address` parameter
   of both queries to the hot wallet address so the dashboard's
   `paid_out_usat` / `payment_status` columns reflect the payout.

## Safety rails

In the forge script:

- Recipients must be strictly ascending — rejects duplicates in O(n).
- Zero-address recipients are rejected (a transfer there burns the reward).
- Every amount must be `> 0` and `<= MAX_PER_WALLET` (default 5 USA₮, the
  campaign maximum after the 10× bump: P2P 2.00 + hold 3.00).
- Aborts if the hot wallet balance is below the total payout.
- Plain `forge script` run is a simulation; nothing is sent without
  `--broadcast`.

In the wrapper:

- `--broadcast` is honoured wherever it appears in the arguments, and so are the
  safety branches that key off it.
- One run at a time: the wrapper holds `.run-lock` for the whole
  fetch → forge → record sequence, so two overlapping runs cannot pay the same
  wallets from the same pre-payment snapshot. A lock held for longer than
  `LOCK_STALE_SECONDS` (default 2h) is taken over, so a killed run does not
  block every later one.
- `DISTRIBUTOR_ADDRESS` must match the signing wallet (see step 3).
- Confirmed transfers are recorded on every exit path — forge failure, Ctrl-C,
  SIGTERM — not only on a clean finish, and a recording failure is fatal: the
  wrapper exits non-zero and says how to record by hand, because payments that
  are on chain but missing from the ledger are exactly what a later run pays
  again. A broadcast file left unrecorded is replayed at the start of the next
  run, before the Dune fetch reads the ledger.
- The expected chain is pinned (`EXPECTED_CHAIN_ID`, default 42220) and the RPC
  is checked against it, never the other way round. An `anvil --celo` fork
  reports mainnet's chain id and serves the real USA₮ address, so any endpoint
  other than `https://forno.celo.org` additionally needs its own
  `PAID_LEDGER_FILE` (or an explicit `ALLOW_PRODUCTION_LEDGER=1`) before the
  wrapper will run.

## Double-payment protection (idempotency)

The **on-chain record via Dune is the authority**; the local ledger only covers
the window Dune has not indexed yet. Every payment is counted exactly once:

1. **Fresh Dune fetch before every run.** With `DUNE_API_KEY` and
   `DISTRIBUTOR_ADDRESS` set, the wrapper re-executes ledger query 7506058
   (never cached) before broadcasting. Dune computes `owed = earned − paid`
   from actual on-chain USA₮ transfers out of the hot wallet — a wallet paid
   its 0.30 in the past is owed only the remainder. Without those env vars the
   wrapper refuses to broadcast (`ALLOW_STALE=1` to override).
2. **Reconciliation at fetch time.** Dune's `paid_out_usat` is cumulative while
   the ledger only accumulates payments made since the previous fetch, so the
   ledger stores what makes the two comparable: `dune_paid_baseline` (Dune's
   cumulative paid at the previous fetch) and `unindexed` (the surplus carried
   over from it). Per wallet
   `unindexed' = max(0, unindexed + paid_since_fetch − (dune_paid_now − baseline))`
   is subtracted from Dune's owed, and the forge-visible `recipients`/`amounts`
   pair is then emptied — `recipients.json` already has the surplus subtracted,
   so the forge script must not subtract it again. A payment is therefore
   counted exactly once, however many fetches Dune takes to index it.
3. **Local paid ledger between fetches.** After every broadcast — failed or
   interrupted included — the wrapper records each confirmed transfer from the
   forge receipts (`record-payments.py`, tx-hash deduped). The forge script
   subtracts the ledger in full, so a no-fetch re-run (e.g. right after a crash)
   sends only the outstanding remainder. Only transfers of the expected token on
   the expected chain are recorded.
4. **The ledger is scoped to token, chain and distributor.** It carries all
   three, `fetch-recipients.py` refuses to reconcile a ledger from another scope
   *before* subtracting anything, and `record-payments.py` refuses to append a
   broadcast sent by a different wallet. A fork or mock-token rehearsal can
   therefore never write into — or be mistaken for — the mainnet payment record,
   and rotating the hot wallet cannot subtract the old wallet's unindexed
   payments from the new wallet's obligation. After genuinely migrating the
   payment history, `ALLOW_DISTRIBUTOR_CHANGE=1` accepts the new wallet and
   re-stamps the ledger; a token or chain mismatch is never overridable — use a
   separate `PAID_LEDGER_FILE`.
5. If reconciliation leaves nobody owed, the wrapper skips the forge run
   entirely ("Nothing owed").

Verified end-to-end on anvil: past-payment netting (0.30 paid → only 0.20
sent) in all three visibility cases (Dune indexed / Dune stale / both layers
aware), crash mid-broadcast + recovery, stale-Dune refetch after full payout
(sends nothing), and plain identical re-runs (send nothing).

Never delete `paid-ledger.json` between a broadcast and the next successful
fetch — in that window it is the only payment memory. It is gitignored so a
`git clean -fd` leaves it alone, but `-x` would still remove it.

## Completed rounds

`topoff-recipients.json` / `topoff-paid-ledger.json` are the record of a
**finished** one-time round: +4.50 USA₮ for the 275 wallets that claimed the
0.50 drip before the 10× bump, 1,237.5 USA₮ paid in full. Both files are tracked
on purpose. The ledger is what nets that round out, so a checkout carrying the
recipients without it would treat all 275 wallets as unpaid and could pay the
whole round again. The recipients file is additionally marked `"completed":
true`, which the wrapper refuses to broadcast against — before the Dune refresh,
so the archived files are not overwritten either.
