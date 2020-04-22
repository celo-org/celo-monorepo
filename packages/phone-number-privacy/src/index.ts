import * as functions from 'firebase-functions'
import { handleGetContactMatches } from './match-making/get-contact-matches'
import { handleGetSignature } from './salt-generation/get-salt'

export const getBlindedMessageSignature = functions.https.onRequest(async (request, response) => {
  return handleGetSignature(request, response)
})

// TODO (amyslawson) consider pagination or streaming of contacts?
export const getContactMatches = functions.https.onRequest(async (request, response) => {
  return handleGetContactMatches(request, response)
})
