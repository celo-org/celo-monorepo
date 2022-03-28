import {
  ErrorType,
  PhoneNumberPrivacyRequest,
  PhoneNumberPrivacyResponse,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'

export class PnpSession<R extends PhoneNumberPrivacyRequest> {
  readonly logger: Logger
  readonly errors: ErrorType[]

  public constructor(
    readonly request: Request<{}, {}, R>,
    readonly response: Response<PhoneNumberPrivacyResponse<R>>
  ) {
    this.logger = response.locals.logger()
    this.errors = []
  }
}
