import * as functions from 'firebase-functions'
import { BLINDBLS } from 'bls12377js-blind'
// import { BLS } from 'bls12377js'
import { PHONE_NUMBER_PRIVACY_SECRET_KEY } from './config'
// import bigInt = require('big-integer')

export const getSalt = functions.https.onRequest((request, response) => {
  const privateKey = new Buffer(PHONE_NUMBER_PRIVACY_SECRET_KEY) //To config
  // const one = BLS.bigToBuffer(bigInt('1'))
  // const blinded = BLINDBLS.blindMessage(new Buffer(request.body.blindPhoneNumber), one)
  const salt = BLINDBLS.computePRF(privateKey, new Buffer(request.body.blindPhoneNumber))
  console.log(salt)
  response.json({ success: true, salt: salt })
})
