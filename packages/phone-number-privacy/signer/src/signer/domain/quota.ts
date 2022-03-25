import {
  domainHash,
  DomainQuotaStatusRequest,
  DomainQuotaStatusResponseFailure,
  DomainQuotaStatusResponseSuccess,
  domainRestrictedSignatureRequestSchema,
  DomainSchema,
  DomainState,
  ErrorMessage,
  ErrorType,
  getCombinerEndpoint,
  send,
  SignerEndpoint,
  verifyDomainQuotaStatusRequestAuthenticity,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { Counters } from '../../common/metrics'
import { getVersion } from '../../config'
import { DOMAINS_STATES_COLUMNS } from '../../database/models/domainState'
import { getDomainState } from '../../database/wrappers/domainState'
import { Session } from '../session'
import { Signer } from '../signer'

export class DomainQuotaStatus extends Signer<DomainQuotaStatusRequest> {
  readonly endpoint = SignerEndpoint.DOMAIN_QUOTA_STATUS
  readonly combinerEndpoint = getCombinerEndpoint(this.endpoint)

  protected async _handle(session: Session<DomainQuotaStatusRequest>): Promise<void> {
    const domain = session.request.body.domain
    // TODO(Alec)(Next): logging
    session.logger.info('Processing request to get domain quota status', {
      name: domain.name,
      version: domain.version,
      hash: domainHash(domain),
    })
    try {
      const domainState = await getDomainState(domain, session.logger)
      let quotaStatus: DomainState
      if (domainState) {
        quotaStatus = {
          counter: domainState[DOMAINS_STATES_COLUMNS.counter] ?? 0,
          disabled: domainState[DOMAINS_STATES_COLUMNS.disabled],
          timer: domainState[DOMAINS_STATES_COLUMNS.timer] ?? 0,
          date: Date.now(), // TODO(Alec)(Next)
        }
      } else {
        quotaStatus = {
          counter: 0,
          disabled: false,
          timer: 0,
          date: Date.now(), // TODO(Alec)(Next)
        }
      }

      this.sendSuccess(200, session.response, session.logger, quotaStatus)
    } catch (error) {
      session.logger.error('Error while getting domain status', error)
      this.sendFailure(ErrorMessage.DATABASE_GET_FAILURE, 500, session.response, session.logger)
    }
  }

  protected validate(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, DomainQuotaStatusRequest> {
    return domainRestrictedSignatureRequestSchema(DomainSchema).is(request.body)
  }

  protected authenticate(request: Request<{}, {}, DomainQuotaStatusRequest>): Promise<boolean> {
    return Promise.resolve(verifyDomainQuotaStatusRequestAuthenticity(request.body))
  }

  protected sendSuccess(
    status: number,
    response: Response<DomainQuotaStatusResponseSuccess>,
    logger: Logger,
    domainState: DomainState
  ) {
    send(
      response,
      {
        success: true,
        version: getVersion(),
        status: domainState,
      },
      status,
      logger
    )
    Counters.responses.labels(this.endpoint, status.toString()).inc()
  }

  protected sendFailure(
    error: ErrorType,
    status: number,
    response: Response<DomainQuotaStatusResponseFailure>,
    logger: Logger,
    domainState?: DomainState
  ) {
    send(
      response,
      {
        success: false,
        version: getVersion(),
        error,
        status: domainState,
      },
      status,
      logger
    )
    Counters.responses.labels(this.endpoint, status.toString()).inc()
  }

  protected checkRequestKeyVersion(_request: Request<{}, {}, DomainQuotaStatusRequest>): boolean {
    return true
  }
}
