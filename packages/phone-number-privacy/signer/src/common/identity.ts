import { verifySignature } from '@celo/utils/lib/signatureUtils'
import { Request } from 'express'
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
