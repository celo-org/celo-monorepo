import {
  domainHash,
  send,
  verifyDisableDomainRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Knex } from 'knex'
import { toSequentialDelayDomainState } from '../../../common/database/models/domain-state'
import {
  createEmptyDomainStateRecord,
  getDomainStateRecord,
  insertDomainStateRecord,
  setDomainDisabled,
} from '../../../common/database/wrappers/domain-state'
import { PromiseHandler, sendFailure } from '../../../common/handler'
import { Counters } from '../../../common/metrics'
import { getSignerVersion } from '../../../config'
import { DomainDisableIO } from './io'

export function createDomainDisableHandler(db: Knex, io: DomainDisableIO): PromiseHandler {
  return async (request, response) => {
    if (!io.init(request, response)) {
      return
    }

    if (!verifyDisableDomainRequestAuthenticity(request.body)) {
      sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return
    }

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

    send(
      response,
      {
        success: true,
        version: getSignerVersion(),
        status: toSequentialDelayDomainState(res.domainStateRecord),
      },
      res.status,
      response.locals.logger
    )
    Counters.responses.labels(request.url, res.status.toString()).inc()
  }
}
