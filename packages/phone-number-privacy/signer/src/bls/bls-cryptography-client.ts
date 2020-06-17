import threshold_bls from 'blind-threshold-bls'
import { ErrorMessages } from '../common/error-utils'
import logger from '../common/logger'

/*
 * Computes the BLS signature for the blinded phone number.
 */
export function computeBlindedSignature(base64BlindedMessage: string, privateKey: string) {
  try {
    const keyBuffer = Buffer.from(privateKey, 'hex')
    const msgBuffer = Buffer.from(base64BlindedMessage, 'base64')

    logger.debug('Calling theshold sign')
    const signedMsg = threshold_bls.partialSignBlindedMessage(keyBuffer, msgBuffer)
    logger.debug('Back from threshold sign, parsing results')

    if (!signedMsg) {
      throw new Error('Empty threshold sign result')
    }

    return Buffer.from(signedMsg).toString('base64')
  } catch (e) {
    logger.error(ErrorMessages.SIGNATURE_COMPUTATION_FAILURE, e)
    throw e
  }
}
