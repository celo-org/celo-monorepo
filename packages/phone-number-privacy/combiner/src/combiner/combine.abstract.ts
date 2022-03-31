import { ErrorMessage, OdisRequest, WarningMessage } from '@celo/phone-number-privacy-common'
import { Response as FetchResponse } from 'node-fetch'
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
    this.signers = JSON.parse(config.odisServices.signers)
  }

  async perform(session: Session<R>) {
    await this.distribute(session).then(this.combine)
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
      signerResponse = await this.io.fetchSignerResponseWithFallback(signer, session)
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

  private async handleSignerResponse(
    signerResponse: FetchResponse,
    signer: Signer,
    session: Session<R>
  ) {
    if (signerResponse.ok) {
      try {
        await this.receiveSuccess(signerResponse, signer.url, session)
      } catch (err) {
        // TODO(Alec)(next)(error handling): Review this error handling. Ensure this request gets marked as failed so the
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
        errorCode = 504 // TODO(Alec)
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
