import threshold from 'blind-threshold-bls'
import { ErrorMessages } from '../common/error-utils'
import config from '../config'

/*
 * Computes the BLS Salt for the blinded phone number.
 */
export function computeBlindedSignature(base64BlindedMessage: string) {
  try {
    return Buffer.from(
      threshold.sign(
        new Uint8Array(new Buffer(config.salt.key, 'base64')),
        new Uint8Array(new Buffer(base64BlindedMessage, 'base64'))
      )
    ).toString('base64')
  } catch (e) {
    console.error(ErrorMessages.SALT_COMPUTATION_FAILURE, e)
    throw e
  }
}
