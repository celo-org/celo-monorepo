import * as functions from 'firebase-functions'
import logger from './common/logger'
import { handleGetContactMatches } from './match-making/get-contact-matches'
import { handleGetBlindedMessageForSalt } from './salt-generation/get-salt'

// EG. curl -v "http://localhost:5000/celo-phone-number-privacy/us-central1/getBlindedSalt" -H "Authorization: 0xdaf63ea42a092e69b2001db3826bc81dc859bffa4d51ce8943fddc8ccfcf6b2b1f55d64e4612e7c028791528796f5a62c1d2865b184b664589696a08c83fc62a00" -d '{"hashedPhoneNumber":"0x5f6e88c3f724b3a09d3194c0514426494955eff7127c29654e48a361a19b4b96","blindedQueryPhoneNumber":"n/I9srniwEHm5o6t3y0tTUB5fn7xjxRrLP1F/i8ORCdqV++WWiaAzUo3GA2UNHiB","account":"0x588e4b68193001e4d10928660aB4165b813717C0"}' -H 'Content-Type: application/json'
export const getBlindedSalt = functions.https.onRequest(async (request, response) => {
  logger.info('Begin getBlindedSalt request')
  return handleGetBlindedMessageForSalt(request, response)
})

// EG. curl -v "http://localhost:5000/celo-phone-number-privacy/us-central1/getContactMatches" -H "Authorization: <SIGNED_BODY>" -d '{"userPhoneNumber": "+99999999999", "contactPhoneNumbers": ["+5555555555", "+3333333333"], "account": "0x117ea45d497ab022b85494ba3ab6f52969bf6812"}' -H 'Content-Type: application/json'
export const getContactMatches = functions.https.onRequest(async (request, response) => {
  logger.info('Begin getContactMatches request')
  return handleGetContactMatches(request, response)
})
