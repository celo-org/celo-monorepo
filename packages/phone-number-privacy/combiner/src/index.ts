import { logger } from '@celo/phone-number-privacy-common'
import * as functions from 'firebase-functions'
import { VERSION } from './config'
import { handleGetContactMatches } from './match-making/get-contact-matches'
import { handleGetBlindedMessageSig } from './signing/get-threshold-signature'

require('dotenv').config()

// DEPRECATED, TODO: Remove once clients are all on contract kit version 4.11
export const getDistributedBlindedSalt = functions
  .region('us-central1', 'europe-west3')
  .https.onRequest(async (req, res) => {
    logger.info('Begin getDistributedBlindedSalt request')
    logger.info({ req })
    await handleGetBlindedMessageSig(req, res)
    logger.info('Sent getDistributedBlindedSalt response')
    logger.info({ res })
  })

// EG. curl -v "http://localhost:5000/celo-phone-number-privacy/us-central1/getBlindedMessageSig" -H "Authorization: 0xfc2ee61c4d18b93374fdd525c9de09d01398f7d153d17340b9ae156f94a1eb3237207d9aacb42e7f2f4ee0cf2621ab6d5a0837211665a99e16e3367f5209a56b1b" -d '{"blindedQueryPhoneNumber":"+Dzuylsdcv1ZxbRcQwhQ29O0UJynTNYufjWc4jpw2Zr9FLu5gSU8bvvDJ3r/Nj+B","account":"0xdd18d08f1c2619ede729c26cc46da19af0a2aa7f", "hashedPhoneNumber":"0x8fb77f2aff2ef0343706535dc702fc99f61a5d1b8e46d7c144c80fd156826a77"}' -H 'Content-Type: application/json'
export const getBlindedMessageSig = functions
  .region('us-central1', 'europe-west3')
  .https.onRequest(async (req, res) => {
    logger.info('Received getBlindedMessageSig request')
    logger.info({ req })
    await handleGetBlindedMessageSig(req, res)
    logger.info('Sent getBlindedMessageSig response')
    logger.info({ res })
  })

// EG. curl -v "http://localhost:5000/celo-phone-number-privacy/us-central1/getContactMatches" -H "Authorization: <SIGNED_BODY>" -d '{"userPhoneNumber": "+99999999999", "contactPhoneNumbers": ["+5555555555", "+3333333333"], "account": "0x117ea45d497ab022b85494ba3ab6f52969bf6812"}' -H 'Content-Type: application/json'
export const getContactMatches = functions
  .region('us-central1', 'europe-west3')
  .https.onRequest(async (req, res) => {
    logger.info('Received getContactMatches request')
    logger.info({ req })
    await handleGetContactMatches(req, res)
    logger.info('Sent getContactMatches response')
    logger.info({ res })
  })

export const status = functions
  .region('us-central1', 'europe-west3')
  .https.onRequest(async (_request, response) => {
    response.status(200).json({
      version: VERSION,
    })
  })
