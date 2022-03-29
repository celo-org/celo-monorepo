import {
  domainHash,
  DomainRestrictedSignatureRequest,
  ErrorMessage,
  ErrorType,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { EIP712Optional } from '@celo/utils/lib/sign-typed-data-utils'
import { Config } from '../../config'
import { getDatabase } from '../../database/database'
import { DomainStateRecord } from '../../database/models/domainState'
import { DefaultKeyName, Key } from '../../key-management/key-provider-base'
import { SignAbstract } from '../sign.abstract'
import { DomainQuotaService } from './quota.service'
import { DomainSession } from './session'
import { DomainSignIO } from './sign.io'

// TODO(Alec): find a cleaner way to do this
type TrxResult =
  | {
      success: false
      status: number
      domainStateRecord: DomainStateRecord
      error: ErrorType
    }
  | {
      success: true
      status: number
      domainStateRecord: DomainStateRecord
      key: Key
      signature: string
    }

export class DomainSignAction extends SignAbstract<DomainRestrictedSignatureRequest> {
  constructor(
    readonly config: Config,
    readonly quota: DomainQuotaService,
    readonly io: DomainSignIO
  ) {
    super()
  }

  public async perform(session: DomainSession<DomainRestrictedSignatureRequest>): Promise<void> {
    const domain = session.request.body.domain
    session.logger.info('Processing request to get domain signature ', {
      name: domain.name,
      version: domain.version,
      hash: domainHash(domain).toString('hex'),
    })

    try {
      const res: TrxResult = await getDatabase().transaction(async (trx) => {
        // Get the current domain state record, or use an empty record if one does not exist.
        const domainStateRecord = await this.quota.getQuotaStatus(session, trx)

        // Note that this action occurs in the same transaction as the remainder of the siging
        // action. As a result, this is included here rather than in the authentication function.
        if (!this.nonceCheck(domainStateRecord, session)) {
          return {
            success: false,
            status: 401,
            domainStateRecord,
            error: WarningMessage.INVALID_NONCE,
          }
        }

        const quotaStatus = await this.quota.checkAndUpdateQuotaStatus(
          domainStateRecord,
          session,
          trx
        )

        if (!quotaStatus.sufficient) {
          session.logger.warn(`Exceeded quota`, {
            name: domain.name,
            version: domain.version,
            hash: domainHash(domain),
          })
          return {
            success: false,
            status: 429,
            domainStateRecord: quotaStatus.state,
            error: WarningMessage.EXCEEDED_QUOTA,
          }
        }

        const key: Key = {
          version:
            this.io.getRequestKeyVersion(session.request, session.logger) ??
            this.config.keystore.keys.domains.latest,
          name: DefaultKeyName.DOMAINS,
        }

        // Compute signature inside transaction so it will rollback on error.
        const signature = await this.sign(session.request.body.blindedMessage, key, session)

        return {
          success: true,
          status: 200,
          domainStateRecord: quotaStatus.state,
          key,
          signature,
        }
      })

      if (res.success) {
        this.io.sendSuccess(
          res.status,
          session.response,
          res.key,
          res.signature,
          res.domainStateRecord.toSequentialDelayDomainState()
        )
      } else {
        this.io.sendFailure(res.error, res.status, session.response)
      }
    } catch (error) {
      session.logger.error('Failed to get signature for a domain', error)
      this.io.sendFailure(ErrorMessage.DATABASE_UPDATE_FAILURE, 500, session.response)
    }
  }

  nonceCheck(
    domainStateRecord: DomainStateRecord,
    session: DomainSession<DomainRestrictedSignatureRequest>
  ): boolean {
    const nonce: EIP712Optional<number> = session.request.body.options.nonce
    if (!nonce.defined) {
      session.logger.info('Nonce is undefined')
      return false
    }
    return nonce.value >= domainStateRecord.counter
  }
}
