Structure of a request:

(request, response) => {

auth = authenticate()
if (auth.failed()) {
return 401
}

return doAction(request, response, auth)

}

TODO

- handle sendFailure (add function to response.locals)
- check if we're setting status twice for the same request (make sure we haven't responded already)
- types for Request
