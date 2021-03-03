#!/bin/bash
set -x
CELO_VALIDATOR_GROUP_RG_ADDRESS=FIXME      # --ledgerCustomAddresses=[0]
CELO_VALIDATOR_RG_ADDRESS=FIXME            # --ledgerCustomAddresses=[1]
SWEEP_ADDRESS=FIXME                        # --ledgerCustomAddresses=[5]
CELO_RESERVE=1000000000000000000
#CELO_RESERVE=1e18

echo "Checking cUSD balance of CELO_VALIDATOR_GROUP_RG_ADDRESS"
npx celocli account:balance $CELO_VALIDATOR_GROUP_RG_ADDRESS
GROUP_USD_BALANCE=$(npx celocli account:balance $CELO_VALIDATOR_GROUP_RG_ADDRESS | grep "cUSD" | cut -d " " -f 2)
echo "Group USD Balance: $GROUP_USD_BALANCE"
GROUP_USD_BALANCE_SIMPLE_NOTATION=$(echo $GROUP_USD_BALANCE | sed -E 's/([+-]?[0-9.]+)[eE]\+?(-?)([0-9]+)/(\1*10^\2\3)/g')
echo "Group USD Balance (simple): $GROUP_USD_BALANCE_SIMPLE_NOTATION"
if (( $(echo "$GROUP_USD_BALANCE_SIMPLE_NOTATION > 0" |bc -l) ));
then
    echo "Transferring cUSD from CELO_VALIDATOR_GROUP_RG_ADDRESS to SWEEP_ADDRESS"
    npx celocli releasegold:transfer-dollars --contract $CELO_VALIDATOR_GROUP_RG_ADDRESS --to $SWEEP_ADDRESS --value $GROUP_USD_BALANCE --useLedger --ledgerCustomAddresses=[0]
else
    echo "No cUSD balance on group account, skipping"
fi

echo "Checking cUSD balance of CELO_VALIDATOR_RG_ADDRESS"
npx celocli account:balance $CELO_VALIDATOR_RG_ADDRESS
VALIDATOR_USD_BALANCE=$(npx celocli account:balance $CELO_VALIDATOR_RG_ADDRESS | grep "cUSD" | cut -d " " -f 2)
echo "Validator USD Balance: $VALIDATOR_USD_BALANCE"
VALIDATOR_USD_BALANCE_SIMPLE_NOTATION=$(echo $VALIDATOR_USD_BALANCE | sed -E 's/([+-]?[0-9.]+)[eE]\+?(-?)([0-9]+)/(\1*10^\2\3)/g')
echo "Validator USD Balance (simple): $VALIDATOR_USD_BALANCE_SIMPLE_NOTATION"

if (( $(echo "$VALIDATOR_USD_BALANCE_SIMPLE_NOTATION > 0" |bc -l) )); then
  echo "VALIDATOR_USD_BALANCE is greater than 0"
  echo "Transferring cUSD from CELO_VALIDATOR_RG_ADDRESS to SWEEP_ADDRESS"
  npx celocli releasegold:transfer-dollars --contract $CELO_VALIDATOR_RG_ADDRESS --to $SWEEP_ADDRESS --value $VALIDATOR_USD_BALANCE --useLedger --ledgerCustomAddresses=[1]
else
  echo "VALIDATOR_USD_BALANCE is == 0"
  echo "No cUSD balance on validator account, skipping"
fi


