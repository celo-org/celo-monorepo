import { PnpQuotaRequest } from '@celo/phone-number-privacy-common'
import { Config } from '../../config'
import { IAction } from '../action.interface'
import { PnpQuotaIO } from './quota.io'
import { PnpQuotaService } from './quota.service'
import { PnpSession } from './session'

export class PnpQuotaAction implements IAction<PnpQuotaRequest> {
  constructor(readonly config: Config, readonly quota: PnpQuotaService, readonly io: PnpQuotaIO) {}

  public async perform(session: PnpSession<PnpQuotaRequest>): Promise<void> {
    const { queryCount, totalQuota, blockNumber } = await this.quota.getQuotaStatus(session)
    this.io.sendSuccess(200, session.response, queryCount, totalQuota, blockNumber, session.errors)
  }
}
