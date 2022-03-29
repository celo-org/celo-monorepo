import {
  CombinerEndpoint,
  ErrorMessage,
  ErrorType,
  FailureResponse,
  OdisRequest,
  OdisResponse,
  SignerEndpoint,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import fetch, { HeaderInit, Response as FetchResponse } from 'node-fetch'
import { OdisConfig } from '../config'
import { Session } from './session'

// tslint:disable-next-line: interface-over-type-literal
export type SignerResponse<R extends OdisRequest> = {
  url: string
  res: OdisResponse<R>
  status: number
}

export interface Signer {
  url: string
  fallbackUrl?: string
}

export interface ICombinerService<R extends OdisRequest> {
  handle(request: Request<{}, {}, R>, response: Response<OdisResponse<R>>): Promise<void>
}

export abstract class CombinerService<R extends OdisRequest> implements ICombinerService<R> {
  readonly timeoutMs: number
  readonly signers: Signer[]
  readonly threshold: number
  readonly enabled: boolean
  readonly pubKey: string
  readonly keyVersion: number
  readonly polynomial: string
  abstract readonly endpoint: CombinerEndpoint
  abstract readonly signerEndpoint: SignerEndpoint

  public constructor(config: OdisConfig) {
    this.timeoutMs = config.odisServices.timeoutMilliSeconds
    this.signers = JSON.parse(config.odisServices.signers)
    this.threshold = config.keys.threshold
    this.enabled = config.enabled
    this.pubKey = config.keys.pubKey
    this.keyVersion = config.keys.version
    this.polynomial = config.keys.polynomial
  }

  public async handle(request: Request<{}, {}, unknown>, response: Response<OdisResponse<R>>) {
    const logger: Logger = response.locals.logger
    try {
      if (!this.enabled) {
        return this.sendFailure(WarningMessage.API_UNAVAILABLE, 503, response, logger)
      }
      if (!this.validate(request)) {
        return this.sendFailure(WarningMessage.INVALID_INPUT, 400, response, logger)
      }
      if (!this.checkRequestKeyVersion(request, logger)) {
        return this.sendFailure(WarningMessage.INVALID_KEY_VERSION_REQUEST, 400, response, logger)
      }
      if (!(await this.authenticate(request, logger))) {
        return this.sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response, logger)
      }
      await this.distribute(request, response).then(this.combine)
    } catch (err) {
      logger.error({ error: err }, `Unknown error in handler for ${this.endpoint}`)
      this.sendFailure(ErrorMessage.UNKNOWN_ERROR, 500, response, logger)
    }
  }

  protected async distribute(
    request: Request<{}, {}, R>,
    response: Response<OdisResponse<R>>
  ): Promise<Session<R>> {
    // TODO: Consider injecting this in request. Clarify the intent of this "Session"
    const session = new Session<R>(request, response, this)

    const obs = new PerformanceObserver((list) => {
      const entry = list.getEntries()[0]
      session.logger.info(
        { latency: entry, signer: entry!.name },
        'Signer response latency measured'
      )
    })
    obs.observe({ entryTypes: ['measure'], buffered: true })

    // TODO(Alec): look into abort controller timeout
    const timeout = setTimeout(() => {
      session.timedOut = true
      session.controller.abort()
    }, this.timeoutMs)

    // TODO(Alec): Investigate race condition
    // Forward request to signers
    await Promise.all(this.signers.map((signer) => this.forwardToSigner(signer, session)))

    clearTimeout(timeout)

    performance.clearMarks()
    obs.disconnect()

    return session
  }

  protected headers(_request: Request<{}, {}, R>): HeaderInit | undefined {
    return {
      // TODO(Alec)
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }
  }

  protected abstract validate(request: Request<{}, {}, unknown>): request is Request<{}, {}, R>
  protected abstract checkRequestKeyVersion(request: Request<{}, {}, R>, logger: Logger): boolean
  protected abstract authenticate(request: Request<{}, {}, R>, logger: Logger): Promise<boolean>
  protected abstract combine(session: Session<R>): Promise<void>
  protected abstract receiveSuccess(
    signerResponse: FetchResponse,
    url: string,
    session: Session<R>
  ): Promise<void>
  protected abstract sendFailure(
    error: ErrorType,
    status: number,
    response: Response<FailureResponse<R>>,
    logger: Logger,
    ...args: unknown[]
  ): void
  protected abstract validateSignerResponse(
    data: string,
    url: string,
    session: Session<R>
  ): OdisResponse<R>

  private async forwardToSigner(signer: Signer, session: Session<R>): Promise<void> {
    let signerResponse: FetchResponse
    try {
      signerResponse = await this.sendMeteredSignerRequest(signer, session)
    } catch (err) {
      return this.handleSignerRequestFailure(err, signer, session)
    }

    return this.handleSignerResponse(signerResponse, signer, session)
  }

  private async sendMeteredSignerRequest(
    signer: Signer,
    session: Session<R>
  ): Promise<FetchResponse> {
    // TODO(Alec): Factor out this metering code
    const start = `Start ${signer.url + this.signerEndpoint}`
    const end = `End ${signer.url + this.signerEndpoint}`
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
    const url = signerUrl + this.signerEndpoint
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
    if (this.signers.length - session.failedSigners.size < this.threshold) {
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
