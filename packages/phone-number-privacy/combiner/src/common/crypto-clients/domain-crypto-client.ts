import { ErrorMessage, PoprfCombiner } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { OdisConfig } from '../../config'
import { CryptoClient } from './common'

export class DomainCryptoClient extends CryptoClient {
  private cryptoClient: PoprfCombiner

  constructor(protected readonly config: OdisConfig) {
    super(config)
    this.cryptoClient = new PoprfCombiner(this.config.keys.threshold)
  }

  protected get allSignaturesLength(): number {
    // No way of verifying signatures on the server-side
    return this.unverifiedSignatures.length
  }

  // TODO EN: rename if no abstract class factoring out
  private get allSigsAsArray(): Uint8Array[] {
    return this.unverifiedSignatures.map((response) => Buffer.from(response.signature, 'base64'))
  }

  // TODO EN question: does this actually need to be async -- same with bls-crypto client???
  protected async _combinePartialBlindedSignatures(
    _blindedMessage: string, // TODO EN: fix this and find better solution for this
    logger: Logger
  ): Promise<string> {
    // TODO EN: is this extra try/catch handling required here? -> TODO pOPRF blindaggregate failure test case
    try {
      const result = this.cryptoClient.blindAggregate(this.allSigsAsArray)
      if (result !== undefined) {
        return result.toString('base64')
      }
    } catch (error) {
      logger.error(error)
    }
    throw new Error(ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES)
  }
}
