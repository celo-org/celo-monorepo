# Min base fee keeper

Keeps Celo's base fee floor (`SystemConfig.minBaseFee` on L1, applied from Jovian) at a
USD target: a USDT transfer paid in USDT (115,501 gas) costs `TARGET_USD_PER_TX` at the floor.

It calls `setMinBaseFee` through a Zodiac Roles v2 module on the SystemConfig owner Safe,
which limits the floor to fixed bounds. It reads CELO/USD from Chainlink on Celo Mainnet
and cross-checks it against Coinbase. It sends nothing when the Chainlink price is over an
hour old, the two prices differ by more than 3%, or the change is below 1%.

## Run

Settings come from env: `NETWORK` (`mainnet`, `sepolia` or `chaos`), `L1_RPC_URL`, `ROLES`
and `KEEPER_PRIVATE_KEY` (not needed with `DRY_RUN=true`). `ROLES` defaults to the deployed
Roles proxy on Sepolia and Chaos. Optional overrides and their defaults are in `loadConfig`
in `src/keeper.ts`.

```bash
yarn install && yarn build
NETWORK=chaos L1_RPC_URL=<sepolia rpc> node dist/index.js --dry-run
NETWORK=chaos L1_RPC_URL=<sepolia rpc> KEEPER_PRIVATE_KEY=<key> node dist/index.js
```

It prints the result as JSON on the last line. It fails (exit code 1 locally, HTTP 500 and
an `ERROR` log entry as a function) when a human should look: stale or disagreeing prices,
a floor the Roles module rejects, or a failed tx.

As a daily Google Cloud Function, with the key and RPC URL in Secret Manager:

```bash
gcloud functions deploy min-base-fee-keeper --gen2 --runtime=nodejs22 --region=<region> \
  --source=. --entry-point=keeper --trigger-http --no-allow-unauthenticated --timeout=300s \
  --set-env-vars=NETWORK=mainnet,ROLES=<roles> \
  --set-secrets=L1_RPC_URL=<rpc-secret>:latest,KEEPER_PRIVATE_KEY=<key-secret>:latest
gcloud scheduler jobs create http min-base-fee-keeper --location=<region> \
  --schedule='0 12 * * *' --uri=<function-url> --http-method=POST --attempt-deadline=320s \
  --oidc-service-account-email=<invoker-service-account>
```

Alert on `ERROR` entries from the function and on days without a run.

## Test

```bash
yarn test
```
