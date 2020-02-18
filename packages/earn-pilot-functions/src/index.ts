import * as functions from 'firebase-functions'
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)

const EARN_PILOT_DB_NAME = 'celo-org-mobile-earn-pilot'
const PILOT_PARTICIPANTS_DB_URL = 'https://celo-org-mobile-pilot.firebaseio.com'

// Moderates messages by lowering all uppercase messages and removing swearwords.
exports.handleFigureEightRequest = functions.database
  .instance(EARN_PILOT_DB_NAME)
  .ref('/requests/{uid}')
  .onWrite((change) => {
    console.log('Function called')
    const message = change.after.val()

    // TODO figure out mapping uid with conversion_id
    if (!message.conversion_id) {
      // If no conversion_id, then just a POST
      return change.after.ref.update({
        updated: false,
      })
    }

    const { adjusted_amount, uid } = message.payload // Can also access raw `amount`
    const signature = message.signature

    if (!validSignature(signature)) {
      console.log('Invalid sig')
      return change.after.ref.update({
        valid: false,
      })
    }

    const participantsDb = admin
      .app()
      .database(PILOT_PARTICIPANTS_DB_URL)
      .ref('/earnPilot/participants')
    const userId = sanitizeId(uid)
    const msgRoot = participantsDb.child(userId)
    msgRoot.push({ earned: adjusted_amount })
    return change.after.ref.update({
      valid: true,
      updated: true,
    })
  })

const validSignature = (signature: string) => {
  // TODO check sha validity
  console.log(signature)
  return true
}

const sanitizeId = (uid: string) => {
  // TODO may need to make lowercase
  return uid
}
