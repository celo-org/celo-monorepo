import threshold from 'blind-threshold-bls'
import { ErrorMessages } from '../common/error-utils'
import logger from '../common/logger'
import config from '../config'

/*
 * Computes the BLS signature for the blinded phone number.
 */
export function computeBlindedSignature(base64BlindedMessage: string) {
  logger.debug('Computing blinded signature')
  try {
    return Buffer.from(
      threshold.sign(
        new Uint8Array(new Buffer(config.salt.key, 'base64')),
        new Uint8Array(new Buffer(base64BlindedMessage, 'base64'))
      )
    ).toString('base64')
  } catch (e) {
    logger.error(ErrorMessages.SIGNATURE_COMPUTATION_FAILURE, e)
    throw e
  }
}
