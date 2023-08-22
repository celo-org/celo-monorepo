import {
  CombinerEndpoint,
  DomainQuotaStatusRequest,
  domainQuotaStatusRequestSchema,
  domainQuotaStatusResponseSchema,
  DomainSchema,
  ErrorMessage,
  send,
  SequentialDelayDomainStateSchema,
  verifyDisableDomainRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Signer, thresholdCallToSigners } from '../../../common/combine'
import { PromiseHandler } from '../../../common/handlers'
import { getKeyVersionInfo, sendFailure } from '../../../common/io'
import { Session } from '../../../common/session'
import { getCombinerVersion, OdisConfig } from '../../../config'
import { DomainSignerResponseLogger } from '../../services/log-responses'
import { DomainThresholdStateService } from '../../services/threshold-state'

export function createDomainQuotaHandler(
  signers: Signer[],
  config: OdisConfig,
  thresholdStateService: DomainThresholdStateService<DomainQuotaStatusRequest>
): PromiseHandler<DomainQuotaStatusRequest> {
  const requestSchema = domainQuotaStatusRequestSchema(DomainSchema)
  const responseLogger: DomainSignerResponseLogger = new DomainSignerResponseLogger()
  const signerEndpoint = CombinerEndpoint.DOMAIN_QUOTA_STATUS
  return async (request, response) => {
    if (!requestSchema.is(request.body)) {
      sendFailure(WarningMessage.INVALID_INPUT, 400, response)
      return
    }

    if (!verifyDisableDomainRequestAuthenticity(request.body)) {
      sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return
    }

    const keyVersionInfo = getKeyVersionInfo(request, config, response.locals.logger)
    const session = new Session(response, keyVersionInfo)

    await thresholdCallToSigners(
      response.locals.logger,
      signers,
      signerEndpoint,
      request,
      session.keyVersionInfo,
      null,
      config.odisServices.timeoutMilliSeconds,
      domainQuotaStatusResponseSchema(SequentialDelayDomainStateSchema)
    )

    responseLogger.logResponseDiscrepancies(session)
    const { threshold } = session.keyVersionInfo
    if (session.responses.length >= threshold) {
      try {
        const domainQuotaStatus = thresholdStateService.findThresholdDomainState(session)
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
        response.locals.logger.error(err, 'Error combining signer quota status responses')
      }
    }
    sendFailure(
      ErrorMessage.THRESHOLD_DOMAIN_QUOTA_STATUS_FAILURE,
      session.getMajorityErrorCode() ?? 500,
      response
    )
  }
}
