import { database } from 'firebase-admin'
import { CELO_ENV } from './celoEnv'
import {
  MessageState,
  MobileVerifier,
  MobileVerifiersMap,
  SMSMessage,
  SMSMessagesMap,
} from './types'

export async function getVerifier(id: string): Promise<MobileVerifier | null> {
  console.info('Getting verifier from db')
  if (!id) {
    console.error('Invalid verifier id', id)
    return null
  }

  return (await database()
    .ref(`/${CELO_ENV}/mobileVerifiers/${id}`)
    .once('value')).val()
}

export async function getActiveVerifiers(): Promise<MobileVerifiersMap> {
  console.info('Getting all active verifiers from db')
  return (await database()
    .ref(`/${CELO_ENV}/mobileVerifiers`)
    .orderByChild('isVerifying')
    .equalTo(true)
    .once('value')).val()
}

export function incrementVerifierAttemptCount(id?: string) {
  console.info('Incrementing attempt count for verifier', id)
  if (!id) {
    console.error('Invalid verifier id', id)
    return
  }

  return database()
    .ref(`/${CELO_ENV}/mobileVerifiers/${id}/attemptCount`)
    .transaction((currentCount: number) => {
      return (currentCount || 0) + 1
    })
}

export function setVerifierProperties(id: string, props: { [key: string]: any }) {
  console.info('Updating properties in db for verifier:', id)
  if (!id) {
    console.error('Invalid verifier id')
    return
  }
  if (!props) {
    console.error('Invalid verifier updates')
    return
  }

  return database()
    .ref(`/${CELO_ENV}/mobileVerifiers/${id}`)
    .update(props)
}

export async function saveMessage(
  phoneNumber: string,
  address: string,
  smsText: string,
  verifierCandidates: string
): Promise<string> {
  const message: SMSMessage = {
    phoneNum: phoneNumber,
    message: smsText,
    verifierId: null,
    verifierCandidates,
    address,
    startTime: Date.now(),
    finishTime: null,
    messageState: MessageState.DISPATCHING,
  }
  console.info('Saving new message to db')
  const result = await database()
    .ref(`/${CELO_ENV}/messages`)
    .push(message)
  if (result.key) {
    return result.key
  } else {
    throw new Error('Unable to save message')
  }
}

export function deleteMessage(id: string) {
  console.info('Deleting message from db', id)
  if (!id) {
    console.error('Invalid message id', id)
    return
  }

  return database()
    .ref(`/${CELO_ENV}/messages/${id}`)
    .remove()
}

export async function isMessageSent(id: string) {
  console.info('Checking if message is sent', id)
  if (!id) {
    console.error('Invalid message id', id)
    return false
  }

  const message = await database()
    .ref(`/${CELO_ENV}/messages/${id}`)
    .once('value')

  if (!message || !message.val()) {
    console.warn('Message is null, returning isSent false.')
    return false
  }

  return message.val().messageState >= MessageState.SENT
}

export async function getMessagesForPhoneNumber(
  phoneNumber: string
): Promise<SMSMessagesMap | null> {
  console.info('Getting messages for phone number from db')
  if (!phoneNumber) {
    console.error('Invalid message phone number', phoneNumber)
    return null
  }

  return (await database()
    .ref(`/${CELO_ENV}/messages`)
    .orderByChild('phoneNum')
    .equalTo(phoneNumber)
    .once('value')).val()
}

export async function getMessagesForState(messageState: MessageState): Promise<SMSMessagesMap> {
  console.info('Getting messages from db of state:', messageState)
  return (await database()
    .ref(`/${CELO_ENV}/messages`)
    .orderByChild('messageState')
    .equalTo(messageState)
    .once('value')).val()
}

export function setMessageState(id: string, messageState: MessageState) {
  console.info(`Updating state for message ${id} to ${messageState} in db`)
  if (!id) {
    console.error('Invalid message id', id)
    return
  }

  return database()
    .ref(`/${CELO_ENV}/messages/${id}`)
    .update({ messageState })
}

export async function tryAcquireRewardsLock(): Promise<boolean> {
  console.info('Trying to acquire rewards lock')
  try {
    const result = await database()
      .ref(`/${CELO_ENV}/rewards/isRewarding`)
      .transaction((isRewarding: boolean) => {
        if (isRewarding) {
          // abort tx
          return
        }
        return true
      })
    return result.committed
  } catch (error) {
    console.error('Error trying to acquire lock', error)
    // Due to a known issue with FB DB transactions, it can sometimes happen that the tx
    // above claims to fail but the lock was actually set. We release the lock here
    // to cover that case.
    // https://groups.google.com/forum/#!topic/firebase-talk/OZTz5xqAQYE
    await releaseRewardsLock()
    return false
  }
}

export async function releaseRewardsLock() {
  console.info('Releasing rewards lock')
  await database()
    .ref(`/${CELO_ENV}/rewards/isRewarding`)
    .set(false)
  console.info('Done releasing lock')
}
