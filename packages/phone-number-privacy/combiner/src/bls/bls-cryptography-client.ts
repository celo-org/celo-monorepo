import threshold_bls from 'blind-threshold-bls'
import { ErrorMessages } from '../common/error-utils'
import logger from '../common/logger'
import config from '../config'

export interface ServicePartialSignature {
  url: string
  signature: string
}

function flattenSigsArray(sigs: Uint8Array[]) {
  return Uint8Array.from(sigs.reduce((a, b) => a.concat(Array.from(b)), [] as any))
}
export class BLSCryptographyClient {
  /*
   * Computes the BLS signature for the blinded phone number.
   */
  public static async combinePartialBlindedSignatures(
    serviceResponses: ServicePartialSignature[],
    blindedMessage: string
  ): Promise<string> {
    const polynomial = config.thresholdSignature.polynomial
    const sigs: Uint8Array[] = []
    for (const serviceResponse of serviceResponses) {
      const sigBuffer = Buffer.from(serviceResponse.signature, 'base64')
      try {
        await threshold_bls.partialVerifyBlindSignature(
          Buffer.from(polynomial, 'hex'),
          Buffer.from(blindedMessage, 'base64'),
          sigBuffer
        )
        sigs.push(sigBuffer)
      } catch (e) {
        logger.error(
          `${ErrorMessages.VERIFY_PARITAL_SIGNATURE_ERROR} 
          Failed to verify signature for ${serviceResponse.url}`,
          e
        )
      }
    }
    const threshold = config.thresholdSignature.threshold
    if (sigs.length < threshold) {
      logger.error(`${ErrorMessages.NOT_ENOUGH_PARTIAL_SIGNATURES} ${sigs.length}/${threshold}`)
      throw new Error(`${ErrorMessages.NOT_ENOUGH_PARTIAL_SIGNATURES} ${sigs.length}/${threshold}`)
    }
    const result = threshold_bls.combine(threshold, flattenSigsArray(sigs))
    return Buffer.from(result).toString('base64')
  }
}
