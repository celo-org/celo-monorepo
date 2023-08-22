import {
  ErrorMessage,
  OdisResponse,
  PnpQuotaRequest,
  PnpQuotaResponseSchema,
  send,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { Action } from '../../../common/action'
import { Signer, thresholdCallToSigners } from '../../../common/combine'
import { Locals } from '../../../common/handlers'
import { IO, sendFailure } from '../../../common/io'
import { Session } from '../../../common/session'
import { getCombinerVersion, OdisConfig } from '../../../config'
import { PnpSignerResponseLogger } from '../../services/log-responses'
import { PnpThresholdStateService } from '../../services/threshold-state'

export class PnpQuotaAction implements Action<PnpQuotaRequest> {
  readonly responseLogger: PnpSignerResponseLogger = new PnpSignerResponseLogger()
  protected readonly signers: Signer[] = JSON.parse(this.config.odisServices.signers)

  constructor(
    readonly config: OdisConfig,
    readonly thresholdStateService: PnpThresholdStateService<PnpQuotaRequest>,
    readonly io: IO<PnpQuotaRequest>
  ) {}

  async perform(
    _request: Request<{}, {}, PnpQuotaRequest>,
    response: Response<OdisResponse<PnpQuotaRequest>, Locals>,
    session: Session<PnpQuotaRequest>
  ) {
    await thresholdCallToSigners(
      response.locals.logger,
      this.signers,
      this.io.signerEndpoint,
      session,
      null,
      this.config.odisServices.timeoutMilliSeconds,
      PnpQuotaResponseSchema
    )

    this.responseLogger.logResponseDiscrepancies(session)
    this.responseLogger.logFailOpenResponses(session)

    const { threshold } = session.keyVersionInfo

    if (session.responses.length >= threshold) {
      try {
        const quotaStatus = this.thresholdStateService.findCombinerQuotaState(session)
        send(
          response,
          {
            success: true,
            version: getCombinerVersion(),
            ...quotaStatus,
            warnings: session.warnings,
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
      ErrorMessage.THRESHOLD_PNP_QUOTA_STATUS_FAILURE,
      session.getMajorityErrorCode() ?? 500,
      session.response
    )
  }
}
