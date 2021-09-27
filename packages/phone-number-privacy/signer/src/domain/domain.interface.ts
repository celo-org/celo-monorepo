import { DisableDomainRequestBody } from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import * as core from 'express-serve-static-core'

export interface IDomainService {
  handleDisableDomain(
    request: Request<core.ParamsDictionary, {}, DisableDomainRequestBody>,
    response: Response
  ): Promise<void>
  handleGetDomainStatus(
    request: Request<core.ParamsDictionary, {}, {}>,
    response: Response
  ): Promise<void>
}
