#!/bin/bash
set -x

COLD_ADDRESS=FIXME                        # --ledgerCustomAddresses=[5]
CELO_RESERVE=1*10^18
GROUP=FIXME
LEDGER_CMD='--useLedger --ledgerCustomAddresses=[5]'

echo "Checking CELO balance of COLD_ADDRESS"
COLD_ADDRESS_CELO_BALANCE=$(npx celocli account:balance $COLD_ADDRESS | grep "CELO" | grep -v 'lockedCELO' | cut -d " " -f 2)
echo "COLD_ADDRESS CELO Balance: $COLD_ADDRESS_CELO_BALANCE"
COLD_ADDRESS_CELO_BALANCE_SIMPLE_NOTATION=$(echo $COLD_ADDRESS_CELO_BALANCE | sed -E 's/([+-]?[0-9.]+)[eE]\+?(-?)([0-9]+)/(\1*10^\2\3)/g')
echo "COLD_ADDRESS CELO Balance (simple): $COLD_ADDRESS_CELO_BALANCE_SIMPLE_NOTATION"
if (( $(echo "$COLD_ADDRESS_CELO_BALANCE_SIMPLE_NOTATION > $CELO_RESERVE" |bc -l) ));
    then
        echo "COLD_ADDRESS has > $CELO_RESERVE CELO, let's lock it and vote it"
        CELO_TO_LOCK=$(echo "$COLD_ADDRESS_CELO_BALANCE_SIMPLE_NOTATION - $CELO_RESERVE" | bc)
        echo "Locking $CELO_TO_LOCK on COLD_ADDRESS at $COLD_ADDRESS"
        npx celocli lockedgold:lock --from $COLD_ADDRESS --value $CELO_TO_LOCK $LEDGER_CMD
        if [[ $? -eq 1 ]];
        then
            echo "Locked gold operation failed, exiting"
            exit 1
        else
            # note this will fail on subsequent runs of lock+vote due to celocli not exposing the locked non-voting balance.
            # use explorer to calculate and vote this manually for now [FIXME]
            echo "Checking locked CELO balance of COLD_ADDRESS"
            COLD_ADDRESS_LOCKED_CELO_BALANCE=$(npx celocli account:balance $COLD_ADDRESS | grep "lockedCELO" | cut -d " " -f 2)
            echo "COLD_ADDRESS Locked CELO Balance: $COLD_ADDRESS_LOCKED_CELO_BALANCE"
            echo "Voting $COLD_ADDRESS_LOCKED_CELO_BALANCE for group $GROUP"
            npx celocli election:vote --for $GROUP --from $COLD_ADDRESS --value $COLD_ADDRESS_LOCKED_CELO_BALANCE $LEDGER_CMD
            echo "do not forget to activate these votes after the start of the next epoch"
            echo "use the following command to activate your votes"
            echo "npx celocli election:activate --from $COLD_ADDRESS $LEDGER_CMD"
        fi
else
    echo "COLD_ADDRESS has < $CELO_RESERVE CELO, exiting"
    exit 0
fi


