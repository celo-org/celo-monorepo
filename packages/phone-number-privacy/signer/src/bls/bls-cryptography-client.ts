import { ErrorMessage } from '@celo/phone-number-privacy-common'
import threshold_bls from 'blind-threshold-bls'
import Logger from 'bunyan'
import { Counters } from '../common/metrics'
/*
 * Computes the BLS signature for the blinded phone number.
 */
export function computeBlindedSignature(
  base64BlindedMessage: string,
  privateKey: string,
  logger: Logger
) {
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
  } catch (err) {
    Counters.signatureComputationErrors.inc()
    logger.error(ErrorMessage.SIGNATURE_COMPUTATION_FAILURE)
    throw err
  }
}
