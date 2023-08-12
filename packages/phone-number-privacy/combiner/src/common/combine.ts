import {
  ErrorMessage,
  OdisRequest,
  OdisResponse,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Response as FetchResponse } from 'node-fetch'
import { PerformanceObserver } from 'perf_hooks'
import { OdisConfig } from '../config'
import { Action } from './action'
import { IO } from './io'
import { Session } from './session'

export interface Signer {
  url: string
  fallbackUrl?: string
}

export abstract class CombineAction<R extends OdisRequest> implements Action<R> {
  readonly signers: Signer[]
  public constructor(readonly config: OdisConfig, readonly io: IO<R>) {
    this.signers = JSON.parse(config.odisServices.signers)
  }

  abstract combine(session: Session<R>): void

  async perform(session: Session<R>) {
    // TODO (soloseng): check if request already exist in db
    await this.distribute(session)
    this.combine(session)
  }

  async distribute(session: Session<R>): Promise<void> {
    const obs = new PerformanceObserver((list) => {
      // Possible race condition here: if multiple signers take exactly the same
      // amount of time, the PerformanceObserver callback may be called twice with
      // both entries present. Node 12 doesn't allow for entries to be deleted by name,
      // and eliminating the race condition requires a more significant redesign of
      // the measurement code.
      // This is only used for monitoring purposes, so a rare
      // duplicate latency measure for the signer should have minimal impact.
      list.getEntries().forEach((entry) => {
        session.logger.info(
          { latency: entry, signer: entry.name },
          'Signer response latency measured'
        )
      })
    })
    obs.observe({ entryTypes: ['measure'], buffered: false })

    const timeout = setTimeout(() => {
      session.timedOut = true
      session.abort.abort()
    }, this.config.odisServices.timeoutMilliSeconds)

    // Forward request to signers
    // An unexpected error in handling the result for one signer should not
    // block a threshold of correct responses, but should be logged.
    await Promise.all(
      this.signers.map(async (signer) => {
        try {
          await this.forwardToSigner(signer, session)
        } catch (err) {
          session.logger.error({
            signer: signer.url,
            message: 'Unexpected error caught while distributing request to signer',
            err,
          })
        }
      })
    )
    // TODO Resolve race condition where a session can both receive a successful
    // response in time and be aborted

    clearTimeout(timeout)
    // DO NOT call performance.clearMarks() as this also deletes marks used to
    // measure e2e combiner latency.
    obs.disconnect()
  }

  protected async forwardToSigner(signer: Signer, session: Session<R>): Promise<void> {
    let signerFetchResult: FetchResponse | undefined
    try {
      signerFetchResult = await this.io.fetchSignerResponseWithFallback(signer, session)
      session.logger.info({
        message: 'Received signerFetchResult',
        signer: signer.url,
        status: signerFetchResult.status,
      })
    } catch (err) {
      session.logger.debug({ err, signer: signer.url, message: 'signer request failure' })
      if (err instanceof Error && err.name === 'AbortError' && session.abort.signal.aborted) {
        if (session.timedOut) {
          session.logger.error({ signer }, ErrorMessage.TIMEOUT_FROM_SIGNER)
        } else {
          session.logger.info({ signer }, WarningMessage.CANCELLED_REQUEST_TO_SIGNER)
        }
      } else {
        // Logging the err & message simultaneously fails to log the message in some cases
        session.logger.error({ signer }, ErrorMessage.SIGNER_REQUEST_ERROR)
        session.logger.error({ signer, err })
      }
    }
    return this.handleFetchResult(signer, session, signerFetchResult)
  }

  protected async handleFetchResult(
    signer: Signer,
    session: Session<R>,
    signerFetchResult?: FetchResponse
  ): Promise<void> {
    if (signerFetchResult?.ok) {
      try {
        // Throws if response is not actually successful
        await this.receiveSuccess(signerFetchResult, signer.url, session)
        return
      } catch (err) {
        session.logger.error(err)
      }
    }
    if (signerFetchResult) {
      session.logger.info({
        message: 'Received signerFetchResult on unsuccessful signer response',
        res: await signerFetchResult.text(),
        status: signerFetchResult.status,
        signer: signer.url,
      })
    }
    return this.addFailureToSession(signer, signerFetchResult?.status, session)
  }

  protected async receiveSuccess(
    signerFetchResult: FetchResponse,
    url: string,
    session: Session<R>
  ): Promise<OdisResponse<R>> {
    if (!signerFetchResult.ok) {
      throw new Error(`Implementation Error: receiveSuccess should only receive 'OK' responses`)
    }
    const { status } = signerFetchResult
    const data: string = await signerFetchResult.text()
    session.logger.info({ signer: url, res: data, status }, `received 'OK' response from signer`)
    const signerResponse: OdisResponse<R> = this.io.validateSignerResponse(
      data,
      url,
      session.logger
    )
    if (!signerResponse.success) {
      session.logger.error(
        { err: signerResponse.error, signer: url, status },
        `Signer request to ${url + this.io.signerEndpoint} failed with 'OK' status`
      )
      throw new Error(ErrorMessage.SIGNER_RESPONSE_FAILED_WITH_OK_STATUS)
    }
    session.logger.info({ signer: url }, `Signer request successful`)
    session.responses.push({ url, res: signerResponse, status })
    return signerResponse
  }

  private addFailureToSession(signer: Signer, errorCode: number | undefined, session: Session<R>) {
    // Tracking failed request count via signer url prevents
    // double counting the same failed request by mistake
    session.failedSigners.add(signer.url)
    session.logger.warn(
      `Received failure from ${session.failedSigners.size}/${this.signers.length} signers`
    )
    if (errorCode) {
      session.incrementErrorCodeCount(errorCode)
    }
    const { threshold } = session.keyVersionInfo
    if (this.signers.length - session.failedSigners.size < threshold) {
      session.logger.warn('Not possible to reach a threshold of signer responses. Failing fast')
      session.abort.abort()
    }
  }
}
