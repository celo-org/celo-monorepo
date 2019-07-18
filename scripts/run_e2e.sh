yarn
cd packages/mobile/
yarn test:build-e2e

yarn test:run-e2e 2>&1 | tee e2e_run.log
