import { retryAsyncWithBackOffAndTimeout } from '@celo/base'
import { ContractKit } from '@celo/contractkit'
import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import { AttestationsWrapper } from '@celo/contractkit/lib/wrappers/Attestations'
import { AuthenticationMethod } from '@celo/identity/lib/odis/query'
import { trimLeading0x } from '@celo/utils/lib/address'
import { verifySignature } from '@celo/utils/lib/signatureUtils'
import Logger from 'bunyan'
import { ec as EC } from 'elliptic'
import { Request } from 'express'
import { ErrorMessage } from '../interfaces'
import { FULL_NODE_TIMEOUT_IN_MS, RETRY_COUNT, RETRY_DELAY_IN_MS } from './constants'

const ec = new EC('secp256k1')

/*
 * Confirms that user is who they say they are and throws error on failure to confirm.
 * Authorization header should contain the EC signed body
 */
export async function authenticateUser(
  request: Request,
  contractKit: ContractKit,
  logger: Logger
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
    let registeredEncryptionKey
    try {
      registeredEncryptionKey = await getDataEncryptionKey(signer, contractKit, logger)
    } catch (error) {
      logger.warn('Assuming request is authenticated')
      return true
    }
    if (!registeredEncryptionKey) {
      logger.warn({ account: signer }, 'Account does not have registered encryption key')
      return false
    } else {
      logger.info({ dek: registeredEncryptionKey, account: signer }, 'Found DEK for account')
      if (verifyDEKSignature(message, messageSignature, registeredEncryptionKey, logger)) {
        return true
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

export function verifyDEKSignature(
  message: string,
  messageSignature: string,
  registeredEncryptionKey: string,
  logger?: Logger
) {
  try {
    const key = ec.keyFromPublic(trimLeading0x(registeredEncryptionKey), 'hex')
    const parsedSig = JSON.parse(messageSignature)
    return key.verify(message, parsedSig)
  } catch (err) {
    if (logger) {
      logger.error('Failed to verify signature with DEK')
      logger.error({ err, dek: registeredEncryptionKey })
    }
    return false
  }
}

export async function getDataEncryptionKey(
  address: string,
  contractKit: ContractKit,
  logger: Logger
): Promise<string> {
  return retryAsyncWithBackOffAndTimeout(
    async () => {
      const accountWrapper: AccountsWrapper = await contractKit.contracts.getAccounts()
      return accountWrapper.getDataEncryptionKey(address)
    },
    RETRY_COUNT,
    [],
    RETRY_DELAY_IN_MS,
    1.5,
    FULL_NODE_TIMEOUT_IN_MS
  ).catch((error) => {
    logger.error('Failed to retrieve DEK: ' + error.message)
    logger.error(ErrorMessage.CONTRACT_GET_FAILURE)
    throw error
  })
}

export async function isVerified(
  account: string,
  hashedPhoneNumber: string,
  contractKit: ContractKit,
  logger: Logger
): Promise<boolean> {
  try {
    return retryAsyncWithBackOffAndTimeout(
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
      RETRY_DELAY_IN_MS,
      1.5,
      FULL_NODE_TIMEOUT_IN_MS
    )
  } catch (error: any) {
    logger.error('Failed to get verification status: ' + error.message)
    logger.warn('Assuming user is verified')
    return true
  }
}
