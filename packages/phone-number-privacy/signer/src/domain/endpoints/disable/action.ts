import { DisableDomainRequest, domainHash, ErrorMessage } from '@celo/phone-number-privacy-common'
import { Knex } from 'knex'
import { Action } from '../../../common/action'
import { toSequentialDelayDomainState } from '../../../common/database/models/domainState'
import {
  createEmptyDomainStateRecord,
  getDomainStateRecord,
  insertDomainStateRecord,
  setDomainDisabled,
} from '../../../common/database/wrappers/domainState'
import { SignerConfig } from '../../../config'
import { DomainSession } from '../../session'
import { DomainDisableIO } from './io'

export class DomainDisableAction implements Action<DisableDomainRequest> {
  constructor(readonly db: Knex, readonly config: SignerConfig, readonly io: DomainDisableIO) {}

  public async perform(session: DomainSession<DisableDomainRequest>): Promise<void> {
    const domain = session.request.body.domain
    session.logger.info('Processing request to disable domain', {
      name: domain.name,
      version: domain.version,
      hash: domainHash(domain).toString('hex'),
    })

    try {
      // Inside a database transaction, update or create the domain to mark it disabled.
      const res = await this.db.transaction(async (trx) => {
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
      })

      this.io.sendSuccess(
        res.status,
        session.response,
        toSequentialDelayDomainState(res.domainStateRecord)
      )
    } catch (error) {
      session.logger.error('Error while disabling domain', error)
      this.io.sendFailure(ErrorMessage.DATABASE_UPDATE_FAILURE, 500, session.response)
    }
  }
}
