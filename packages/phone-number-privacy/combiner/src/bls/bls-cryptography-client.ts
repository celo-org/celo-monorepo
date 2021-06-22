import { ErrorMessage, rootLogger } from '@celo/phone-number-privacy-common'
import threshold_bls from 'blind-threshold-bls'
import Logger from 'bunyan'
import config from '../config'

export interface ServicePartialSignature {
  url: string
  signature: string
}

function flattenSigsArray(sigs: Uint8Array[]) {
  return Uint8Array.from(sigs.reduce((a, b) => a.concat(Array.from(b)), [] as any))
}
export class BLSCryptographyClient {
  private unverifiedSignatures: ServicePartialSignature[] = []
  private verifiedSignatures: ServicePartialSignature[] = []
  private get allSignaturesLength(): number {
    return this.unverifiedSignatures.length + this.verifiedSignatures.length
  }
  private get allSignatures(): Uint8Array {
    const allSigs = this.verifiedSignatures.concat(this.unverifiedSignatures)
    const sigBuffers = allSigs.map((response) => Buffer.from(response.signature, 'base64'))
    return flattenSigsArray(sigBuffers)
  }

  public addSignature(serviceResponse: ServicePartialSignature) {
    this.unverifiedSignatures.push(serviceResponse)
  }

  /**
   * Returns true if the number of valid signatures is enough to perform a combination
   */
  public hasSufficientSignatures(): boolean {
    const threshold = config.thresholdSignature.threshold
    return this.allSignaturesLength >= threshold
  }

  /*
   * Computes the BLS signature for the blinded phone number.
   * Throws an exception if not enough valid signatures
   * and drops the invalid signature for future requests using this instance
   */
  public async combinePartialBlindedSignatures(
    blindedMessage: string,
    logger?: Logger
  ): Promise<string> {
    logger = logger ?? rootLogger
    const threshold = config.thresholdSignature.threshold
    if (!this.hasSufficientSignatures()) {
      logger.error(
        { signatures: this.allSignaturesLength, required: threshold },
        ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES
      )
      throw new Error(
        `${ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES} ${this.allSignaturesLength}/${threshold}`
      )
    }
    // Optimistically attempt to combine unverified signatures
    // If combination fails, iterate through each signature and remove invalid ones
    // We do this since signature verification incurs higher latencies
    try {
      const result = threshold_bls.combine(threshold, this.allSignatures)
      return Buffer.from(result).toString('base64')
    } catch (error) {
      logger.error(error)
      // Verify each signature and remove invalid ones
      // This logging will help us troubleshoot which signers are having issues
      this.unverifiedSignatures.forEach((unverifiedSignature) => {
        this.verifySignature(blindedMessage, unverifiedSignature, logger!)
      })
      this.clearUnverifiedSignatures()
      throw new Error(ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES)
    }
  }

  private verifySignature(
    blindedMessage: string,
    unverifiedSignature: ServicePartialSignature,
    logger: Logger
  ) {
    const sigBuffer = Buffer.from(unverifiedSignature.signature, 'base64')
    if (this.isValidSignature(sigBuffer, blindedMessage)) {
      // We move it to the verified set so that we don't need to re-verify in the future
      this.verifiedSignatures.push(unverifiedSignature)
    } else {
      logger.error({ url: unverifiedSignature.url }, ErrorMessage.VERIFY_PARITAL_SIGNATURE_ERROR)
    }
  }

  private clearUnverifiedSignatures() {
    this.unverifiedSignatures = []
  }

  private isValidSignature(signature: Buffer, blindedMessage: string) {
    const polynomial = config.thresholdSignature.polynomial
    try {
      threshold_bls.partialVerifyBlindSignature(
        Buffer.from(polynomial, 'hex'),
        Buffer.from(blindedMessage, 'base64'),
        signature
      )
      return true
    } catch {
      return false
    }
  }
}
