import * as functions from 'firebase-functions'
import logger from './common/logger'
import { handleGetContactMatches } from './match-making/get-contact-matches'
import { handleGetBlindedMessageForSalt } from './salt-generation/get-salt'

// EG. curl -v "http://localhost:5000/celo-phone-number-privacy/us-central1/getBlindedSalt" -d '{"blindedQueryPhoneNumber": "xfVo/qxqTXWE8AXzev8KcqJ2CG8sMqNQfn/0X2ch7dKGJyBGG8YjhFyNSmX1e1cB9n4ARdq6kYr0vZTAebx1Nudl3zR9ij0aIJY5wzhsR89uLPj/31H0Ks4FMf42oD4A/5ny0+AA1As0oUFvTpVr99Uk4+GxbRjX/iHgTa2qkM15ih/3Qot/tw/vt9LmDZAByogwM3EAHZFC+BLyYfgt8Tws/2jwiie61wET0Ms/JLOVZjiTZafwJJ74Wqlk/IgAAA==", "account":"0x117ea45d497ab022b85494ba3ab6f52969bf6813", "hashedPhoneNumber":"+15555555555"}' -H 'Content-Type: application/json'
export const getBlindedSalt = functions.https.onRequest(async (request, response) => {
  logger.info('Begin getBlindedSalt request')
  return handleGetBlindedMessageForSalt(request, response)
})

// EG. curl -v "http://localhost:5000/celo-phone-number-privacy/us-central1/getContactMatches" -d '{"userPhoneNumber": "+99999999999", "contactPhoneNumbers": ["+5555555555", "+3333333333"], "account": "0x117ea45d497ab022b85494ba3ab6f52969bf6812"}' -H 'Content-Type: application/json'
export const getContactMatches = functions.https.onRequest(async (request, response) => {
  logger.info('Begin getContactMatches request')
  return handleGetContactMatches(request, response)
})
