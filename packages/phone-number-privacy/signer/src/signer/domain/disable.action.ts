import { DisableDomainRequest, domainHash, ErrorMessage } from '@celo/phone-number-privacy-common'
import { Config } from '../../config'
import { getDatabase } from '../../database/database'
import { toSequentialDelayDomainState } from '../../database/models/domainState'
import {
  createEmptyDomainStateRecord,
  getDomainStateRecord,
  insertDomainStateRecord,
  setDomainDisabled,
} from '../../database/wrappers/domainState'
import { IAction } from '../action.interface'
import { DomainDisableIO } from './disable.io'
import { DomainSession } from './session'

export class DomainDisableAction implements IAction<DisableDomainRequest> {
  constructor(readonly config: Config, readonly io: DomainDisableIO) {}

  public async perform(session: DomainSession<DisableDomainRequest>): Promise<void> {
    const domain = session.request.body.domain
    session.logger.info('Processing request to disable domain', {
      name: domain.name,
      version: domain.version,
      hash: domainHash(domain).toString('hex'),
    })

    try {
      // Inside a database transaction, update or create the domain to mark it disabled.
      const res = await getDatabase().transaction(async (trx) => {
        const domainStateRecord =
          (await getDomainStateRecord(domain, session.logger, trx)) ??
          (await insertDomainStateRecord(createEmptyDomainStateRecord(domain), trx, session.logger))
        if (!domainStateRecord.disabled) {
          await setDomainDisabled(domain, trx, session.logger)
        }
        return {
          success: true,
          status: 200,
          // DO NOT MERGE: Does this say disabled == true or false?
          domainStateRecord, // might need to modify disabled field b4 returning here (test this)
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
