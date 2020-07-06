import { ErrorMessage } from '@celo/phone-number-privacy-common'
import threshold_bls from 'blind-threshold-bls'
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
  private verifiedSignatures: Uint8Array[] = []

  public async addSignature(
    serviceResponse: ServicePartialSignature,
    blindedMessage: string
  ): Promise<void> {
    const polynomial = config.thresholdSignature.polynomial
    const sigBuffer = Buffer.from(serviceResponse.signature, 'base64')

    try {
      await threshold_bls.partialVerifyBlindSignature(
        Buffer.from(polynomial, 'hex'),
        Buffer.from(blindedMessage, 'base64'),
        sigBuffer
      )
      this.verifiedSignatures.push(sigBuffer)
    } catch (e) {
      logger.error(
        `${ErrorMessage.VERIFY_PARITAL_SIGNATURE_ERROR} 
        Failed to verify signature for ${serviceResponse.url}`,
        e
      )
    }
  }

  /**
   * Returns true if the number of valid signatures is enough to perform a combination
   */
  public sufficientVerifiedSignatures(): boolean {
    const threshold = config.thresholdSignature.threshold
    return this.verifiedSignatures.length >= threshold
  }

  /*
   * Computes the BLS signature for the blinded phone number.
   */
  public async combinePartialBlindedSignatures(): Promise<string> {
    const threshold = config.thresholdSignature.threshold
    if (!this.sufficientVerifiedSignatures()) {
      logger.error(
        `${ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES} ${this.verifiedSignatures.length}/${threshold}`
      )
      throw new Error(
        `${ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES} ${this.verifiedSignatures.length}/${threshold}`
      )
    }
    const result = threshold_bls.combine(threshold, flattenSigsArray(this.verifiedSignatures))
    return Buffer.from(result).toString('base64')
  }
}
