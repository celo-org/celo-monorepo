#!/bin/bash
set -x

COLD_ADDRESS=FIXME                        # --ledgerCustomAddresses=[5]
GROUP=FIXME
LEDGER_CMD='--useLedger --ledgerCustomAddresses=[5]'

npx celocli election:activate --from $COLD_ADDRESS $LEDGER_CMD



