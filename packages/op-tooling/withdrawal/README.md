# L2 to L1 withdrawals

Follow workflow below to perform L2 to L1 withdrawal

Important: Always provide private keys without `0x` prefix to the scripts

## Initiate withdrawal on L2

Notice: Treat address of `PK` as `SENDER` and specify `VALUE` in wei

```sh
RECIPIENT=... VALUE=... PK=... ./initiate.sh
```

Important: Save the **transaction hash** from the output!

## Build withdrawal proof on L2

Might require waiting up to **1 hour** until message if provable

```sh
cd build_proof && yarn install && PK=... TX_HASH=... yarn build
```

For more details check: [README for building proofs](./build_proof/)

## Prove withdrawal on L1

```sh
WITHDRAWAL_NONCE=... SENDER=... RECIPIENT=... VALUE=... GAME_INDEX=... \
  OUTPUT_ROOT_PROOF__VERSION=... OUTPUT_ROOT_PROOF__STATE_ROOT=... \
  OUTPUT_ROOT_PROOF__MESSAGE_PASSER_STORAGE_ROOT=... OUTPUT_ROOT_PROOF__LATEST_BLOCKHASH=... \
  WITHDRAWAL_PROOF=... PK=... ALCHEMY_KEY=... ./prove.sh
```

Example of withdrawal proof:
```sh
WITHDRAWAL_PROOF="[0xf8918080808080a0231eba9c2bc1784b944714d5260873e3f92b58434c1879123d58f995b342865180a0b3b0303113429f394c506a530c83a8fdbd3125d95b2310b05191cd2dbc978aa8808080a0236e8f61ecde6abfebc6c529441f782f62469d8a2cc47b7aace2c136bd3b1ff080a06babe3fe3879f4972e397c7e516ceb2699945beb318afa0ddee8e7381796f5ff808080,0xf8518080808080a0ea006b1384a4bf0219939e5483e6e82c22d13290d5055e2042541adfb1b47ec380808080a05aa8408d8bac30771c33c39b02167ad094fff70f16e4aa667623d999d04725c9808080808080,0xe2a02005084db35fe36c140bc6d2bc4d520dafa807b5e774c7276c91658a496f59cc01]"
```

Check status of correctly proved withdrawal:
```sh
WITHDRAWAL_HASH=... PROOF_SUBMITTER=... ALCHEMY_KEY=... ./get.sh
```

## Wait 7 days for withdrawal window to complete

Check if withdrawal is ready to claim:
```sh
WITHDRAWAL_HASH=... PROOF_SUBMITTER=... ALCHEMY_KEY=... ./check.sh
```

Reverts if there is any issue with withdrawal.
Blank output (`0x`) if withdrawal is ready to claim.

## Finalize & claim withdrawal

```sh
WITHDRAWAL_NONCE=... SENDER=... RECIPIENT=... VALUE=... PK=... ALCHEMY_KEY=... \
  ./finalize.sh
```
