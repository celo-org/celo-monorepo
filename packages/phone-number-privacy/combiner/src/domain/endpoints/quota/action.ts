import {
  DomainQuotaStatusRequest,
  ErrorMessage,
  MAX_TIMESTAMP_DISCREPANCY_THRESHOLD,
  SequentialDelayDomainState,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { CombineAction } from '../../../common/combine'
import { IO } from '../../../common/io'
import { Session } from '../../../common/session'
import { OdisConfig } from '../../../config'
import { DomainThresholdStateService } from '../../services/thresholdState'

export class DomainQuotaAction extends CombineAction<DomainQuotaStatusRequest> {
  constructor(
    readonly config: OdisConfig,
    readonly thresholdStateService: DomainThresholdStateService<DomainQuotaStatusRequest>,
    readonly io: IO<DomainQuotaStatusRequest>
  ) {
    super(config, io)
  }

  combine(session: Session<DomainQuotaStatusRequest>): void {
    if (session.responses.length >= this.config.keys.threshold) {
      try {
        const domainQuotaStatus = this.thresholdStateService.findThresholdDomainState(session)
        this.io.sendSuccess(200, session.response, domainQuotaStatus)
        return
      } catch (error) {
        session.logger.error({ error }, 'Error combining signer quota status responses')
      }
    }
    this.io.sendFailure(
      ErrorMessage.THRESHOLD_DOMAIN_QUOTA_STATUS_FAILURE,
      session.getMajorityErrorCode() ?? 500,
      session.response,
      session.logger
    )
  }

  protected logResponseDiscrepancies(session: Session<DomainQuotaStatusRequest>): void {
    // only use responses that have the domain state
    const statuses = session.responses
      .map((res) => res.res.success && res.res.status)
      .filter((res) => res) as SequentialDelayDomainState[]

    const numDisabled = statuses.filter((ds) => ds.disabled).length
    if (numDisabled > 0 && numDisabled < statuses.length) {
      session.logger.error(WarningMessage.INCONSISTENT_SIGNER_DOMAIN_DISABLED_STATES)
      return
    }

    if (statuses.length === 0) {
      return
    }
    const expectedStatus = statuses[0]
    const values = session.responses.map(
      (response) =>
        response.res.success &&
        response.res.status && {
          signer: response.url,
          status: response.res.status,
        }
    )
    statuses.forEach((status) => {
      if (Math.abs(status.now - expectedStatus.now) > MAX_TIMESTAMP_DISCREPANCY_THRESHOLD) {
        session.logger.warn({ values }, 'Inconsistent signer domain server timestamps')
        return
      }
    })
    session.logger.debug({ values }, 'Sequential Delay domain state')
  }
}
