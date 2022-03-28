import { SignMessageRequest } from '@celo/identity/lib/odis/query'
import { WarningMessage } from '@celo/phone-number-privacy-common'
import { Counters } from '../../common/metrics'
import { Config } from '../../config'
import { getDatabase } from '../../database/database'
import { getRequestExists } from '../../database/wrappers/request'
import { DefaultKeyName, Key } from '../../key-management/key-provider-base'
import { SignAbstract } from '../sign.abstract'
import { PnpQuotaService } from './quota.service'
import { PnpSession } from './session'
import { PnpSignIO } from './sign.io'

export class PnpSignAction extends SignAbstract<SignMessageRequest> {
  constructor(readonly config: Config, readonly quota: PnpQuotaService, readonly io: PnpSignIO) {
    super()
  }

  public async perform(session: PnpSession<SignMessageRequest>): Promise<void> {
    await getDatabase().transaction(async (trx) => {
      let queryCount, totalQuota, blockNumber
      if (await getRequestExists(session.request.body, session.logger, trx)) {
        Counters.duplicateRequests.inc()
        session.logger.debug(
          'Request already exists in db. Will service request without charging quota.'
        )
        session.errors.push(WarningMessage.DUPLICATE_REQUEST_TO_GET_PARTIAL_SIG)
      } else {
        const quotaStatus = await this.quota.getQuotaStatus(session, trx)
        queryCount = quotaStatus.queryCount
        totalQuota = quotaStatus.totalQuota
        blockNumber = quotaStatus.blockNumber
        // In the case of a blockchain connection failure, totalQuota and/or blockNumber
        // may be undefined.
        // In the case of a database connection failure, queryCount
        // may be undefined.
        if (quotaStatus.queryCount && quotaStatus.totalQuota) {
          const { sufficient, state } = await this.quota.checkAndUpdateQuotaStatus(
            quotaStatus,
            session,
            trx
          )
          if (!sufficient) {
            this.io.sendFailure(
              WarningMessage.EXCEEDED_QUOTA,
              403,
              session.response,
              queryCount,
              totalQuota,
              blockNumber
            )
            return
          }
          queryCount = state.queryCount
        } else {
          Counters.requestsFailingOpen.inc()
        }
      }

      const defaultKey: Key = {
        version: this.config.keystore.keys.phoneNumberPrivacy.latest,
        name: DefaultKeyName.PHONE_NUMBER_PRIVACY,
      }

      // If queryCount or totalQuota are undefined,
      // we fail open and service the request to not block the user.
      // Error messages are stored in the session and included along
      // with the signature in the response.
      const { signature, key } = await this.sign(
        session.request.body.blindedQueryPhoneNumber,
        defaultKey,
        session
      )
      this.io.sendSuccess(
        200,
        session.response,
        key,
        signature,
        queryCount,
        totalQuota,
        blockNumber,
        session.errors
      )
    })
  }
}
