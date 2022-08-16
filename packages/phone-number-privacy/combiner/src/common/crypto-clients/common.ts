import { ErrorMessage, rootLogger } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { OdisConfig } from '../../config'

export interface ServicePartialSignature {
  url: string
  signature: string
}

export abstract class CryptoClient {
  protected unverifiedSignatures: ServicePartialSignature[] = []

  constructor(protected readonly config: OdisConfig) {}

  /**
   * Returns total number of signatures received; must be implemented by subclass.
   */
  protected abstract get allSignaturesLength(): number

  /**
   * Returns true if the number of valid signatures is enough to perform a combination
   */
  public hasSufficientSignatures(): boolean {
    return this.allSignaturesLength >= this.config.keys.threshold
  }

  /*
   * Computes the signature for the blinded phone number using subclass-specific
   * logic defined in _combinePartialBlindedSignatures.
   * Throws an exception if not enough valid signatures.
   */
  // TODO EN (+ reviewers) this function is async for historical reasons,
  //  but does either threshold_bls or poprf require this?
  public combinePartialBlindedSignatures(blindedMessage: string, logger?: Logger): Promise<string> {
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
    return this._combinePartialBlindedSignatures(blindedMessage, logger)
  }

  /*
   * Computes the signature for the blinded phone number.
   * Must be implemented by subclass.
   */
  protected abstract _combinePartialBlindedSignatures(
    blindedMessage: string,
    logger: Logger
  ): Promise<string>

  public addSignature(serviceResponse: ServicePartialSignature): void {
    this.unverifiedSignatures.push(serviceResponse)
  }
}
