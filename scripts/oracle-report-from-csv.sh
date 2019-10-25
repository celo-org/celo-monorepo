#!/bin/bash

# Expects 2 arguments:
# $1 = path to the csv file
# $2 = address of the oracle to report from
#
# The purpose of this script is to report to a testnet simulated exchange rates
# between Celo Dollar (aka: StableToken) and Celo Gold.
#
# Given a csv in the expected format, it will find the most recent timestamp
# relative to the current time. Then it will pass the arguments to the celocli
# command to report the exchange rate.
#
# It expects a csv with three columns, in this order:
#   1. timestamp:   MUST be an integer representing seconds from the unix epoch
#   2. stableValue: can be integer or float
#   3. goldValue:   can be integer or float
#
# Important usage notes:
#
# - This script does nothing to parse the headers of the CSV. It uses the position
#   of values in a comma-separated line.
# - If there are more than three columns, the extra ones will be ignored

now=`date +%s`
foundCurrent=false

while IFS=',' read -r -a line && ! $foundCurrent; do
  if (( ${line[0]} > 0 )); then
    timestamp=${line[0]}
    if [[ $timestamp -gt $now ]]; then
      foundCurrent=true
    else
      stableValue=${line[1]}
      goldValue=${line[2]}
    fi
  fi
done < "$1"

if ! $foundCurrent; then
  echo 'Failed to find current timestamp. exiting'
  exit 1
fi

echo `pwd`

celocli oracle:report --token StableToken --numerator $stableValue --denominator $goldValue --from $2