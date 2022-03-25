import {
  DisableDomainRequest,
  disableDomainRequestSchema,
  DisableDomainResponseFailure,
  DisableDomainResponseSuccess,
  domainHash,
  DomainSchema,
  ErrorMessage,
  ErrorType,
  getCombinerEndpoint,
  send,
  SignerEndpoint,
  verifyDisableDomainRequestAuthenticity,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { Counters } from '../../common/metrics'
import { getVersion } from '../../config'
import { getDatabase } from '../../database/database'
import {
  createEmptyDomainStateRecord,
  getDomainStateRecordWithLock,
  insertDomainStateRecord,
  setDomainDisabled,
} from '../../database/wrappers/domainState'
import { Session } from '../session'
import { Signer } from '../signer'

export class DomainDisable extends Signer<DisableDomainRequest> {
  readonly endpoint = SignerEndpoint.DISABLE_DOMAIN
  readonly combinerEndpoint = getCombinerEndpoint(this.endpoint)

  protected async _handle(session: Session<DisableDomainRequest>): Promise<void> {
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
          (await getDomainStateRecordWithLock(domain, trx, session.logger)) ??
          (await insertDomainStateRecord(createEmptyDomainStateRecord(domain), trx, session.logger))
        if (!domainStateRecord.disabled) {
          await setDomainDisabled(domain, trx, session.logger)
        }
      })
      this.sendSuccess(200, session.response, session.logger)
    } catch (error) {
      session.logger.error('Error while disabling domain', error)
      this.sendFailure(ErrorMessage.DATABASE_UPDATE_FAILURE, 500, session.response, session.logger)
    }
  }

  protected validate(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, DisableDomainRequest> {
    return disableDomainRequestSchema(DomainSchema).is(request.body)
  }

  protected authenticate(request: Request<{}, {}, DisableDomainRequest>): Promise<boolean> {
    return Promise.resolve(verifyDisableDomainRequestAuthenticity(request.body))
  }

  protected sendSuccess(
    status: number,
    response: Response<DisableDomainResponseSuccess>,
    logger: Logger
  ) {
    send(
      response,
      {
        success: true,
        version: getVersion(),
      },
      status,
      logger
    )
    // TODO(Alec): Is there a way to not have to repeat this so many times?
    Counters.responses.labels(this.endpoint, status.toString()).inc()
  }

  protected sendFailure(
    error: ErrorType,
    status: number,
    response: Response<DisableDomainResponseFailure>,
    logger: Logger
  ) {
    send(
      response,
      {
        success: false,
        version: getVersion(),
        error,
      },
      status,
      logger
    )
    Counters.responses.labels(this.endpoint, status.toString()).inc()
  }

  protected checkRequestKeyVersion(_request: Request<{}, {}, DisableDomainRequest>): boolean {
    return true
  }
}
