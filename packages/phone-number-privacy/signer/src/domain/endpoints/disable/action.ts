import { domainHash } from '@celo/phone-number-privacy-common'
import { Knex } from 'knex'
import { toSequentialDelayDomainState } from '../../../common/database/models/domain-state'
import {
  createEmptyDomainStateRecord,
  getDomainStateRecord,
  insertDomainStateRecord,
  setDomainDisabled,
} from '../../../common/database/wrappers/domain-state'
import { DomainDisableIO } from './io'
import { PromiseHandler } from '../../../common/handler'

export function createDomainDisableHandler(db: Knex, io: DomainDisableIO): PromiseHandler {
  return async (request, response) => {
    const { logger } = response.locals
    const { domain } = request.body
    logger.info(
      {
        name: domain.name,
        version: domain.version,
        hash: domainHash(domain).toString('hex'),
      },
      'Processing request to disable domain'
    )

    const res = await db.transaction(async (trx) => {
      const domainStateRecord =
        (await getDomainStateRecord(db, domain, logger, trx)) ??
        (await insertDomainStateRecord(db, createEmptyDomainStateRecord(domain, true), trx, logger))
      if (!domainStateRecord.disabled) {
        await setDomainDisabled(db, domain, trx, logger)
        domainStateRecord.disabled = true
      }
      return {
        success: true,
        status: 200,
        domainStateRecord,
      }
      // Note: we previously timed out inside the trx to ensure timeouts roll back DB trx
      // return timeout(disableDomainHandler, [], this.config.timeout, timeoutError)
    })
    io.sendSuccess(res.status, response, toSequentialDelayDomainState(res.domainStateRecord))
  }
}
