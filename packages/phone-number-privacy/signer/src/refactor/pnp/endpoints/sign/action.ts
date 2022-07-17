import { SignMessageRequest } from '@celo/identity/lib/odis/query'
import { WarningMessage } from '@celo/phone-number-privacy-common'
import { computeBlindedSignature } from '../../../../bls/bls-cryptography-client'
import { Counters } from '../../../../common/metrics'
import { Config } from '../../../../config'
import { getDatabase } from '../../../../database/database'
import { getRequestExists } from '../../../../database/wrappers/request'
import { getKeyProvider } from '../../../../key-management/key-provider'
import { DefaultKeyName, Key } from '../../../../key-management/key-provider-base'
import { IAction, Session } from '../../../base/action'
import { PnpQuotaService } from '../../services/calculateQuota'
import { PnpSession } from '../../session'
import { PnpSignIO } from './io'

export class PnpSignAction implements IAction<SignMessageRequest> {
  constructor(readonly config: Config, readonly quota: PnpQuotaService, readonly io: PnpSignIO) {}

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
          // If queryCount or totalQuota are undefined,
          // we fail open and service the request to not block the user.
          // Error messages are stored in the session and included along
          // with the signature in the response.
          session.logger.error(
            'Error fetching PNP quota in servicing a signing request: failing open.'
          )
          Counters.requestsFailingOpen.inc()
        }
      }

      const key: Key = {
        version:
          this.io.getRequestKeyVersion(session.request, session.logger) ??
          this.config.keystore.keys.phoneNumberPrivacy.latest,
        name: DefaultKeyName.PHONE_NUMBER_PRIVACY,
      }

      // Compute signature inside transaction so it will rollback on error.
      const signature = await this.sign(session.request.body.blindedQueryPhoneNumber, key, session)

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

  private async sign(
    blindedMessage: string,
    key: Key,
    session: Session<SignMessageRequest>
  ): Promise<string> {
    let privateKey: string
    try {
      privateKey = await getKeyProvider().getPrivateKeyOrFetchFromStore(key)
    } catch (err) {
      session.logger.error({ key }, 'Requested key version not supported')
      throw err
    }
    return computeBlindedSignature(blindedMessage, privateKey, session.logger)
  }
}
