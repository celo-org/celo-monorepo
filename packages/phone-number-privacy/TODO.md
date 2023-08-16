Structure of a request:

(request, response) => {

auth = authenticate()
if (auth.failed()) {
return 401
}

return doAction(request, response, auth)

}

TODO

- (Alec) refactor domain endpoints to get rid of IO
  - if endpoint disabled, can be replaced by failing handler at server.ts
- (Alec) remove catchErrorHandler2 (move it catchErrorHandler)
- (Alec) add back quotaBypassForE2e
- (Alec) remove block number
- (alec) Remove sendFailure is missing a Counter

- (Alec) check prometheus Counter

- Maked send() types so that it matches responde body type
- types for Request
