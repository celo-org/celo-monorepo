import { ErrorMessage, PnpQuotaRequest } from '@celo/phone-number-privacy-common'
import { Action } from '../../../common/action'
import { SignerConfig } from '../../../config'
import { PnpQuotaService } from '../../services/quota'
import { PnpSession } from '../../session'
import { PnpQuotaIO } from './io'

export class PnpQuotaAction implements Action<PnpQuotaRequest> {
  constructor(
    readonly config: SignerConfig,
    readonly quota: PnpQuotaService,
    readonly io: PnpQuotaIO
  ) {}

  public async perform(session: PnpSession<PnpQuotaRequest>): Promise<void> {
    const quotaStatus = await this.quota.getQuotaStatus(session)

    if (quotaStatus.performedQueryCount > -1 && quotaStatus.totalQuota > -1) {
      this.io.sendSuccess(200, session.response, session.errors, quotaStatus)
      return
    }
    this.io.sendFailure(
      quotaStatus.performedQueryCount === -1
        ? ErrorMessage.FAILURE_TO_GET_PERFORMED_QUERY_COUNT
        : ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA,
      500,
      session.response
    )
  }
}
