import * as functions from 'firebase-functions'

export const getSalt = functions.https.onRequest((request, response) => {
  console.log(request.body)
  response.send(request.body)
})
