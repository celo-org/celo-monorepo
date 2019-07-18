import { messaging } from 'firebase-admin'
import { PhoneNumberUtil } from 'google-libphonenumber'
import sleep from 'sleep-promise'
import {
  alwaysUseTwilio,
  appSignature,
  getTwilioClient,
  smsAckTimeout,
  twilioPhoneNum,
} from './config'
import {
  deleteMessage,
  getActiveVerifiers,
  getMessagesForPhoneNumber,
  incrementVerifierAttemptCount,
  isMessageSent,
  saveMessage,
  setVerifierProperties,
} from './database'
import { MobileVerifier } from './types'

const SMS_LENGTH_LIMIT = 160
const NUM_VERIFIERS_TO_WAKE = 3
const MAX_VERIFIER_ATTEMPT_COUNT = 20
const phoneUtil = PhoneNumberUtil.getInstance()

export async function sendSmsCode(address: string, phoneNumber: string, message: string) {
  console.info('Attempting to send sms verification code.')

  message = getFormattedMessage(message)

  if (alwaysUseTwilio) {
    console.info('Config set to always use Twilio')
    await sendViaTwilio(phoneNumber, message)
    return 'Twilio'
  }

  const verifiers = await getRandomActiveVerifiers(NUM_VERIFIERS_TO_WAKE, phoneNumber)
  if (verifiers === null || verifiers.length === 0) {
    console.info('No suitable verifiers found. Using Twilio')
    await sendViaTwilio(phoneNumber, message)
    return 'Twilio'
  }

  const veriferIds = verifiers.map((v) => v.id).join(',')
  const messageId = await saveMessage(phoneNumber, address, message, veriferIds)
  await triggerVerifiersSendSms(verifiers, messageId)
  await sleep(smsAckTimeout)
  const messageSent = await isMessageSent(messageId)
  if (messageSent) {
    console.info('Message was sent by verifier.')
    return messageId
  } else {
    console.info('SMS timeout reached and message was not yet sent. Sending via Twilio')
    await deleteMessage(messageId)
    await sendViaTwilio(phoneNumber, message)
    return 'Twilio'
  }
}

function getFormattedMessage(message: string) {
  // Add app signature to enable SMS retriever API
  message = `<#> ${message} ${appSignature}`
  if (message.length >= SMS_LENGTH_LIMIT) {
    console.warn('SMS too long, attempting to shorten', message)
    // TODO remove when miner nodes don't include this string anymore
    message = message.replace('Celo verification code: ', '')
    console.info('New message', message)
  }
  return message
}

async function sendViaTwilio(phoneNumber: string, messageText: string) {
  try {
    console.info('Sending message via Twilio')
    await getTwilioClient().messages.create({
      body: messageText,
      from: twilioPhoneNum,
      to: phoneNumber,
    })
    console.info('Message sent via Twilio')
  } catch (e) {
    console.error('Failed to send twilio message', e)
    throw new Error('Failed to send twilio message' + e)
  }
}

async function getRandomActiveVerifiers(numToSelect: number, phoneNumber: string) {
  const verifiers = await getActiveVerifiers()
  if (!verifiers || Object.keys(verifiers).length === 0) {
    console.info('No verifiers found in database')
    return null
  }

  // Firebase DB queries only allows for a single filter so we do additional filtering here
  // Find active verifiers in the regionCode that aren't already assigned to a message
  // for that same target phone number
  const regionCode = phoneUtil.getRegionCodeForNumber(phoneUtil.parse(phoneNumber))
  console.info(`Detected region code ${regionCode} for phone ${phoneNumber}`)

  const preAssignedVerifiers = await getVerifiersAssignedToNumber(phoneNumber)

  const regionalVerifiers = Object.keys(verifiers)
    .map((id) => {
      verifiers[id].id = id // assign for convinience
      return verifiers[id]
    })
    .filter(
      (verifier) =>
        verifier.supportedRegion === regionCode &&
        !preAssignedVerifiers.has(verifier.id) &&
        verifier.phoneNum !== phoneNumber
    )
  console.info(`Found ${regionalVerifiers.length} regional active verifiers`)

  if (!regionalVerifiers || regionalVerifiers.length === 0) {
    return null
  }

  // Select some number of verifiers randomly from the those eligible
  numToSelect = Math.min(numToSelect, regionalVerifiers.length)
  const selectedVerifiers: MobileVerifier[] = []
  for (let i = 0; i < numToSelect; i++) {
    const index = Math.floor(Math.random() * regionalVerifiers.length)
    selectedVerifiers.push(regionalVerifiers[index])
    regionalVerifiers.splice(index, 1)
  }
  return selectedVerifiers
}

async function getVerifiersAssignedToNumber(phoneNumber: string) {
  const assignedVerifiers = new Set()
  const messages = await getMessagesForPhoneNumber(phoneNumber)
  if (messages) {
    // For every message, add each of it's verifier candidates
    for (const id of Object.keys(messages)) {
      const candidates = messages[id].verifierCandidates
      if (!candidates) {
        continue
      }
      candidates.split(',').map((verifierId: string) => assignedVerifiers.add(verifierId))
    }
  }
  return assignedVerifiers
}

async function triggerVerifiersSendSms(verifiers: MobileVerifier[], messageId: string) {
  await Promise.all<any>(
    verifiers.map((v) => sendVerifierPushNotification(messageId, v.fcmToken, v.id))
  )
  return Promise.all<any>(verifiers.map((v) => incrementVerifierAttemptCount(v.id)))
}

async function sendVerifierPushNotification(
  messageId: string,
  fcmToken: string,
  verifierId: string
) {
  if (!messageId) {
    console.error('No messageId provided to notifiy for')
    return
  }
  if (!fcmToken) {
    console.error('No fcm token provided for verifier')
    return
  }

  console.info(`Sending notification to fcm token ${fcmToken} for message ${messageId}`)

  // Prepare a message to be sent.
  const message: messaging.Message = {
    data: {
      messageId,
    },
    android: {
      ttl: 3600 * 1000, // 1 hour in milliseconds
      priority: 'high',
    },
    token: fcmToken,
  }

  try {
    await messaging().send(message)
  } catch (error) {
    console.warn('Failed to send notification message', error)
    if (error.message && error.message.includes('Requested entity was not found')) {
      console.warn('Disabling the verifier that could not be reached to prevent retries')
      setVerifierProperties(verifierId, { isVerifying: false })
    }
  }
}

// Disable verifiers that have too high attempt count
export async function disableInactiveVerifers() {
  console.info('Finding verifiers with attempt count past threshold')
  const verifiers = await getActiveVerifiers()
  if (!verifiers) {
    return
  }
  return Promise.all<any>(
    Object.keys(verifiers).map((id) => {
      if (verifiers[id].attemptCount >= MAX_VERIFIER_ATTEMPT_COUNT) {
        console.info('Attempt count exceeded for verifier, disabling:', id)
        return setVerifierProperties(id, { isVerifying: false })
      }
      return null
    })
  )
}
