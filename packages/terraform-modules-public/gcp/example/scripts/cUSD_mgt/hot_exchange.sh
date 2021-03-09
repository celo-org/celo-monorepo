#!/bin/bash
set -x

HOT_ADDRESS=FIXME
#TARGET_CELO=25e18
CELOCLI='/Users/dc/.nvm/versions/node/v10.22.0/bin/celocli'
MAXSLEEP=900
EXCHANGERATE=6e18
VALUE=25e18


while :
do
    echo "Checking cUSD balance of HOT_ADDRESS"
    HOT_ADDRESS_USD_BALANCE=$($CELOCLI account:balance $HOT_ADDRESS | grep "cUSD" | cut -d " " -f 2)
    echo "HOT_ADDRESS USD Balance: $HOT_ADDRESS_USD_BALANCE"
    HOT_ADDRESS_USD_BALANCE_SIMPLE_NOTATION=$(echo $HOT_ADDRESS_USD_BALANCE | sed -E 's/([+-]?[0-9.]+)[eE]\+?(-?)([0-9]+)/(\1*10^\2\3)/g')
    echo "HOT_ADDRESS USD Balance (simple): $HOT_ADDRESS_USD_BALANCE_SIMPLE_NOTATION"
    if (( $(echo "$HOT_ADDRESS_USD_BALANCE_SIMPLE_NOTATION > 0" |bc -l) ));
    then
        echo "Exchanging cUSD for CELO"
        $CELOCLI exchange:dollars --value $VALUE --from $HOT_ADDRESS --forAtLeast $EXCHANGERATE
        if [ $? -eq 1 ]
        then
          echo "Exchange failed, please check exchange rate."
          exit 1
        fi
        sleep $((1 + RANDOM % $MAXSLEEP))
    else
        echo "No cUSD balance on hot account, exiting"
        exit 0
    fi
done
