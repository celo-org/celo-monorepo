import { ErrorMessage, PoprfCombiner } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { OdisConfig } from '../../config'
import { CryptoClient } from './common'

export class DomainCryptoClient extends CryptoClient {
  private poprfCombiner: PoprfCombiner

  constructor(protected readonly config: OdisConfig) {
    super(config)
    this.poprfCombiner = new PoprfCombiner(this.config.keys.threshold)
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
  protected async _combinePartialBlindedSignatures(
    _blindedMessage: string,
    logger: Logger
  ): Promise<string> {
    try {
      const result = this.poprfCombiner.blindAggregate(this.allSigsAsArray)
      if (result !== undefined) {
        return result.toString('base64')
      }
    } catch (error) {
      logger.error(error)
    }
    throw new Error(ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES)
  }
}
