import {
  DomainQuotaStatusRequest,
  domainQuotaStatusResponseSchema,
  ErrorMessage,
  OdisResponse,
  send,
  SequentialDelayDomainStateSchema,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { Action } from '../../../common/action'
import { Signer, thresholdCallToSigners } from '../../../common/combine'
import { Locals } from '../../../common/handlers'
import { IO, sendFailure } from '../../../common/io'
import { Session } from '../../../common/session'
import { getCombinerVersion, OdisConfig } from '../../../config'
import { DomainSignerResponseLogger } from '../../services/log-responses'
import { DomainThresholdStateService } from '../../services/threshold-state'

export class DomainQuotaAction implements Action<DomainQuotaStatusRequest> {
  readonly responseLogger = new DomainSignerResponseLogger()
  protected readonly signers: Signer[] = JSON.parse(this.config.odisServices.signers)
  constructor(
    readonly config: OdisConfig,
    readonly thresholdStateService: DomainThresholdStateService<DomainQuotaStatusRequest>,
    readonly io: IO<DomainQuotaStatusRequest>
  ) {}

  async perform(
    _request: Request<{}, {}, DomainQuotaStatusRequest>,
    response: Response<OdisResponse<DomainQuotaStatusRequest>, Locals>,
    session: Session<DomainQuotaStatusRequest>
  ) {
    await thresholdCallToSigners(
      response.locals.logger,
      this.signers,
      this.io.signerEndpoint,
      session,
      null,
      this.config.odisServices.timeoutMilliSeconds,
      domainQuotaStatusResponseSchema(SequentialDelayDomainStateSchema)
    )

    this.responseLogger.logResponseDiscrepancies(session)
    const { threshold } = session.keyVersionInfo
    if (session.responses.length >= threshold) {
      try {
        const domainQuotaStatus = this.thresholdStateService.findThresholdDomainState(session)
        send(
          response,
          {
            success: true,
            version: getCombinerVersion(),
            status: domainQuotaStatus,
          },
          200,
          response.locals.logger
        )
        return
      } catch (err) {
        session.logger.error(err, 'Error combining signer quota status responses')
      }
    }
    sendFailure(
      ErrorMessage.THRESHOLD_DOMAIN_QUOTA_STATUS_FAILURE,
      session.getMajorityErrorCode() ?? 500,
      session.response
    )
  }
}
