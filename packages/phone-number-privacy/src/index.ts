import { BLINDBLS } from 'bls12377js-blind'
import * as functions from 'firebase-functions'
import { PHONE_NUMBER_PRIVACY_SECRET_KEY } from './config'

export const getSalt = functions.https.onRequest((request, response) => {
  const privateKey = new Buffer(PHONE_NUMBER_PRIVACY_SECRET_KEY)
  const salt = BLINDBLS.computePRF(privateKey, new Buffer(request.body.blindPhoneNumber))
  response.json({ success: true, salt })
})
