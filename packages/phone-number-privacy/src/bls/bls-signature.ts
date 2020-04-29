import threshold from 'blind-threshold-bls'
import { ErrorMessages } from '../common/error-utils'
import logger from '../common/logger'
import config from '../config'

/*
 * Computes the BLS signature for a blinded message (e.g. phone number).
 */
export function computeBlindedSignature(base64BlindedMessage: string) {
  try {
    const keyBuffer = Buffer.from(config.salt.key, 'base64')
    const msgBuffer = Buffer.from(base64BlindedMessage, 'base64')

    logger.debug('Calling theshold sign')
    const signedMsg = threshold.signBlindedMessage(keyBuffer, msgBuffer)
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
