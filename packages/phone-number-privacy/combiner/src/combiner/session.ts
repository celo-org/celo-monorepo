import {
  DomainRestrictedSignatureRequest,
  ErrorMessage,
  OdisRequest,
  OdisResponse,
  SignMessageRequest,
} from '@celo/phone-number-privacy-common'
import AbortController from 'abort-controller'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { BLSCryptographyClient } from '../bls/bls-cryptography-client'
import { SignerResponse } from './io.abstract'

// prettier-ignore
export type CryptoClient<R extends OdisRequest> = 
 | R extends DomainRestrictedSignatureRequest ? BLSCryptographyClient : never
 | R extends SignMessageRequest ? BLSCryptographyClient : never 
 | undefined

export class Session<R extends OdisRequest> {
  public timedOut: boolean = false
  readonly logger: Logger
  readonly controller: AbortController = new AbortController()
  readonly failedSigners: Set<string> = new Set<string>()
  readonly errorCodes: Map<number, number> = new Map<number, number>()
  readonly responses: Array<SignerResponse<R>> = new Array<SignerResponse<R>>()

  public constructor(
    readonly request: Request<{}, {}, R>,
    readonly response: Response<OdisResponse<R>>,
    readonly crypto: CryptoClient<R>
  ) {
    this.logger = response.locals.logger()
  }

  incrementErrorCodeCount(errorCode: number) {
    this.errorCodes.set(errorCode, (this.errorCodes.get(errorCode) ?? 0) + 1)
  }

  getMajorityErrorCode(): number | null {
    // Ignore timeouts
    const ignoredErrorCodes = [504] // @victor what status code should we use here
    const uniqueErrorCount = Array.from(this.errorCodes.keys()).filter(
      (status) => !ignoredErrorCodes.includes(status)
    ).length
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
