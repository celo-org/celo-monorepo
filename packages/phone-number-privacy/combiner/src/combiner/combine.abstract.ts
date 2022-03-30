import { ErrorMessage, OdisRequest, WarningMessage } from '@celo/phone-number-privacy-common'
import { Request } from 'express'
import fetch, { HeaderInit, Response as FetchResponse } from 'node-fetch'
import { OdisConfig } from '../config'
import { IAction } from './action.interface'
import { IOAbstract } from './io.abstract'
import { Session } from './session'

export interface Signer {
  url: string
  fallbackUrl?: string
}

export abstract class CombineAbstract<R extends OdisRequest> implements IAction<R> {
  readonly signers: Signer[]
  public constructor(readonly config: OdisConfig, readonly io: IOAbstract<R>) {
    this.signers = JSON.parse(config.odisServices.signers) // TODO(Alec): io-ts here?
  }

  async perform(session: Session<R>) {
    await this.distribute(session).then(this.combine)
  }

  async distribute(session: Session<R>): Promise<Session<R>> {
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
      session.controller.abort()
    }, this.config.odisServices.timeoutMilliSeconds)

    // Forward request to signers
    await Promise.all(this.signers.map((signer) => this.forwardToSigner(signer, session)))

    clearTimeout(timeout)

    performance.clearMarks()
    obs.disconnect()

    return session
  }

  async forwardToSigner(signer: Signer, session: Session<R>): Promise<void> {
    let signerResponse: FetchResponse
    try {
      signerResponse = await this.sendMeteredSignerRequest(signer, session)
    } catch (err) {
      return this.handleSignerRequestFailure(err, signer, session)
    }

    return this.handleSignerResponse(signerResponse, signer, session)
  }

  abstract combine(session: Session<R>): Promise<void>

  protected abstract receiveSuccess(
    signerResponse: FetchResponse,
    url: string,
    session: Session<R>
  ): Promise<void>

  protected headers(_request: Request<{}, {}, R>): HeaderInit | undefined {
    return {
      // TODO(Alec)
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }
  }

  private async sendMeteredSignerRequest(
    signer: Signer,
    session: Session<R>
  ): Promise<FetchResponse> {
    // TODO(Alec): Factor out this metering code
    const start = `Start ${signer.url + this.io.signerEndpoint}`
    const end = `End ${signer.url + this.io.signerEndpoint}`
    performance.mark(start)

    return this.sendRequest(signer.url, session)
      .catch((err) => {
        session.logger.error({ url: signer.url, error: err }, `Signer failed with primary url`)
        if (signer.fallbackUrl) {
          session.logger.warn({ url: signer.fallbackUrl }, `Using fallback url to call signer`)
          return this.sendRequest(signer.fallbackUrl, session)
        }
        throw err
      })
      .finally(() => {
        performance.mark(end)
        performance.measure(signer.url, start, end)
      })
  }
  private async sendRequest(signerUrl: string, session: Session<R>): Promise<FetchResponse> {
    session.logger.debug({ signerUrl }, `Sending signer request`)
    const url = signerUrl + this.io.signerEndpoint
    return fetch(url, {
      method: 'POST',
      headers: this.headers(session.request),
      body: JSON.stringify(session.request.body),
      signal: session.controller.signal,
    })
  }

  private async handleSignerResponse(
    signerResponse: FetchResponse,
    signer: Signer,
    session: Session<R>
  ) {
    if (signerResponse.ok) {
      try {
        await this.receiveSuccess(signerResponse, signer.url, session)
      } catch (err) {
        // TODO(Alec): Review this error handling. Ensure this request gets marked as failed so the
        // fail-fast logic gets triggered as intended.
        session.logger.error(err)
      }
    }

    return this.receiveFailure(signer, signerResponse.status ?? 502, session)
  }

  private receiveFailure(signer: Signer, errorCode: number | undefined, session: Session<R>) {
    session.logger.info(
      `Recieved failure from ${session.failedSigners.size}/${this.signers.length} signers`
    )
    // Tracking failed request count via signer url prevents
    // double counting the same failed request by mistake
    session.failedSigners.add(signer.url)
    if (errorCode) {
      session.incrementErrorCodeCount(errorCode)
    }
    if (this.signers.length - session.failedSigners.size < this.config.keys.threshold) {
      session.logger.info('Not possible to reach a threshold of signer responses. Failing fast')
      session.controller.abort()
    }
  }

  private async handleSignerRequestFailure(err: any, signer: Signer, session: Session<R>) {
    let errorCode: number | undefined
    if (err instanceof Error && err.name === 'AbortError' && session.controller.signal.aborted) {
      if (session.timedOut) {
        errorCode = 504 // @victor what status code should we use here
        session.logger.error({ signer }, ErrorMessage.TIMEOUT_FROM_SIGNER)
      } else {
        // Request was cancelled, assuming it would have been successful (no errorCode)
        session.logger.info({ signer }, WarningMessage.CANCELLED_REQUEST_TO_SIGNER)
      }
    } else {
      errorCode = 500
      session.logger.error({ signer }, ErrorMessage.SIGNER_REQUEST_ERROR)
    }
    session.logger.error(err)
    this.receiveFailure(signer, errorCode, session)
  }
}
