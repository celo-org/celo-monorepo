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

  // TODO EN: comments & docstrings if this structure stays
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

  // TODO EN QUESTION: why does combinePartialBlindedSignatures in bls-cryptography-client return a promise??
  protected abstract _combinePartialBlindedSignatures(
    blindedMessage: string,
    logger: Logger
  ): Promise<string>

  public addSignature(serviceResponse: ServicePartialSignature): void {
    this.unverifiedSignatures.push(serviceResponse)
  }
}
