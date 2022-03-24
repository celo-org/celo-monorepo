import {
  DisableDomainRequest,
  disableDomainRequestSchema,
  DisableDomainResponseFailure,
  domainHash,
  DomainRestrictedSignatureResponseSuccess,
  DomainSchema,
  DomainState,
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
import { DomainStateRecord } from '../../database/models/domainState'
import {
  getDomainStateWithLock,
  insertDomainState,
  setDomainDisabled,
} from '../../database/wrappers/domainState'
import { Session } from '../session'
import { Signer } from '../signer'

export class DomainDisable extends Signer<DisableDomainRequest> {
  readonly endpoint = SignerEndpoint.DISABLE_DOMAIN
  readonly combinerEndpoint = getCombinerEndpoint(this.endpoint)

  protected async _handle(session: Session<DisableDomainRequest>): Promise<void> {
    const domain = session.request.body.domain
    // TODO(Alec): logging
    session.logger.info('Processing request to disable domain', {
      name: domain.name,
      version: domain.version,
      hash: domainHash(domain),
    })
    try {
      // Inside a database transaction, update or create the domain to mark it disabled.
      await getDatabase().transaction(async (trx) => {
        const domainState = await getDomainStateWithLock(domain, trx, session.logger)
        if (!domainState) {
          // If the domain is not currently recorded in the state database, add it now.
          await insertDomainState(
            DomainStateRecord.createEmptyDomainState(domain),
            trx,
            session.logger
          )
        }
        if (!(domainState?.disabled ?? false)) {
          await setDomainDisabled(domain, trx, session.logger)
        }
      })

      session.response.status(200).send({ success: true, version: getVersion() })
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
    response: Response<DomainRestrictedSignatureResponseSuccess>,
    signature: string,
    domainState: DomainState,
    session: Session<DisableDomainRequest>
  ) {
    send(
      response,
      {
        success: true,
        version: getVersion(),
        signature,
        status: domainState,
      },
      status,
      session.logger
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
