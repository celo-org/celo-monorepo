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

    // TODO(Alec): how do we want to represent errors here?

    this.io.sendSuccess(200, session.response, queryCount, totalQuota, blockNumber)

    // TODO(Alec): Make sure we're not forgetting to log correctly elsewhere
    // catch (err) {
    //   logger.error('Failed to get user quota')
    //   logger.error(err)
    //   sendFailureResponse(response, ErrorMessage.DATABASE_GET_FAILURE, 500, endpoint, logger)
    // }
  }
}
