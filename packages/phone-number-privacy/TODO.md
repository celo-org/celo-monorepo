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

- Type Handler so Response has the correct Response Type and the correct Locals Type (logger should not be an ANY)
- Type Handlers so that Request is the proper type, or better use the "isValid Request" function

- (mariano) refactor authorization function with the new account model
- (Mariano) remove catchErrorHandler2 (move it catchErrorHandler)
- (mariano) Implement chaching Account Service
- (mariano) Check Tracing Calls
