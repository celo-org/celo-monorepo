import { timeout } from '@celo/base'
import { DisableDomainRequest, domainHash, ErrorMessage } from '@celo/phone-number-privacy-common'
import { Knex } from 'knex'
import { Action } from '../../../common/action'
import { toSequentialDelayDomainState } from '../../../common/database/models/domain-state'
import {
  createEmptyDomainStateRecord,
  getDomainStateRecord,
  insertDomainStateRecord,
  setDomainDisabled,
} from '../../../common/database/wrappers/domain-state'
import { SignerConfig } from '../../../config'
import { DomainSession } from '../../session'
import { DomainDisableIO } from './io'

export class DomainDisableAction implements Action<DisableDomainRequest> {
  constructor(readonly db: Knex, readonly config: SignerConfig, readonly io: DomainDisableIO) {}

  public async perform(session: DomainSession<DisableDomainRequest>): Promise<void> {
    const domain = session.request.body.domain
    session.logger.info(
      {
        name: domain.name,
        version: domain.version,
        hash: domainHash(domain).toString('hex'),
      },
      'Processing request to disable domain'
    )
    const timeoutRes = Symbol()
    try {
      // Inside a database transaction, update or create the domain to mark it disabled.
      const res = await this.db.transaction(async (trx) => {
        const disableDomainHandler = async () => {
          const domainStateRecord =
            (await getDomainStateRecord(this.db, domain, session.logger, trx)) ??
            (await insertDomainStateRecord(
              this.db,
              createEmptyDomainStateRecord(domain, true),
              trx,
              session.logger
            ))
          if (!domainStateRecord.disabled) {
            await setDomainDisabled(this.db, domain, trx, session.logger)
            domainStateRecord.disabled = true
          }
          return {
            success: true,
            status: 200,
            domainStateRecord,
          }
        }
        return await timeout(disableDomainHandler, [], this.config.timeout, timeoutRes)
      })

      this.io.sendSuccess(
        res.status,
        session.response,
        toSequentialDelayDomainState(res.domainStateRecord)
      )
    } catch (error) {
      // TODO EN: try to move this into outer controller class
      if (error === timeoutRes) {
        this.io.sendFailure(ErrorMessage.TIMEOUT_FROM_SIGNER, 500, session.response)
        return
      }
      session.logger.error(error, 'Error while disabling domain')
      this.io.sendFailure(ErrorMessage.DATABASE_UPDATE_FAILURE, 500, session.response)
    }
  }
}
