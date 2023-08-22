import {
  ErrorMessage,
  KeyVersionInfo,
  OdisRequest,
  OdisResponse,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Response } from 'express'
import { SignerResponse } from './io'

export class Session<R extends OdisRequest> {
  readonly logger: Logger

  readonly errorCodes: Map<number, number> = new Map<number, number>()
  readonly responses: Array<SignerResponse<R>> = new Array<SignerResponse<R>>()
  readonly warnings: string[] = []

  public constructor(response: Response<OdisResponse<R>>, readonly keyVersionInfo: KeyVersionInfo) {
    this.logger = response.locals.logger
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
