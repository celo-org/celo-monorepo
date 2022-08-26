import { SignMessageRequest, WarningMessage } from '@celo/phone-number-privacy-common'
import { Knex } from 'knex'
import { Action, Session } from '../../../common/action'
import { computeBlindedSignature } from '../../../common/bls/bls-cryptography-client'
import { getRequestExists } from '../../../common/database/wrappers/request'
import { DefaultKeyName, Key, KeyProvider } from '../../../common/key-management/key-provider-base'
import { Counters } from '../../../common/metrics'
import { SignerConfig } from '../../../config'
import { PnpQuotaService } from '../../services/quota'
import { PnpSession } from '../../session'
import { PnpSignIO } from './io'
import { LegacyPnpSignIO } from './io.legacy'

export class PnpSignAction implements Action<SignMessageRequest> {
  constructor(
    readonly db: Knex,
    readonly config: SignerConfig,
    readonly quota: PnpQuotaService,
    readonly keyProvider: KeyProvider,
    readonly io: PnpSignIO | LegacyPnpSignIO
  ) {}

  public async perform(session: PnpSession<SignMessageRequest>): Promise<void> {
    await this.db.transaction(async (trx) => {
      let queryCount, totalQuota, blockNumber
      if (await getRequestExists(this.db, session.request.body, session.logger, trx)) {
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
        // Note that queryCount or totalQuota can be 0 and that should not fail open.
        if (quotaStatus.queryCount !== undefined && quotaStatus.totalQuota !== undefined) {
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
      privateKey = await this.keyProvider.getPrivateKeyOrFetchFromStore(key)
    } catch (err) {
      session.logger.error({ key }, 'Requested key version not supported')
      throw err
    }
    return computeBlindedSignature(blindedMessage, privateKey, session.logger)
  }
}
