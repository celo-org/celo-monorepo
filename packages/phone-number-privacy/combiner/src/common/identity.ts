import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import { AttestationsWrapper } from '@celo/contractkit/lib/wrappers/Attestations'
import { verifySignature } from '@celo/utils/lib/signatureUtils'
import { Request } from 'firebase-functions'
import { getContractKit } from '../web3/contracts'
import logger from './logger'

/*
 * Confirms that user is who they say they are and throws error on failure to confirm.
 * Authorization header should contain the EC signed body
 * TODO: move this to common lib
 */
export async function authenticateUser(request: Request): Promise<boolean> {
  logger.debug('Authenticating user')

  // https://tools.ietf.org/html/rfc7235#section-4.2
  const messageSignature = request.get('Authorization')
  const message = JSON.stringify(request.body)
  if (!messageSignature || !message) {
    return false
  }
  const signer = request.body.account
  if (!messageSignature || !signer) {
    return false
  }

  const registeredEncryptionKey = await getDataEncryptionKey(signer)
  if (!registeredEncryptionKey) {
    logger.info(`Account ${signer} does not have registered encryption key`)
  } else {
    const validSignature: boolean = verifySignature(
      message,
      messageSignature,
      registeredEncryptionKey
    )
    if (validSignature) {
      return true
    }
  }

  // Fallback to previous signing pattern
  logger.info(
    `Message from ${signer} was not authenticated with DEK, attempting to authenticate using wallet key`
  )
  return verifySignature(message, messageSignature, signer)
  //
  // const key = ec.keyFromPublic(registeredEncryptionKey)
  // if (!key.verify(message, messageSignature)) {
}

// TODO: move this to common lib
async function getDataEncryptionKey(address: string): Promise<string> {
  const accountWrapper: AccountsWrapper = await getContractKit().contracts.getAccounts()
  return accountWrapper.getDataEncryptionKey(address)
}

export async function isVerified(account: string, hashedPhoneNumber: string): Promise<boolean> {
  // TODO (amyslawson) wrap forno request in retry
  const attestationsWrapper: AttestationsWrapper = await getContractKit().contracts.getAttestations()
  const {
    isVerified: _isVerified,
    completed,
    numAttestationsRemaining,
    total,
  } = await attestationsWrapper.getVerifiedStatus(hashedPhoneNumber, account)

  logger.debug(
    `Account ${account} is verified=${_isVerified} with ${completed} completed attestations, ${numAttestationsRemaining} remaining, total of ${total} requested.`
  )
  return _isVerified
}
