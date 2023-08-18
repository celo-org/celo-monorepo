# TODO

## Before Load Test

- Search for TODO comments and see if there's anything to fix for Load Tests
  - notes:
    - we might get errors on deployment bc we deleted migrations files
    - we still need to fix the requests table primary key
- Deploy & Make Release
- Run LoadTest

## After Load Test

- (alec) fix domains tests
- (Alec) check prometheus Counter
- Fix types in errorResult and sendFailure so we don't have to use ANY
- Refactor domain sign handler to use db transactions properly
- refactor authorization function with the new account model
- resolve FAKE_URL for request url
- Search for TODO comments for things to fix after load test
- (nice to have) Refactor Combiner to be similar than signer (kill IO, Controller, Action)
- Make caching config parameters configurable by environment

## Done

✔️ extract resultHandler() out of each handler, into the createHandler on server.ts
✔️ correct Locals Type (logger should not be an ANY)
✔️ (mariano) Implement chaching Account Service
✔️ (mariano) Check Tracing Calls
✔️ trace signature timeg
✔️ (Mariano) remove catchErrorHandler2 (move it catchErrorHandler)
✔️ Type Handler so Response has the correct Response Type
✔️ Type Handlers so that Request is the proper type, or better use the "isValid Request" function