#!/bin/bash
set -x

HOT_ADDRESS=FIXME
COLD_ADDRESS=FIXME                         # --ledgerCustomAddresses=[5]
CELO_RESERVE=1*10^18                                                            # keep some CELO handy for gas

echo "Checking CELO balance of HOT_ADDRESS"
HOT_ADDRESS_CELO_BALANCE=$(npx celocli account:balance $HOT_ADDRESS | grep "CELO" | grep -v 'lockedCELO'| cut -d " " -f 2)
echo "HOT_ADDRESS CELO Balance: $HOT_ADDRESS_CELO_BALANCE"
HOT_ADDRESS_CELO_BALANCE_SIMPLE_NOTATION=$(echo $HOT_ADDRESS_CELO_BALANCE | sed -E 's/([+-]?[0-9.]+)[eE]\+?(-?)([0-9]+)/(\1*10^\2\3)/g')
echo "HOT_ADDRESS CELO Balance (simple): $HOT_ADDRESS_CELO_BALANCE_SIMPLE_NOTATION"
if (( $(echo "$HOT_ADDRESS_CELO_BALANCE_SIMPLE_NOTATION > $CELO_RESERVE" |bc -l) ));
    then
    echo "HOT_ADDRESS has > $CELO_RESERVE CELO"
    CELO_TO_SEND=$(echo "$HOT_ADDRESS_CELO_BALANCE_SIMPLE_NOTATION - $CELO_RESERVE" | bc)
    echo "Sending $CELO_TO_SEND to COLD_ADDRESS at $COLD_ADDRESS"
    npx celocli transfer:celo --from $HOT_ADDRESS --to $COLD_ADDRESS --value $CELO_TO_SEND
else
    echo "HOT_ADDRESS has < $CELO_RESERVE CELO, exiting"
    exit 0
fi