#!/usr/bin/env bash
export ANDROID_HOME=/usr/local/share/android-sdk
export PATH=$PATH:/usr/local/bin:/usr/sbin:/sbin:~/.nvm/versions/node/v8.12.0/bin
#Example crontab:
#*/10 * * * * cd ~/celo-monorepo/packages/mobile && scripts/ci-e2e.sh >/dev/null 2>&1

git pull
mkdir -p e2e/tmp
rm -r e2e/tmp/*

( cd ../../ && yarn )
( cd android && ./gradlew clean )
yarn test:build-e2e && echo "Build successfull" >> e2e/tmp/last_run_log || yarn test:build-e2e
yarn test:run-e2e || rm -r e2e/tmp/* && test:yarn run-e2e >> e2e/tmp/last_run_log 2>&1
passed=$?

if [ $passed -eq 0 ] 
then
  gsutil -h "Cache-Control:private,max-age=0, no-transform" cp e2e/e2e-passing-green.svg gs://celo-e2e-data/e2e-banner.svg
  gsutil acl ch -u AllUsers:R gs://celo-e2e-data/e2e-banner.svg
  echo "Tests passing" >>  e2e/tmp/last_run_log
else
  gsutil -h "Cache-Control:private,max-age=0, no-transform" cp e2e/e2e-failing-red.svg gs://celo-e2e-data/e2e-banner.svg  
  gsutil acl ch -u AllUsers:R gs://celo-e2e-data/e2e-banner.svg
  echo "Tests failling" >>  e2e/tmp/last_run_log
fi

tar -czvf e2e/tmp/detailed_logs.tar.gz e2e/tmp
gsutil cp e2e/tmp/detailed_logs.tar.gz gs://celo-e2e-data/detailed_logs.tar.gz
gsutil cp e2e/tmp/last_run_log gs://celo-e2e-data/last_run_log

exit $passed
