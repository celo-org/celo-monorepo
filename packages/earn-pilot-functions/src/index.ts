import * as functions from 'firebase-functions'
import { transferDollars } from './sendTokens'
const crypto = require('crypto')

const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)

const REQUESTS_DB_NAME = 'celo-org-mobile-earn-pilot'
const REQUESTS_DB_URL = 'https://celo-org-mobile-earn-pilot.firebaseio.com'
const PILOT_PARTICIPANTS_DB_URL = 'https://celo-org-mobile-pilot.firebaseio.com'

const FIGURE_EIGHT_KEY = functions.config().envs
  ? functions.config().envs.secret_key
  : 'placeholder_for_local_dev'

exports.handleFigureEightConfirmation = functions.database
  .instance(REQUESTS_DB_NAME)
  .ref('confirmations/{uid}')
  .onWrite((change) => {
    const message = change.after.val()

    // Whenever a confirmation is written
    const { confirmed, userId, adjAmount, jobTitle, conversionId } = message
    const signature = message.signature
    console.info(`Confirmed: ${confirmed}`)
    if (typeof message.updated !== 'undefined') {
      // Already updated
      console.info('Already processed request, returning')
      return null
    }

    if (!confirmed) {
      // No response needed until request is confirmed
      console.info('Unconfirmed request, no update needed')
      return null
    }

    if (!validSignature(signature, JSON.stringify(message.payload))) {
      console.error('Invalid sig')
      return change.after.ref.update({
        valid: false,
      })
    }

    const uid = sanitizeId(userId)

    console.info(`Updating confirmed payment to userId ${uid}`)
    const participantsDb = admin
      .app()
      .database(PILOT_PARTICIPANTS_DB_URL)
      .ref('earnPilot/participants')
    const msgRoot = participantsDb.child(uid)
    msgRoot.child('earned').transaction((earned: number) => {
      return (earned || 0) + adjAmount
    })
    console.info(`Incremented balance by ${adjAmount}`)
    msgRoot.child(`conversions/${conversionId}`).set({ jobTitle, adjAmount })
    console.info(`Added conversion record (id: ${conversionId}) for job ${jobTitle}`)
    return change.after.ref.update({
      valid: true,
      updated: true,
    })
  })

exports.transferEarnedBalance = functions.database
  .instance(REQUESTS_DB_NAME)
  .ref('requests/{uid}')
  .onWrite(async (change) => {
    const message = change.after.val()

    const { timestamp, userId, amountEarned, account, processed, txId } = message

    if (processed) {
      console.info(`Already handled request for ${userId}, returning`)
      return
    }
    console.info(`Cashing out user ${userId}. Request time: ${timestamp}`)
    const transferSuccess = await transferDollars(amountEarned, account)

    if (!transferSuccess) {
      console.error(`Unable to fulfill request ${txId}, returning unprocessed`)
      return
    }

    const participantsDb = admin
      .app()
      .database(PILOT_PARTICIPANTS_DB_URL)
      .ref('earnPilot/participants')
    const msgRoot = participantsDb.child(userId)
    msgRoot.child('earned').set(0)
    msgRoot.child('cashedOut').transaction((cashedOut: number) => {
      return (cashedOut || 0) + amountEarned
    })
    msgRoot.child('cashOutTxs').push({ txId, timestamp, userId, amountEarned })

    // TODO confirm userId and address and amount match in database

    return change.after.ref.update({
      processed: true,
    })
  })

const validSignature = (signature: string, params: string) => {
  if (!FIGURE_EIGHT_KEY) {
    console.log('Could not load figure eight key')
  }
  const digest = crypto
    .createHash('sha1')
    .update(JSON.stringify(params) + FIGURE_EIGHT_KEY)
    .digest('hex')
  console.log(`Digest ${digest} should equal signature ${signature}`)
  // return digest === signature // TODO enable security
  return true
}

const sanitizeId = (uid: string) => {
  return uid.toLowerCase()
}

enum PostType {
  INITIAL = 'INITIAL',
  CONFIRM = 'CONFIRM',
}

export const handlePost = functions.https.onRequest((request, response) => {
  const data = request.body
  const signature = data.signature

  if (!validSignature(signature, JSON.stringify(request.body.payload))) {
    console.info(`Received request ${JSON.stringify(data)} with invalid signature ${signature}`)
    response.status(401).send(`Unauthorized. Invalid signature: ${signature}`)
    return
  }

  const postType =
    data && typeof data.payload.conversion_id !== 'undefined' ? PostType.CONFIRM : PostType.INITIAL

  const requestsDb = admin
    .app()
    .database(REQUESTS_DB_URL)
    .ref('confirmations')

  if (postType === PostType.INITIAL) {
    const { amount, adjusted_amount, uid } = data.payload
    console.info(`Initial request for payment of ${adjusted_amount} to user ${uid}`)
    const userId = sanitizeId(uid)
    const conversionId = requestsDb.push({
      userId,
      confirmed: false,
      adjAmount: adjusted_amount,
      amount,
    }).key
    console.info(`Assigned conversion ID ${conversionId} to unconfirmed request`)
    response.status(200).send(`${JSON.stringify({ conversion_id: conversionId })}`)
    return
  } else if (postType === PostType.CONFIRM) {
    const { job_title, conversion_id } = data.payload
    if (!conversion_id || !job_title) {
      response
        .status(400)
        .send(
          `Missing conversion_id or job_title in received payload: ${JSON.stringify(data.payload)}`
        )
      return
    }
    console.info(`Confirmation request for ${conversion_id}`)
    requestsDb
      .child(conversion_id)
      .update({ jobTitle: job_title, confirmed: true, conversionId: conversion_id }) // Duplicate storage of conversionId for convenient handleFigureEightConfirmation access
    console.info(`Request ${conversion_id} confirmed`)
    response.status(200).send('OK')
    return
  } else {
    console.log('Unkown post type')
    response.status(400).send('Unkown post type')
    return
  }
})
