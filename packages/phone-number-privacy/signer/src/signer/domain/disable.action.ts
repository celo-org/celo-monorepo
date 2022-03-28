import {
  DisableDomainRequest,
  domainHash,
  ErrorMessage,
  getCombinerEndpoint,
  SignerEndpoint,
} from '@celo/phone-number-privacy-common'
import { Config } from '../../config'
import { getDatabase } from '../../database/database'
import {
  createEmptyDomainStateRecord,
  getDomainStateRecord,
  insertDomainStateRecord,
  setDomainDisabled,
} from '../../database/wrappers/domainState'
import { IActionService } from '../action.interface'
import { DomainDisableIO } from './disable.io'
import { DomainSession } from './session'

export class DomainDisableAction implements IActionService<DisableDomainRequest> {
  readonly endpoint = SignerEndpoint.DISABLE_DOMAIN
  readonly combinerEndpoint = getCombinerEndpoint(this.endpoint)

  constructor(readonly config: Config, readonly io: DomainDisableIO) {}

  public async perform(session: DomainSession<DisableDomainRequest>): Promise<void> {
    // TODO(Alec): factor this beginning part out
    const domain = session.request.body.domain
    session.logger.info('Processing request to disable domain', {
      name: domain.name,
      version: domain.version,
      hash: domainHash(domain),
    })

    try {
      // Inside a database transaction, update or create the domain to mark it disabled.
      await getDatabase().transaction(async (trx) => {
        const domainStateRecord =
          (await getDomainStateRecord(domain, session.logger, trx)) ??
          (await insertDomainStateRecord(createEmptyDomainStateRecord(domain), trx, session.logger))
        if (!domainStateRecord.disabled) {
          await setDomainDisabled(domain, trx, session.logger)
        }
        this.io.sendSuccess(200, session.response, domainStateRecord.toSequentialDelayDomainState())
      })
    } catch (error) {
      session.logger.error('Error while disabling domain', error)
      this.io.sendFailure(ErrorMessage.DATABASE_UPDATE_FAILURE, 500, session.response)
    }
  }
}
