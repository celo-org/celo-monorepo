import {
  ErrorMessage,
  LegacyPnpQuotaRequest,
  PnpQuotaRequest,
} from '@celo/phone-number-privacy-common'
import { Action } from '../../../common/action'
import { SignerConfig } from '../../../config'
import { PnpQuotaService } from '../../services/quota'
import { PnpSession } from '../../session'
import { PnpQuotaIO } from './io'
import { LegacyPnpQuotaIO } from './io.legacy'

export class PnpQuotaAction implements Action<PnpQuotaRequest | LegacyPnpQuotaRequest> {
  constructor(
    readonly config: SignerConfig,
    readonly quota: PnpQuotaService,
    readonly io: PnpQuotaIO | LegacyPnpQuotaIO
  ) {}

  public async perform(
    session: PnpSession<PnpQuotaRequest | LegacyPnpQuotaRequest>
  ): Promise<void> {
    const quotaStatus = await this.quota.getQuotaStatus(session)

    if (quotaStatus.performedQueryCount > -1 && quotaStatus.totalQuota > -1) {
      this.io.sendSuccess(200, session.response, quotaStatus, session.errors)
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
