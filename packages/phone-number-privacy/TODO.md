Structure of a request:

(request, response) => {

auth = authenticate()
if (auth.failed()) {
return 401
}

return doAction(request, response, auth)

}

TODO

- (alec) Refactor domain sign handler to use db transactions properly
- (Alec) check prometheus Counter

- Type Handler so Response has the correct Response Type
- Fix types in errorResult and sendFailure so we don't have to use ANY

- (mariano) refactor authorization function with the new account model
- (Mariano) remove catchErrorHandler2 (move it catchErrorHandler)
- (mariano) Implement chaching Account Service
- (mariano) Check Tracing Calls
