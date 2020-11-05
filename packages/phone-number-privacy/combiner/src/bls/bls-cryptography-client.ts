import { ErrorMessage, logger } from '@celo/phone-number-privacy-common'
import threshold_bls from 'blind-threshold-bls'
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
    } catch (err) {
      logger.error(ErrorMessage.VERIFY_PARITAL_SIGNATURE_ERROR)
      logger.error({ err, url: serviceResponse.url })
    }
  }

  /**
   * Returns true if the number of valid signatures is enough to perform a combination
   */
  public hasSufficientVerifiedSignatures(): boolean {
    const threshold = config.thresholdSignature.threshold
    return this.verifiedSignatures.length >= threshold
  }

  /*
   * Computes the BLS signature for the blinded phone number.
   */
  public async combinePartialBlindedSignatures(): Promise<string> {
    const threshold = config.thresholdSignature.threshold
    if (!this.hasSufficientVerifiedSignatures()) {
      const err = new Error(
        `${ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES} ${this.verifiedSignatures.length}/${threshold}`
      )
      logger.error({ err })
      throw err
    }
    const result = threshold_bls.combine(threshold, flattenSigsArray(this.verifiedSignatures))
    return Buffer.from(result).toString('base64')
  }
}
