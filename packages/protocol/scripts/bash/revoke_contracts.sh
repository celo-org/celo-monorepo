#! /usr/bin/env bash
set -euo pipefail
rejects=()

if [ "$#" -ne 1 ]; then
  echo "Expected usage: ./revoke_contracts.sh contracts.txt"
  echo "contracts.txt should include contracts you'd like to revoke and refund, one address per line"
  exit 1
fi

for contract in $(<"$1"); do
  echo "Contract $contract"

  # Check that account has been created
  accountCreated=1
  celocli lockedgold:show "$contract" > /dev/null 2>&1 || accountCreated=0
  if [ $accountCreated -ne 0 ]; then

    # Check that CELO has been unlocked
    lockedgold=$(celocli lockedgold:show "$contract")
    total=$(echo "$lockedgold" | grep -o "total: [0-9]*" | cut -f2 -d : | tr -d '[:space:]')
    if [ "$total" != "0" ]; then
      echo "Reject $contract: locked CELO > 0"
      rejects+=( $contract )
      continue
    fi

    # Check that withdrawals are available
    if [ -z $(echo "$lockedgold" | grep -o "time: [0-9]*" | cut -f2 -d :) ]; then
      echo "No pending withdrawals"
    else 
      pendingTimes=$(echo "$lockedgold" | grep -o "time: [0-9]*" | cut -f2 -d :)
      now=$(date +%s)
      while IFS= read -r line
      do 
        if [ "$line" -ge "$now" ]; then
          echo "Pending withdrawal not ready, rejecting $contract"
          rejects+=( $contract )
          continue 2
        fi
      done < <(printf '%s\n' "$pendingTimes")
    fi
  fi

  contractExists=1
  celocli releasegold:revoke --contract "$contract" --yesreally --useLedger > /dev/null || contractExists=0
  if [ "$contractExists" -eq 0 ]; then
    echo "Contract doesn't exist, rejecting $contract"
    rejects+=( $contract )
    continue
  fi
  if [ "$accountCreated" -ne 0 ]; then
    celocli releasegold:locked-gold --contract "$contract" --action withdraw --value "$total" --yes --useLedger > /dev/null
  fi
  celocli releasegold:refund-and-finalize --contract "$contract" --useLedger > /dev/null

done

echo ""
echo "-----------------------------------"
echo "-----------------------------------"
echo "-----------------------------------"
echo ""
echo "Rejects:"
for reject in ${rejects[@]}; do
  echo "$reject"
done