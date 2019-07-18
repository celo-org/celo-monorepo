#!/usr/bin/env bash
set -euo pipefail

CELO="$(dirname "$0")/../../../../../../.."

cd $CELO/celo-monorepo && yarn build-sdk $1;

$CELO/celo-monorepo/packages/celotool/bin/celotooljs.sh port-forward -e $1 &
sleep 5;

$CELO/celo-monorepo/packages/celotool/bin/celotooljs.sh account faucet-multiple-helper -e $1 --accounts $2

killall -9 kubectl;
