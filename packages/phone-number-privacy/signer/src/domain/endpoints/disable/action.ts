import {
  DisableDomainRequest,
  disableDomainRequestSchema,
  domainHash,
  DomainSchema,
  verifyDisableDomainRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request } from 'express'
import { Knex } from 'knex'
import { toSequentialDelayDomainState } from '../../../common/database/models/domain-state'
import {
  createEmptyDomainStateRecord,
  getDomainStateRecord,
  insertDomainStateRecord,
  setDomainDisabled,
} from '../../../common/database/wrappers/domain-state'
import { errorResult, ResultHandler } from '../../../common/handler'
import { getSignerVersion } from '../../../config'

export function domainDisable(db: Knex): ResultHandler<DisableDomainRequest> {
  return async (request, response) => {
    const { logger } = response.locals

    if (!isValidRequest(request)) {
      return errorResult(400, WarningMessage.INVALID_INPUT)
    }
    if (!verifyDisableDomainRequestAuthenticity(request.body)) {
      return errorResult(401, WarningMessage.UNAUTHENTICATED_USER)
    }

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
        // TODO revisit this
        success: true,
        status: 200,
        domainStateRecord,
      }
      // Note: we previously timed out inside the trx to ensure timeouts roll back DB trx
      // return timeout(disableDomainHandler, [], this.config.timeout, timeoutError)
    })

    return {
      status: res.status,
      body: {
        success: true,
        version: getSignerVersion(),
        status: toSequentialDelayDomainState(res.domainStateRecord),
      },
    }
  }
}

function isValidRequest(
  request: Request<{}, {}, unknown>
): request is Request<{}, {}, DisableDomainRequest> {
  return disableDomainRequestSchema(DomainSchema).is(request.body)
}
