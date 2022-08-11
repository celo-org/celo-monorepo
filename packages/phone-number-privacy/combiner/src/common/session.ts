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
import { BLSCryptographyClient, ServicePartialSignature } from './bls/bls-cryptography-client'
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

// TODO EN: if no abstract class for the crypto client, then just have BLSCryptographyClient implement the interface
export class PNPCryptoClient extends BLSCryptographyClient implements CombinerCryptoClient {
  // TODO EN: can also have the PNPCryptoClient instantiate a BLSCryptographyClient
  // that it then uses to implement these functions
  // public hasSufficientSignatures(): boolean {
  //   throw new Error('not implemented')
  // }
  // public combinePartialBlindedSignatures(blindedMessage: string, logger?: Logger): Promise<string> {
  //   throw new Error('not implemented')
  // }
  // // TODO EN: if this stays, reorganize where the ServicePartialSignature should go
  // public addSignature(serviceResponse: ServicePartialSignature): void {
  //   throw new Error('not implemented')
  // }
}

export class DomainCryptoClient implements CombinerCryptoClient {
  // No way of verifying signatures on the server-side
  private unverifiedSignatures: ServicePartialSignature[] = []
  private cryptoClient: PoprfCombiner

  // constructor() {}
  constructor(private readonly config: OdisConfig) {
    this.cryptoClient = new PoprfCombiner(this.config.keys.threshold)
  }

  // TODO EN CLEAN UP COPIED
  private get allSignaturesLength(): number {
    return this.unverifiedSignatures.length
  }

  // TODO EN: rename if no abstract class factoring out
  private get allSignatures(): Uint8Array[] {
    // TODO EN double check this logic, make sure this is doing what we want this to do
    return this.unverifiedSignatures.map((response) =>
      Uint8Array.from(Buffer.from(response.signature, 'base64'))
    )
    // // TODO EN CLEAN UP, COPIED
    // return Uint8Array.from(sigBuffers.reduce((a, b) => a.concat(Array.from(b)), [] as any))
  }

  // TODO EN: consider moving this functionality to the PoprfCombiner class itself
  public hasSufficientSignatures(): boolean {
    return this.allSignaturesLength >= this.config.keys.threshold
  }

  public combinePartialBlindedSignatures(
    _blindedMessage: string, // TODO EN: fix this and find better solution for this
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

    const result = this.cryptoClient.blindAggregate(this.allSignatures)
    if (result !== undefined) {
      // TODO EN fix this and function sigs appropriately
      return Promise.resolve(result.toString('base64'))
    }
    throw new Error(ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES)

    // Optimistically attempt to combine unverified signatures
    // If combination or verification fails, iterate through each signature and remove invalid ones
    // We do this since partial signature verification incurs higher latencies

    // try {
    //   // const result = this.cryptoClient.blindAggregate(this.allSignatures)
    //   // if (result !== undefined) {
    //   //   // TODO EN fix this and function sigs appropriately
    //   //   return Promise.resolve(result.toString('base64'))
    //   // }

    //   // // const result = threshold_bls.combine(this.config.keys.threshold, this.allSignatures) // TODO(Alec)(Next): This is throwing an error. We probably need to import in and use the new crypto client
    //   // this.verifyCombinedSignature(blindedMessage, result, logger)
    //   // return Buffer.from(result).toString('base64')
    // } catch (error) {
    //   logger.error(error)
    //   // Verify each signature and remove invalid ones
    //   // This logging will help us troubleshoot which signers are having issues
    //   this.unverifiedSignatures.forEach((unverifiedSignature) => {
    //     this.verifyPartialSignature(blindedMessage, unverifiedSignature, logger!)
    //   })
    //   this.clearUnverifiedSignatures()
    //   throw new Error(ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES)
    // }
  }

  // TODO EN: if this stays, reorganize where the ServicePartialSignature should go
  public addSignature(serviceResponse: ServicePartialSignature): void {
    this.unverifiedSignatures.push(serviceResponse)
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
