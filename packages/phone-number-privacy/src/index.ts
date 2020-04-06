import { BLINDBLS } from 'bls12377js-blind'
import * as functions from 'firebase-functions'
import config, { connectToDatabase } from './config'

export const getSalt = functions.https.onRequest((request, response) => {
  const privateKey = new Buffer(config.salt.key)
  try {
    // Adding this here as an example of how to connect to the DB
    const knex = connectToDatabase()
    knex('accounts')
      .first()
      .then((val) => console.debug('account data', val))
      .catch((reason) => console.error(reason))

    const salt = BLINDBLS.computePRF(privateKey, new Buffer(request.body.blindPhoneNumber))
    response.json({ success: true, salt })
  } catch (e) {
    console.error('Failed to compute BLS salt', e)
    response.status(500).send('Failed to compute BLS salt')
  }
})
