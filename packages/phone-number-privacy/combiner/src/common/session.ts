import {
  DomainRestrictedSignatureRequest,
  ErrorMessage,
  OdisRequest,
  OdisResponse,
  PoprfCombiner,
  rootLogger,
  SignMessageRequest,
} from '@celo/phone-number-privacy-common'
import AbortController from 'abort-controller'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { OdisConfig } from '../config'
import { ServicePartialSignature } from './bls/bls-cryptography-client'
import { SignerResponse } from './io'

// prettier-ignore
// export type CryptoClient<R extends OdisRequest> =
//  | R extends DomainRestrictedSignatureRequest ? DomainCryptoClient : never
//  | R extends SignMessageRequest ? BLSCryptographyClient : never
//  | undefined

// TODO EN: could have both DomainRestrictedSignatureRequest and SignMessageRequest
// TODO EN if we go with this, move to requests common
export type SignatureRequest = DomainRestrictedSignatureRequest | SignMessageRequest
export type CryptoClient<R extends OdisRequest> = R extends
  | DomainRestrictedSignatureRequest
  | SignMessageRequest
  ? CombinerCryptoClient
  : never | undefined

// TODO EN rename and factor out possibly into its own file
// possibly move towards abstract class instead of interface depending on shared code
// export interface CryptoClientInterface<R extends OdisRequest> {
export interface CombinerCryptoClient {
  hasSufficientSignatures(): boolean
  combinePartialBlindedSignatures(blindedMessage: string, logger?: Logger): Promise<string>
  addSignature(serviceResponse: ServicePartialSignature): void // TODO EN: if this stays, reorganize where the ServicePartialSignature should go
}

// TODO EN rename
export abstract class RenameCombinerCryptoClient implements CombinerCryptoClient {
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

  // TODO EN: if this stays, reorganize where the ServicePartialSignature should go
  public addSignature(serviceResponse: ServicePartialSignature): void {
    this.unverifiedSignatures.push(serviceResponse)
  }
}

// TODO EN: if no abstract class for the crypto client, then just have BLSCryptographyClient implement the interface
// export class PNPCryptoClient extends BLSCryptographyClient implements CombinerCryptoClient {

//   // TODO EN: can also have the PNPCryptoClient instantiate a BLSCryptographyClient
//   // that it then uses to implement these functions
//   // public hasSufficientSignatures(): boolean {
//   //   throw new Error('not implemented')
//   // }
//   // public combinePartialBlindedSignatures(blindedMessage: string, logger?: Logger): Promise<string> {
//   //   throw new Error('not implemented')
//   // }
//   // // TODO EN: if this stays, reorganize where the ServicePartialSignature should go
//   // public addSignature(serviceResponse: ServicePartialSignature): void {
//   //   throw new Error('not implemented')
//   // }
// }

export class DomainCryptoClient extends RenameCombinerCryptoClient implements CombinerCryptoClient {
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
    // TODO EN double check this logic, make sure this is doing what we want this to do
    return this.unverifiedSignatures.map((response) =>
      Uint8Array.from(Buffer.from(response.signature, 'base64'))
    )
  }

  // TODO EN: note that this does not seem to need to be async -- same with bls-crypto client???
  protected async _combinePartialBlindedSignatures(
    _blindedMessage: string, // TODO EN: fix this and find better solution for this
    logger: Logger
  ): Promise<string> {
    // TODO EN: is this extra try/catch handling required here? -> TODO pOPRF blindaggregate failure test case
    try {
      const result = this.cryptoClient.blindAggregate(this.allSigsAsArray)
      if (result !== undefined) {
        // TODO EN fix this and function sigs appropriately
        return result.toString('base64')
      }
    } catch (error) {
      logger.error(error)
    }
    throw new Error(ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES)
  }
}

export class Session<R extends OdisRequest> {
  public timedOut: boolean = false
  readonly logger: Logger
  readonly abort: AbortController = new AbortController()
  readonly failedSigners: Set<string> = new Set<string>()
  readonly errorCodes: Map<number, number> = new Map<number, number>()
  readonly responses: Array<SignerResponse<R>> = new Array<SignerResponse<R>>()

  public constructor(
    readonly request: Request<{}, {}, R>,
    readonly response: Response<OdisResponse<R>>,
    // TODO EN figure out typing locks to ensure that correct session <-> correct CryptoClient
    // readonly crypto: CombinerCryptoClient
    readonly crypto: CryptoClient<R>
  ) {
    this.logger = response.locals.logger
  }

  incrementErrorCodeCount(errorCode: number) {
    this.errorCodes.set(errorCode, (this.errorCodes.get(errorCode) ?? 0) + 1)
  }

  getMajorityErrorCode(): number | null {
    const uniqueErrorCount = Array.from(this.errorCodes.keys()).length
    if (uniqueErrorCount > 1) {
      this.logger.error(
        { errorCodes: JSON.stringify([...this.errorCodes]) },
        ErrorMessage.INCONSISTENT_SIGNER_RESPONSES
      )
    }

    let maxErrorCode = -1
    let maxCount = -1
    this.errorCodes.forEach((count, errorCode) => {
      // This gives priority to the lower status codes in the event of a tie
      // because 400s are more helpful than 500s for user feedback
      if (count > maxCount || (count === maxCount && errorCode < maxErrorCode)) {
        maxCount = count
        maxErrorCode = errorCode
      }
    })
    return maxErrorCode > 0 ? maxErrorCode : null
  }
}
