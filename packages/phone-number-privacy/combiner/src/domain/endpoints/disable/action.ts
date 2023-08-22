import {
  DisableDomainRequest,
  disableDomainResponseSchema,
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

export class DomainDisableAction implements Action<DisableDomainRequest> {
  readonly responseLogger: DomainSignerResponseLogger = new DomainSignerResponseLogger()
  protected readonly signers: Signer[] = JSON.parse(this.config.odisServices.signers)
  constructor(
    readonly config: OdisConfig,
    readonly thresholdStateService: DomainThresholdStateService<DisableDomainRequest>,
    readonly io: IO<DisableDomainRequest>
  ) {}

  async perform(
    _request: Request<{}, {}, DisableDomainRequest>,
    response: Response<OdisResponse<DisableDomainRequest>, Locals>,
    session: Session<DisableDomainRequest>
  ) {
    await thresholdCallToSigners(
      response.locals.logger,
      this.signers,
      this.io.signerEndpoint,
      session,
      null,
      this.config.odisServices.timeoutMilliSeconds,
      disableDomainResponseSchema(SequentialDelayDomainStateSchema)
    )

    this.responseLogger.logResponseDiscrepancies(session)
    try {
      const disableDomainStatus = this.thresholdStateService.findThresholdDomainState(session)
      if (disableDomainStatus.disabled) {
        send(
          response,
          {
            success: true,
            version: getCombinerVersion(),
            status: disableDomainStatus,
          },
          200,
          response.locals.logger
        )

        return
      }
    } catch (err) {
      session.logger.error({ err }, 'Error combining signer disable domain status responses')
    }

    sendFailure(
      ErrorMessage.THRESHOLD_DISABLE_DOMAIN_FAILURE,
      session.getMajorityErrorCode() ?? 500,
      session.response
    )
  }
}
