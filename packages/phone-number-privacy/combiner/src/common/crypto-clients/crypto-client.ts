import {
  DomainRestrictedSignatureRequest,
  ErrorMessage,
  OdisRequest,
  rootLogger,
  SignMessageRequest,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { OdisConfig } from '../../config'

// TODO EN: could have both DomainRestrictedSignatureRequest and SignMessageRequest
// TODO EN if we go with this, move to requests common
export type SignatureRequest = DomainRestrictedSignatureRequest | SignMessageRequest
export type CryptoClient<R extends OdisRequest> = R extends SignatureRequest
  ? CombinerCryptoClient
  : never | undefined

// TODO EN rename and factor out possibly into its own file
// possibly move towards abstract class instead of interface depending on shared code
// export interface CryptoClientInterface<R extends OdisRequest> {
// export interface CombinerCryptoClient {
//   hasSufficientSignatures(): boolean
//   combinePartialBlindedSignatures(blindedMessage: string, logger?: Logger): Promise<string>
//   addSignature(serviceResponse: ServicePartialSignature): void // TODO EN: if this stays, reorganize where the ServicePartialSignature should go
// }

export interface ServicePartialSignature {
  url: string
  signature: string
}

// TODO EN rename
export abstract class CombinerCryptoClient {
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
