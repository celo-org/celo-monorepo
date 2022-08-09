import { PnpQuotaRequest } from '@celo/phone-number-privacy-common'
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
    const { queryCount, totalQuota, blockNumber } = await this.quota.getQuotaStatus(session)
    this.io.sendSuccess(200, session.response, queryCount, totalQuota, blockNumber, session.errors)
  }
}
