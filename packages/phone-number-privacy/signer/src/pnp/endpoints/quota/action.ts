import { timeout } from '@celo/base'
import {
  ErrorMessage,
  ErrorType,
  LegacyPnpQuotaRequest,
  PnpQuotaRequest,
  PnpQuotaStatus,
} from '@celo/phone-number-privacy-common'
import { Action } from '../../../common/action'
import { SignerConfig } from '../../../config'
import { PnpQuotaService } from '../../services/quota'
import { PnpSession } from '../../session'
import { PnpQuotaIO } from './io'
import { LegacyPnpQuotaIO } from './io.legacy'

type PnpQuotaHandleResult =
  | {
      success: false
      status: number
      quotaStatus: PnpQuotaStatus
      error: ErrorType
    }
  | {
      success: true
      status: number
      quotaStatus: PnpQuotaStatus
    }
export class PnpQuotaAction implements Action<PnpQuotaRequest | LegacyPnpQuotaRequest> {
  constructor(
    readonly config: SignerConfig,
    readonly quota: PnpQuotaService,
    readonly io: PnpQuotaIO | LegacyPnpQuotaIO
  ) {}

  public async perform(
    session: PnpSession<PnpQuotaRequest | LegacyPnpQuotaRequest>
  ): Promise<void> {
    // TODO EN: try to surround the quotaStatus result with the timeout logic  (not the entire function, to avoid sending failure within)

    const pnpQuotaHandler = async (): Promise<PnpQuotaHandleResult> => {
      const quotaStatus = await this.quota.getQuotaStatus(session)

      if (quotaStatus.performedQueryCount > -1 && quotaStatus.totalQuota > -1) {
        return {
          success: true,
          status: 200,
          quotaStatus,
        }
        // this.io.sendSuccess(200, session.response, quotaStatus, session.errors)
        // return
      }
      return {
        success: false,
        status: 500,
        quotaStatus,
        error:
          quotaStatus.performedQueryCount === -1
            ? ErrorMessage.FAILURE_TO_GET_PERFORMED_QUERY_COUNT
            : ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA,
      }
      // this.io.sendFailure(
      //   quotaStatus.performedQueryCount === -1
      //     ? ErrorMessage.FAILURE_TO_GET_PERFORMED_QUERY_COUNT
      //     : ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA,
      //   500,
      //   session.response
      // )
    }
    const timeoutRes = Symbol()
    try {
      const res = await timeout(pnpQuotaHandler, [], this.config.timeout, timeoutRes)
      if (res.success) {
        this.io.sendSuccess(res.status, session.response, res.quotaStatus, session.errors)
        return
      }
      this.io.sendFailure(res.error, res.status, session.response)
    } catch (error) {
      // TODO EN: move this try catch to the controller instead of the action class if possible
      if (error === timeoutRes) {
        this.io.sendFailure(ErrorMessage.TIMEOUT_FROM_SIGNER, 500, session.response)
        return
      }
      // TODO EN TEMPORARY, move to controller
      throw error
    }

    // if (quotaStatus.performedQueryCount > -1 && quotaStatus.totalQuota > -1) {
    //   this.io.sendSuccess(200, session.response, quotaStatus, session.errors)
    //   return
    // }
    // this.io.sendFailure(
    //   quotaStatus.performedQueryCount === -1
    //     ? ErrorMessage.FAILURE_TO_GET_PERFORMED_QUERY_COUNT
    //     : ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA,
    //   500,
    //   session.response
    // )
  }
}
