import * as functions from 'firebase-functions'
import logger from './common/logger'
import { VERSION } from './config'
import { handleGetContactMatches } from './match-making/get-contact-matches'
import { handleGetDistributedBlindedMessageForSalt } from './salt-generation/get-threshold-salt'

// TODO fix example
// EG. curl -v "http://localhost:5000/celo-phone-number-privacy/us-central1/getDistributedBlindedSalt" -H "Authorization: 0xfc2ee61c4d18b93374fdd525c9de09d01398f7d153d17340b9ae156f94a1eb3237207d9aacb42e7f2f4ee0cf2621ab6d5a0837211665a99e16e3367f5209a56b1b" -d '{"blindedQueryPhoneNumber":"+Dzuylsdcv1ZxbRcQwhQ29O0UJynTNYufjWc4jpw2Zr9FLu5gSU8bvvDJ3r/Nj+B","account":"0xdd18d08f1c2619ede729c26cc46da19af0a2aa7f", "hashedPhoneNumber":"0x8fb77f2aff2ef0343706535dc702fc99f61a5d1b8e46d7c144c80fd156826a77"}' -H 'Content-Type: application/json'
export const getDistributedBlindedSalt = functions
  .region('us-central1', 'europe-west3')
  .https.onRequest(async (request, response) => {
    logger.info('Begin getDistributedBlindedSalt request')
    return handleGetDistributedBlindedMessageForSalt(request, response)
  })

// EG. curl -v "http://localhost:5000/celo-phone-number-privacy/us-central1/getContactMatches" -H "Authorization: <SIGNED_BODY>" -d '{"userPhoneNumber": "+99999999999", "contactPhoneNumbers": ["+5555555555", "+3333333333"], "account": "0x117ea45d497ab022b85494ba3ab6f52969bf6812"}' -H 'Content-Type: application/json'
export const getContactMatches = functions
  .region('us-central1', 'europe-west3')
  .https.onRequest(async (request, response) => {
    logger.info('Begin getContactMatches request')
    return handleGetContactMatches(request, response)
  })

export const status = functions
  .region('us-central1', 'europe-west3')
  .https.onRequest(async (_request, response) => {
    response.status(200).json({
      version: VERSION,
    })
  })
