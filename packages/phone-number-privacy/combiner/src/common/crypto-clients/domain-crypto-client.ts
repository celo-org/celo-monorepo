import { ErrorMessage, KeyVersionInfo, PoprfCombiner } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { CryptoClient } from './crypto-client'

export class DomainCryptoClient extends CryptoClient {
  private poprfCombiner: PoprfCombiner

  constructor(protected readonly keyVersionInfo: KeyVersionInfo) {
    super(keyVersionInfo)
    this.poprfCombiner = new PoprfCombiner(keyVersionInfo.threshold)
  }

  protected get allSignaturesLength(): number {
    // No way of verifying signatures on the server-side
    return this.unverifiedSignatures.length
  }

  private get allSigsAsArray(): Uint8Array[] {
    return this.unverifiedSignatures.map((response) => Buffer.from(response.signature, 'base64'))
  }

  /*
   * Aggregates blind partial signatures into a blind aggregated POPRF evaluation.
   * On error, logs and throws exception for not enough signatures.
   * Verification of partial signatures is not possible server-side
   * (i.e. without the client's blinding factor).
   */
  protected _combineBlindedSignatureShares(_blindedMessage: string, logger: Logger): string {
    try {
      const result = this.poprfCombiner.blindAggregate(this.allSigsAsArray)
      if (result !== undefined) {
        return result.toString('base64')
      }
    } catch (error) {
      logger.error(ErrorMessage.SIGNATURE_AGGREGATION_FAILURE)
      logger.error(error)
    }
    throw new Error(ErrorMessage.SIGNATURE_AGGREGATION_FAILURE)
  }
}
