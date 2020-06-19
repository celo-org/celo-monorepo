import { AttestationsWrapper } from '@celo/contractkit/lib/wrappers/Attestations'
import { verifySignature } from '@celo/utils/lib/signatureUtils'
import { Request } from 'express'
import { getContractKit } from '../web3/contracts'
import logger from './logger'

/*
 * Confirms that user is who they say they are and throws error on failure to confirm.
 * Authorization header should contain the EC signed body
 */
export function authenticateUser(request: Request): boolean {
  logger.debug('Authenticating user')

  // https://tools.ietf.org/html/rfc7235#section-4.2
  const messageSignature = request.get('Authorization')
  const signer = request.body.account
  if (!messageSignature || !signer) {
    return false
  }

  const message = JSON.stringify(request.body)
  return verifySignature(message, messageSignature, signer)
}

export async function isVerified(account: string, hashedPhoneNumber: string): Promise<boolean> {
  // TODO (amyslawson) wrap forno request in retry
  const attestationsWrapper: AttestationsWrapper = await getContractKit().contracts.getAttestations()
  const attestationStatus = await attestationsWrapper.getVerifiedStatus(hashedPhoneNumber, account)

  logger.debug(
    `CELO_PNP_DEBUG user is verified=${attestationStatus.isVerified} with ${attestationStatus.completed} completed attestations and
      ${attestationStatus.numAttestationsRemaining} verifications remaining. Total of ${attestationStatus.total} requested.`
  )
  return attestationStatus.isVerified
}
