import threshold_bls from 'blind-threshold-bls'
import logger from '../common/logger'
import config from '../config'

export interface ServicePartialSignature {
  url: string
  signature: string
}

function flattenSigsArray(sigs: Uint8Array[]) {
  return Uint8Array.from(sigs.reduce((a, b) => Array.from(a).concat(Array.from(b)), [] as any))
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
    for (const service of serviceResponses) {
      const sigBuffer = Buffer.from(service.signature, 'base64')
      try {
        await threshold_bls.partialVerifyBlindSignature(
          Buffer.from(polynomial, 'base64'),
          Buffer.from(blindedMessage, 'base64'),
          sigBuffer
        )
        sigs.push(sigBuffer)
      } catch (e) {
        logger.warn(`could not verify signature for service url ${service.url}`)
      }
    }
    const threshold = config.thresholdSignature.threshold
    if (sigs.length < threshold) {
      logger.error(`not enough not enough partial signatures'${sigs.length}'/'${threshold}'`)
      throw new Error(`not enough not enough partial signatures'${sigs.length}'/'${threshold}'`)
    }
    const result = threshold_bls.combine(threshold, flattenSigsArray(sigs))
    return Buffer.from(result).toString('base64')
  }
}
