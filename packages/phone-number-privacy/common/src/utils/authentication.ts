import { ContractKit } from '@celo/contractkit'
import { AuthenticationMethod } from '@celo/contractkit/lib/identity/odis/query'
import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import { AttestationsWrapper } from '@celo/contractkit/lib/wrappers/Attestations'
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
      logger.warn({ account: signer }, 'Account does not have registered encryption key')
      return false
    } else {
      logger.info({ dek: registeredEncryptionKey, account: signer }, 'Found DEK for account')
      try {
        const key = ec.keyFromPublic(trimLeading0x(registeredEncryptionKey), 'hex')
        const parsedSig = JSON.parse(messageSignature)
        const validSignature = key.verify(message, parsedSig)
        if (validSignature) {
          return true
        }
      } catch (err) {
        logger.error('Failed to verify auth sig with DEK')
        logger.error({ err, dek: registeredEncryptionKey })
        return false
      }
    }
  }

  // Fallback to previous signing pattern
  logger.info(
    { account: signer },
    'Message was not authenticated with DEK, attempting to authenticate using wallet key'
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

export async function isVerified(
  account: string,
  hashedPhoneNumber: string,
  contractKit: ContractKit
): Promise<boolean> {
  return retryAsyncWithBackOff(
    async () => {
      const attestationsWrapper: AttestationsWrapper = await contractKit.contracts.getAttestations()
      const {
        isVerified: _isVerified,
        completed,
        numAttestationsRemaining,
        total,
      } = await attestationsWrapper.getVerifiedStatus(hashedPhoneNumber, account)

      logger.debug({
        account,
        isVerified: _isVerified,
        completedAttestations: completed,
        remainingAttestations: numAttestationsRemaining,
        totalAttestationsRequested: total,
      })
      return _isVerified
    },
    RETRY_COUNT,
    [],
    RETRY_DELAY_IN_MS
  )
}
