# USA₮ Rewards — Cloud Function

Automated version of the distribution flow in the parent directory: a gen2
Google Cloud Function triggered by Cloud Scheduler, paying the P2P (0.20) and
hold (0.30) milestones on a schedule until the campaign budget runs out.

Each run: acquire GCS run-lock → fresh Dune ledger execution (owed = earned −
on-chain paid from the hot wallet) → reconcile against the GCS paid ledger →
safety checks → sequential ERC-20 transfers, each confirmed payment persisted
to the ledger immediately. Same double-payment math as the CLI flow; see the
parent README.

## Deploy

```bash
PROJECT=<gcp-project> \
USAT_PRIVATE_KEY=0x... \
DUNE_API_KEY=... \
./deploy.sh
```

Creates (idempotently): the state bucket, the two Secret Manager secrets, an
invoker service account, the function (`--max-instances 1`, no unauthenticated
access), and a Cloud Scheduler job (default Mondays 09:00 UTC — override with
`SCHEDULE="..."`).

First deploy with `DRY_RUN=1` env on deploy.sh, trigger once, read the JSON
response in the logs, then redeploy with `DRY_RUN=0`.

## Safety rails

- `MAX_PER_WALLET` (default 1 USA₮) — larger owed entry aborts the run
- `MAX_TOTAL_PER_RUN` (default 100 USA₮) — larger total aborts for manual
  review; raise deliberately if a big backlog is expected
- Token + gas balance checks before the first transfer
- GCS generation-guarded run lock (stale after 1h) + `--max-instances 1`
- Failed/reverted transfer stops the run; everything confirmed is already in
  the ledger, so the next scheduled run pays only the remainder

## Operations

```bash
# manual trigger
gcloud scheduler jobs run usat-rewards-distributor --project $PROJECT --location $REGION
# logs
gcloud functions logs read usat-rewards-distributor --project $PROJECT --region $REGION --gen2
# state
gcloud storage cat gs://$PROJECT-usat-rewards/paid-ledger.json
```

Keep the hot wallet funded with USA₮ + a little CELO; a run with insufficient
balance aborts cleanly before sending anything.
