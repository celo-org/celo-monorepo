import {
  CombinerEndpoint,
  DisableDomainRequest,
  disableDomainRequestSchema,
  DisableDomainResponse,
  DisableDomainResponseFailure,
  disableDomainResponseSchema,
  DisableDomainResponseSuccess,
  DomainSchema,
  DomainState,
  ErrorType,
  getSignerEndpoint,
  send,
  SequentialDelayDomainStateSchema,
  SignerEndpoint,
  verifyDisableDomainRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import * as t from 'io-ts'
import { getKeyVersionInfo, IO, sendFailure } from '../../../common/io'
import { Session } from '../../../common/session'
import { getCombinerVersion } from '../../../config'

export class DomainDisableIO extends IO<DisableDomainRequest> {
  readonly endpoint: CombinerEndpoint = CombinerEndpoint.DISABLE_DOMAIN
  readonly signerEndpoint: SignerEndpoint = getSignerEndpoint(this.endpoint)
  readonly requestSchema: t.Type<DisableDomainRequest, DisableDomainRequest, unknown> =
    disableDomainRequestSchema(DomainSchema)
  readonly responseSchema: t.Type<DisableDomainResponse, DisableDomainResponse, unknown> =
    disableDomainResponseSchema(SequentialDelayDomainStateSchema)

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<DisableDomainResponse>
  ): Promise<Session<DisableDomainRequest> | null> {
    if (!super.inputChecks(request, response)) {
      return null
    }
    if (!(await this.authenticate(request))) {
      sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return null
    }
    return new Session(
      request,
      response,
      getKeyVersionInfo(request, this.config, response.locals.logger)
    )
  }

  authenticate(request: Request<{}, {}, DisableDomainRequest>): Promise<boolean> {
    return Promise.resolve(verifyDisableDomainRequestAuthenticity(request.body))
  }

  sendSuccess(
    status: number,
    response: Response<DisableDomainResponseSuccess>,
    domainState: DomainState
  ) {
    send(
      response,
      {
        success: true,
        version: getCombinerVersion(),
        status: domainState,
      },
      status,
      response.locals.logger
    )
  }

  sendFailure(error: ErrorType, status: number, response: Response<DisableDomainResponseFailure>) {
    sendFailure(error, status, response)
  }
}
