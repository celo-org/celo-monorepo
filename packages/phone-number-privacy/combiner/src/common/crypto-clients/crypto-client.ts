import { ErrorMessage, KeyVersionInfo } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { performance } from 'perf_hooks'

export interface ServicePartialSignature {
  url: string
  signature: string
}

export abstract class CryptoClient {
  protected unverifiedSignatures: ServicePartialSignature[] = []

  constructor(protected readonly keyVersionInfo: KeyVersionInfo) {}

  /**
   * Returns true if the number of valid signatures is enough to perform a combination
   */
  public hasSufficientSignatures(): boolean {
    return this.allSignaturesLength >= this.keyVersionInfo.threshold
  }

  public addSignature(serviceResponse: ServicePartialSignature): void {
    this.unverifiedSignatures.push(serviceResponse)
  }

  /*
   * Computes the signature for the blinded phone number using subclass-specific
   * logic defined in _combineBlindedSignatureShares.
   * Throws an exception if not enough valid signatures or on aggregation failure.
   */
  public combineBlindedSignatureShares(blindedMessage: string, logger: Logger): string {
    if (!this.hasSufficientSignatures()) {
      const { threshold } = this.keyVersionInfo
      logger.error(
        { signatures: this.allSignaturesLength, required: threshold },
        ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES
      )
      throw new Error(
        `${ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES} ${this.allSignaturesLength}/${threshold}`
      )
    }
    const randomID =
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    const name = `combineBlindedSignatureShares/${randomID}`
    const start = `Start ${name}`
    const end = `End ${name}`

    performance.mark(start)

    const combinedSignature = this._combineBlindedSignatureShares(blindedMessage, logger)

    performance.mark(end)
    performance.measure(name, start, end)

    performance.clearMeasures(name)
    performance.clearMarks(start)
    performance.clearMarks(end)

    return combinedSignature
  }

  /*
   * Computes the signature for the blinded phone number.
   * Must be implemented by subclass.
   */
  protected abstract _combineBlindedSignatureShares(blindedMessage: string, logger: Logger): string

  /**
   * Returns total number of signatures received; must be implemented by subclass.
   */
  protected abstract get allSignaturesLength(): number
}
