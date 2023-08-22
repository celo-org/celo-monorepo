import {
  CombinerEndpoint,
  DisableDomainRequest,
  disableDomainRequestSchema,
  DisableDomainResponse,
  DomainSchema,
  verifyDisableDomainRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import * as t from 'io-ts'
import { getKeyVersionInfo, IO, sendFailure } from '../../../common/io'
import { Session } from '../../../common/session'
import { OdisConfig } from '../../../config'

export class DomainDisableIO extends IO<DisableDomainRequest> {
  readonly requestSchema: t.Type<DisableDomainRequest, DisableDomainRequest, unknown> =
    disableDomainRequestSchema(DomainSchema)

  constructor(config: OdisConfig) {
    super(config, CombinerEndpoint.DISABLE_DOMAIN)
  }

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<DisableDomainResponse>
  ): Promise<Session<DisableDomainRequest> | null> {
    if (!this.validateClientRequest(request)) {
      sendFailure(WarningMessage.INVALID_INPUT, 400, response)
      return null
    }

    if (!verifyDisableDomainRequestAuthenticity(request.body)) {
      sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return null
    }
    return new Session(
      request,
      response,
      getKeyVersionInfo(request, this.config, response.locals.logger)
    )
  }
}
