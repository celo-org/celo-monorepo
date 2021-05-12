#!/bin/bash

# workaround for missing feature
# https://github.com/yarnpkg/yarn/issues/6669

set -u
i="0"
result=1
response=""
# result=1 and response="" it means that the request failed with an 503
# as that request depends only on npm, and is EXTREMELY flaky, we try
# to run it at least 10 times until get an answer
while [ $i -lt 10 ] && [ $result -eq 1 ] && [ -z "$response" ]; do
  echo "Attempt $[$i+1]"
  set +e
  response=$(yarn audit --json --groups dependencies --level high)
  result=$?
  set -e
  i=$[$i+1]
  echo $response
done

if [ $result -eq 1 ] && [ -z "$response" ]; then
  echo
  echo The request failed at least 10 times
  echo Check the yarn audit command
  exit 1
fi

output="$(echo "$response" | { grep auditAdvisory || :; })"
if [ -z "$output" ]; then
  echo
	echo No high or critical vulnerabilities found
	exit 0
fi

if [ -f yarn-audit-known-issues ] && echo "$output" | diff -q yarn-audit-known-issues - > /dev/null 2>&1; then
	echo
	echo Ignorning known vulnerabilities
	exit 0
fi

echo
echo Security vulnerabilities were found that were not ignored
echo
echo Check to see if these vulnerabilities apply to production
echo and/or if they have fixes available. If they do not have
echo fixes and they do not apply to production, you may ignore them
echo
echo To ignore these vulnerabilities, run:
echo
echo "yarn audit --json --groups dependencies --level high | grep auditAdvisory > yarn-audit-known-issues"
echo
echo and commit the yarn-audit-known-issues file
echo
outputAsArray="[$(echo $output | sed 's/} {/},{/g')]"
echo "$outputAsArray" | python -mjson.tool

exit "$result"