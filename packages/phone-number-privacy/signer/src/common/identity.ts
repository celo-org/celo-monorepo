import { logger } from '@celo/phone-number-privacy-common'
import { trimLeading0x } from '@celo/utils/lib/address'
import { verifySignature } from '@celo/utils/lib/signatureUtils'
import { ec as EC } from 'elliptic'
import { Request } from 'express'
import { getDataEncryptionKey } from '../web3/contracts'

const ec = new EC('secp256k1')

/*
 * Confirms that user is who they say they are and throws error on failure to confirm.
 * Authorization header should contain the EC signed body
 */
export async function authenticateUser(request: Request): Promise<boolean> {
  logger.debug('Authenticating user')

  // https://tools.ietf.org/html/rfc7235#section-4.2
  const messageSignature = request.get('Authorization')
  const message = JSON.stringify(request.body)
  const signer = request.body.account
  if (!messageSignature || !signer) {
    return false
  }

  const registeredEncryptionKey = await getDataEncryptionKey(signer)
  if (!registeredEncryptionKey) {
    logger.info(`Account ${signer} does not have registered encryption key`)
  } else {
    logger.info(`Found DEK ${registeredEncryptionKey} for ${signer}`)
    try {
      const key = ec.keyFromPublic(trimLeading0x(registeredEncryptionKey), 'hex')
      const parsedSig = JSON.parse(messageSignature)
      const validSignature = key.verify(message, parsedSig)
      if (validSignature) {
        return true
      }
    } catch (error) {
      logger.error(`Failed to verify auth sig ${error}`)
    }
  }

  // Fallback to previous signing pattern
  logger.info(
    `Message from ${signer} was not authenticated with DEK, attempting to authenticate using wallet key`
  )
  return verifySignature(message, messageSignature, signer)
}
