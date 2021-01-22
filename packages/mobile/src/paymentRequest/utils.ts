import { hexToBuffer } from '@celo/utils/src/address'
import { decryptComment, encryptComment } from '@celo/utils/src/commentEncryption'
import { isE164Number } from '@celo/utils/src/phoneNumbers'
import { call } from 'redux-saga/effects'
import { MAX_COMMENT_LENGTH } from 'src/config'
import { features } from 'src/flags'
import i18n from 'src/i18n'
import { PaymentRequest } from 'src/paymentRequest/types'
import Logger from 'src/utils/Logger'
import { doFetchDataEncryptionKey } from 'src/web3/dataEncryptionKey'

const TAG = 'paymentRequest/utils'

// Encrypt sensitive data in the payment request using the recipient and sender DEK
export function* encryptPaymentRequest(paymentRequest: PaymentRequest) {
  Logger.debug(`${TAG}@encryptPaymentRequest`, 'Encrypting payment request')

  const fromKey: Buffer | null = yield call(
    doFetchDataEncryptionKey,
    paymentRequest.requesterAddress
  )
  if (!fromKey) {
    Logger.debug(`${TAG}@encryptPaymentRequest`, 'No sender key found, skipping encryption')
    return sanitizePaymentRequest(paymentRequest)
  }

  const toKey: Buffer | null = yield call(doFetchDataEncryptionKey, paymentRequest.requesteeAddress)
  if (!toKey) {
    Logger.debug(`${TAG}@encryptPaymentRequest`, 'No recipient key found, skipping encryption')
    return sanitizePaymentRequest(paymentRequest)
  }

  const encryptedPaymentRequest: PaymentRequest = {
    ...paymentRequest,
  }

  if (paymentRequest.requesterE164Number) {
    // Using the same util as for comment encryption to encrypt the phone number
    // TODO: Consider renaming this util for clarity
    const { comment: encryptedE164Number, success } = encryptComment(
      paymentRequest.requesterE164Number,
      toKey,
      fromKey
    )

    // We intentionally exclude the phone number if we can't encrypt it
    // The request still contains an address which may still map to a contact
    // If the recipient has seen it before.
    encryptedPaymentRequest.requesterE164Number = success ? encryptedE164Number : undefined
  }

  const comment = paymentRequest.comment
  if (comment && features.USE_COMMENT_ENCRYPTION) {
    const { comment: encryptedComment, success } = encryptComment(comment, toKey, fromKey)
    encryptedPaymentRequest.comment = success ? encryptedComment : comment
  }

  return encryptedPaymentRequest
}

// Decrypt sensitive data in the payment request using the user's DEK
export function decryptPaymentRequest(
  paymentRequest: PaymentRequest,
  dataEncryptionKey: string | null,
  isOutgoingRequest: boolean
) {
  Logger.debug(`${TAG}@decryptPaymentRequest`, 'Decrypting payment request')

  if (!dataEncryptionKey) {
    Logger.error(`${TAG}@decryptPaymentRequest`, 'Missing DEK, should never happen.')
    return paymentRequest
  }
  const dekBuffer = hexToBuffer(dataEncryptionKey)

  const decryptedPaymentRequest: PaymentRequest = {
    ...paymentRequest,
  }

  const requesterE164Number = paymentRequest.requesterE164Number
  if (requesterE164Number) {
    const { comment: decryptedRequesterE164Number, success } = decryptComment(
      requesterE164Number,
      dekBuffer,
      isOutgoingRequest
    )
    if (success) {
      decryptedPaymentRequest.requesterE164Number = decryptedRequesterE164Number
    } else if (isE164Number(requesterE164Number)) {
      Logger.warn(
        `${TAG}@decryptPaymentRequest`,
        'Decrypting requesterE164Number failed, using raw number'
      )
      decryptedPaymentRequest.requesterE164Number = requesterE164Number
    } else {
      Logger.warn(
        `${TAG}@decryptPaymentRequest`,
        'requesterE164Number appears to be ciphertext, excluding it'
      )
      decryptedPaymentRequest.requesterE164Number = undefined
    }
  }

  const comment = paymentRequest.comment
  if (comment && features.USE_COMMENT_ENCRYPTION) {
    const { comment: decryptedComment, success } = decryptComment(
      comment,
      dekBuffer,
      isOutgoingRequest
    )
    if (success) {
      decryptedPaymentRequest.comment = decryptedComment
    } else if (comment.length <= MAX_COMMENT_LENGTH) {
      Logger.warn(`${TAG}@decryptPaymentRequest`, 'Decrypting comment failed, using raw comment')
      decryptedPaymentRequest.comment = comment
    } else {
      Logger.warn(
        `${TAG}@decryptPaymentRequest`,
        'Comment appears to be ciphertext, hiding comment'
      )
      decryptedPaymentRequest.comment = i18n.t('global:commentUnavailable')
    }
  }

  return decryptedPaymentRequest
}

// For cases when the request can't be encrypted, remove sensitive PII
function sanitizePaymentRequest(paymentRequest: PaymentRequest): PaymentRequest {
  return {
    ...paymentRequest,
    requesterE164Number: undefined,
  }
}
