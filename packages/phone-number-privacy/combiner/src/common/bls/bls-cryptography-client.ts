import { ErrorMessage, rootLogger } from '@celo/phone-number-privacy-common'
import threshold_bls from 'blind-threshold-bls'
import Logger from 'bunyan'
import { OdisConfig } from '../../config'

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

  constructor(private readonly config: OdisConfig) {}

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
    return this.allSignaturesLength >= this.config.keys.threshold
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
    logger = logger ?? rootLogger(this.config.serviceName)
    if (!this.hasSufficientSignatures()) {
      logger.error(
        { signatures: this.allSignaturesLength, required: this.config.keys.threshold },
        ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES
      )
      throw new Error(
        `${ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES} ${this.allSignaturesLength}/${this.config.keys.threshold}`
      )
    }
    // Optimistically attempt to combine unverified signatures
    // If combination or verification fails, iterate through each signature and remove invalid ones
    // We do this since partial signature verification incurs higher latencies
    try {
      const result = threshold_bls.combine(this.config.keys.threshold, this.allSignatures)
      this.verifyCombinedSignature(blindedMessage, result, logger)
      return Buffer.from(result).toString('base64')
    } catch (error) {
      logger.error(error)
      // Verify each signature and remove invalid ones
      // This logging will help us troubleshoot which signers are having issues
      this.unverifiedSignatures.forEach((unverifiedSignature) => {
        this.verifyPartialSignature(blindedMessage, unverifiedSignature, logger!)
      })
      this.clearUnverifiedSignatures()
      throw new Error(ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES)
    }
  }

  private verifyCombinedSignature(
    blindedMessage: string,
    combinedSignature: Uint8Array,
    logger: Logger
  ) {
    try {
      // TODO: Address bad documentation in threshold-bls lib.
      // Documentation should not specify that verifyBlindSignature verifies the
      // signature after it has been unblinded.
      threshold_bls.verifyBlindSignature(
        Buffer.from(this.config.keys.pubKey, 'base64'),
        Buffer.from(blindedMessage, 'base64'),
        combinedSignature
      )
    } catch (error) {
      logger.error('Combined signature verification failed')
      throw error
    }
  }

  private verifyPartialSignature(
    blindedMessage: string,
    unverifiedSignature: ServicePartialSignature,
    logger: Logger
  ) {
    const sigBuffer = Buffer.from(unverifiedSignature.signature, 'base64')
    if (this.isValidPartialSignature(sigBuffer, blindedMessage)) {
      // We move it to the verified set so that we don't need to re-verify in the future
      this.verifiedSignatures.push(unverifiedSignature)
    } else {
      logger.error({ url: unverifiedSignature.url }, ErrorMessage.VERIFY_PARITAL_SIGNATURE_ERROR)
    }
  }

  private clearUnverifiedSignatures() {
    this.unverifiedSignatures = []
  }

  private isValidPartialSignature(signature: Buffer, blindedMessage: string) {
    try {
      threshold_bls.partialVerifyBlindSignature(
        Buffer.from(this.config.keys.polynomial, 'hex'),
        Buffer.from(blindedMessage, 'base64'),
        signature
      )
      return true
    } catch {
      return false
    }
  }
}
