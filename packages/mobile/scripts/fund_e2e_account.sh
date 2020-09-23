#!/usr/bin/env sh
set -euo pipefail

CURRENT_CONFIG=$(celocli config:get | awk '{print $2 }')
celocli config:set -n https://alfajores-forno.celo-testnet.org

TEST_ACCOUNT=0x6131a6d616a4be3737b38988847270a64bc10caa

echo "Verifying balancess of test account: $TEST_ACCOUNT"

celocli account:balance $TEST_ACCOUNT >> balance.tmp
WEI_DECIMALS=$((10**18))
printf -v USD_BALANCE "%.f" "$(grep usd balance.tmp | awk -v wei_decimals="$WEI_DECIMALS" '{print $2 / wei_decimals}')"
printf -v CELO_BALANCE "%.f" "$(grep gold balance.tmp | awk -v wei_decimals="$WEI_DECIMALS" '{print $2 / wei_decimals}')"

echo "cUSD balance: $USD_BALANCE"
echo "CELO balance: $CELO_BALANCE"

if [ "$USD_BALANCE" -lt "200" ]; then
  echo "Adding USD to test account"
  celotooljs account faucet --celo-env alfajores --account $TEST_ACCOUNT --dollar 1000 --yesreally
fi
if [ "$CELO_BALANCE" -lt "200" ]; then
  echo "Adding CELO to test account"
  celotooljs account faucet --celo-env alfajores --account $TEST_ACCOUNT --gold 1000 --yesreally
fi

echo "Restoring celocli to use $CURRENT_CONFIG"
celocli config:set -n $CURRENT_CONFIG

rm balance.tmp
