import { ContractKit } from '@celo/contractkit'
import { AuthenticationMethod } from '@celo/contractkit/lib/identity/odis/query'
import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import { trimLeading0x } from '@celo/utils/lib/address'
import { retryAsyncWithBackOff } from '@celo/utils/lib/async'
import { verifySignature } from '@celo/utils/lib/signatureUtils'
import { ec as EC } from 'elliptic'
import { Request } from 'express'
import { RETRY_COUNT, RETRY_DELAY_IN_MS } from './constants'
import { logger } from './logger'

const ec = new EC('secp256k1')

/*
 * Confirms that user is who they say they are and throws error on failure to confirm.
 * Authorization header should contain the EC signed body
 */
export async function authenticateUser(
  request: Request,
  contractKit: ContractKit
): Promise<boolean> {
  logger.debug('Authenticating user')

  // https://tools.ietf.org/html/rfc7235#section-4.2
  const messageSignature = request.get('Authorization')
  const message = JSON.stringify(request.body)
  const signer = request.body.account
  const authMethod = request.body.authenticationMethod

  if (!messageSignature || !signer) {
    return false
  }

  if (authMethod && authMethod === AuthenticationMethod.ENCRYPTION_KEY) {
    const registeredEncryptionKey = await getDataEncryptionKey(signer, contractKit)
    if (!registeredEncryptionKey) {
      logger.warn(`Account ${signer} does not have registered encryption key`)
      return false
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
        return false
      }
    }
  }

  // Fallback to previous signing pattern
  logger.info(
    `Message from ${signer} was not authenticated with DEK, attempting to authenticate using wallet key`
  )
  return verifySignature(message, messageSignature, signer)
}

export async function getDataEncryptionKey(
  address: string,
  contractKit: ContractKit
): Promise<string> {
  return retryAsyncWithBackOff(
    async () => {
      const accountWrapper: AccountsWrapper = await contractKit.contracts.getAccounts()
      return accountWrapper.getDataEncryptionKey(address)
    },
    RETRY_COUNT,
    [],
    RETRY_DELAY_IN_MS
  )
}
