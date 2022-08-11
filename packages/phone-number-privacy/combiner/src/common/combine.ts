import {
  ErrorMessage,
  OdisRequest,
  OdisResponse,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Response as FetchResponse } from 'node-fetch'
import { performance, PerformanceObserver } from 'perf_hooks'
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

  abstract combine(session: Session<R>): Promise<void>

  async perform(session: Session<R>) {
    await this.distribute(session)
    await this.combine(session)
  }

  async distribute(session: Session<R>): Promise<Session<R>> {
    // TODO: Factor out this metering code
    const obs = new PerformanceObserver((list) => {
      const entry = list.getEntries()[0]
      session.logger.info(
        { latency: entry, signer: entry!.name },
        'Signer response latency measured'
      )
    })
    obs.observe({ entryTypes: ['measure'], buffered: true })

    const timeout = setTimeout(() => {
      session.timedOut = true
      session.abort.abort()
    }, this.config.odisServices.timeoutMilliSeconds)

    // Forward request to signers
    await Promise.all(this.signers.map((signer) => this.forwardToSigner(signer, session)))

    clearTimeout(timeout)

    performance.clearMarks()
    obs.disconnect()

    return session
  }

  protected async forwardToSigner(signer: Signer, session: Session<R>): Promise<void> {
    let signerFetchResult: FetchResponse | undefined
    try {
      signerFetchResult = await this.io.fetchSignerResponseWithFallback(signer, session)
    } catch (err) {
      session.logger.debug({ err }, 'signer request failure')
      if (err instanceof Error && err.name === 'AbortError' && session.abort.signal.aborted) {
        if (session.timedOut) {
          session.logger.error({ signer }, ErrorMessage.TIMEOUT_FROM_SIGNER)
        } else {
          session.logger.info({ signer }, WarningMessage.CANCELLED_REQUEST_TO_SIGNER)
        }
      } else {
        session.logger.error({ signer, err }, ErrorMessage.SIGNER_REQUEST_ERROR)
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
    return this.addFailureToSession(signer, signerFetchResult?.status ?? 502, session)
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
    const signerResponse: OdisResponse<R> = this.io.validateSignerResponse(data, url, session)
    if (!signerResponse.success) {
      session.logger.error(
        { error: signerResponse.error, signer: url, status },
        `Signer request to ${url + this.io.signerEndpoint} failed with 'OK' status`
      )
      throw new Error(ErrorMessage.SIGNER_RESPONSE_FAILED_WITH_OK_STATUS)
    }
    session.logger.info({ signer: url }, `Signer request successful`)
    session.responses.push({ url, res: signerResponse, status })
    return signerResponse
  }

  private addFailureToSession(signer: Signer, errorCode: number | undefined, session: Session<R>) {
    session.logger.info(
      `Received failure from ${session.failedSigners.size}/${this.signers.length} signers`
    )
    // Tracking failed request count via signer url prevents
    // double counting the same failed request by mistake
    session.failedSigners.add(signer.url)
    if (errorCode) {
      session.incrementErrorCodeCount(errorCode)
    }
    if (this.signers.length - session.failedSigners.size < this.config.keys.threshold) {
      session.logger.info('Not possible to reach a threshold of signer responses. Failing fast')
      session.abort.abort()
    }
  }
}
