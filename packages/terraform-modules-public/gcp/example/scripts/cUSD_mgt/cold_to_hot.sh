#!/bin/bash
set -x

#echo `which celocli`
#exit


CELOCLI='/Users/dc/.nvm/versions/node/v10.22.0/bin/celocli'
LEDGER_CMD='--useLedger --ledgerCustomAddresses=[5]'

#$CELOCLI -v
#exit

HOT_ADDRESS=FIXME
COLD_ADDRESS=FIXME                        # --ledgerCustomAddresses=[5]
#CUSD_RESERVE=1*10^18
#CUSD_RESERVE=6738*10^18
CUSD_RESERVE=0
#tax reserve as of 8/31/2020

echo "Checking cUSD balance of COLD_ADDRESS"
COLD_ADDRESS_CUSD_BALANCE=$($CELOCLI account:balance $COLD_ADDRESS | grep "cUSD" | cut -d " " -f 2)
echo "COLD_ADDRESS cUSD Balance: $COLD_ADDRESS_CUSD_BALANCE"
COLD_ADDRESS_CUSD_BALANCE_SIMPLE_NOTATION=$(echo $COLD_ADDRESS_CUSD_BALANCE | sed -E 's/([+-]?[0-9.]+)[eE]\+?(-?)([0-9]+)/(\1*10^\2\3)/g')
echo "Cold_ADDRESS cUSD Balance (simple): $COLD_ADDRESS_CUSD_BALANCE_SIMPLE_NOTATION"
if (( $(echo "$COLD_ADDRESS_CUSD_BALANCE_SIMPLE_NOTATION > $CUSD_RESERVE" |bc -l) ));
    then
    echo "COLD_ADDRESS has > $CUSD_RESERVE cUSD"
    CUSD_TO_SEND=$(echo "$COLD_ADDRESS_CUSD_BALANCE_SIMPLE_NOTATION - $CUSD_RESERVE" | bc)
    echo "Sending $CUSD_TO_SEND to HOT_ADDRESS at $HOT_ADDRESS"
    $CELOCLI transfer:dollars --from $COLD_ADDRESS --to $HOT_ADDRESS --value $CUSD_TO_SEND $LEDGER_CMD
else
    echo "COLD_ADDRESS has < $CUSD_RESERVE cUSD, exiting"
    exit 0
fi
