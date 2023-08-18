TODO

- (alec) Refactor domain sign handler to use db transactions properly
- (Alec) check prometheus Counter

- Type Handler so Response has the correct Response Type
- Fix types in errorResult and sendFailure so we don't have to use ANY

- (mariano) refactor authorization function with the new account model
- (Mariano) remove catchErrorHandler2 (move it catchErrorHandler)
- (mariano) Implement chaching Account Service
- (mariano) Check Tracing Calls

---

- (alec) fix domains tests
- extract resultHandler() out of each handler, into the createHandler on server.ts
- Type Handler so Response has the correct Response Type and the correct Locals Type (logger should not be an ANY)
- Type Handlers so that Request is the proper type, or better use the "isValid Request" function
- Refactor domain sign handler to use db transactions properly

- refactor authorization function with the new account model
- (Alec) check prometheus Counter [chat about this]

✔️ (mariano) Implement chaching Account Service
✔️ (mariano) Check Tracing Calls
✔️ trace signature timeg

✔️ (Mariano) remove catchErrorHandler2 (move it catchErrorHandler)

- (Mariano) resolve FAKE_URL
- Search for TODO comments
