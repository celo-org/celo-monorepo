import {
  CombinerEndpoint,
  ErrorMessage,
  ErrorType,
  OdisRequest,
  OdisResponse,
  respondWithError,
  SignerEndpoint,
  SuccessResponse,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import fetch, { HeaderInit, Response as FetchResponse } from 'node-fetch'
import { OdisConfig, VERSION } from '../config'
import { Session } from './session'

// TODO(Alec): Rename this folder to something other than "combiner" (potentially add / refactor matchmaking code to match)

// tslint:disable-next-line: interface-over-type-literal
export type SignerResponse<R extends OdisRequest> = {
  url: string
  res: OdisResponse<R>
  status: number
}

export interface SignerService {
  url: string
  fallbackUrl?: string
}
export interface ICombinerService<R extends OdisRequest> {
  handle(request: Request<{}, {}, R>, response: Response<OdisResponse<R>>): Promise<void>
}

export abstract class CombinerService<R extends OdisRequest> implements ICombinerService<R> {
  readonly timeoutMs: number
  readonly signers: SignerService[]
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
        return this.sendFailureResponse(WarningMessage.API_UNAVAILABLE, 501, logger) // TODO(Alec)(Next)
      }
      if (!this.validate(request)) {
        return this.sendFailureResponse(WarningMessage.INVALID_INPUT, 400, logger)
      }
      if (!this.reqKeyHeaderCheck(request)) {
        // TODO(Alec): better name
        return this.sendFailureResponse(WarningMessage.INVALID_KEY_VERSION_REQUEST, 400, logger)
      }
      if (!(await this.authenticate(request, logger))) {
        return this.sendFailureResponse(WarningMessage.UNAUTHENTICATED_USER, 401, logger)
      }

      const result = await this.distribute(request, response)
      await this.combine(result)
    } catch (err) {
      // TODO(Alec): review bunyan logging
      logger.error({ error: err }, `Unknown error in handleDistributedRequest for ${this.endpoint}`)
      this.sendFailureResponse(ErrorMessage.UNKNOWN_ERROR, 500, logger)
    }
  }

  protected async distribute(
    request: Request<{}, {}, R>,
    response: Response<OdisResponse<R>>
  ): Promise<Session<R>> {
    // const session = this.buildSession(request, response, this)
    const session = new Session<R>(request, response, this)

    // TODO(Alec): Factor out metering code
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
    }, this.timeoutMs)

    await Promise.all(this.signers.map((signer) => this.fetchSignerResponse(signer, session)))

    clearTimeout(timeout)

    performance.clearMarks()
    obs.disconnect()

    return session
  }

  protected headers(_request: Request<{}, {}, R>): HeaderInit | undefined {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }
  }

  protected async sendRequest(signerUrl: string, session: Session<R>): Promise<FetchResponse> {
    session.logger.debug({ signerUrl }, `Sending signer request`)
    const url = signerUrl + this.signerEndpoint
    return fetch(url, {
      method: 'POST',
      headers: this.headers(session.request),
      body: JSON.stringify(session.request.body),
      signal: session.controller.signal,
    })
  }

  protected sendSuccessResponse(res: SuccessResponse<R>, status: number, session: Session<R>) {
    session.response.status(status).json(res)
  }

  protected sendFailureResponse(error: ErrorType, status: number, session: Session<R>) {
    respondWithError(
      session.response,
      {
        success: false,
        version: VERSION,
        error,
      },
      status,
      session.logger
    )
  }

  protected abstract validate(request: Request<{}, {}, unknown>): request is Request<{}, {}, R>

  protected abstract authenticate(request: Request<{}, {}, R>, logger: Logger): Promise<boolean>

  protected abstract reqKeyHeaderCheck(request: Request<{}, {}, R>): boolean

  protected abstract combine(session: Session<R>): Promise<void>

  protected abstract handleResponseOK(
    data: string,
    status: number,
    url: string,
    session: Session<R>
  ): Promise<void>

  private async fetchSignerResponse(signer: SignerService, session: Session<R>) {
    let signerResponse: FetchResponse
    try {
      signerResponse = await this.sendMeteredSignerRequest(signer, session)
    } catch (err) {
      return this.handleSignerRequestFailure(err, signer, session)
    }

    return this.handleSignerResponse(signerResponse, signer, session)
  }

  private async handleSignerResponse(
    signerResponse: FetchResponse,
    signer: SignerService,
    session: Session<R>
  ) {
    if (signerResponse.ok) {
      try {
        const data = await signerResponse.text()
        session.logger.info(
          { signer, res: data, status: signerResponse.status },
          'received ok response from signer'
        )
        await this.handleResponseOK(data, signerResponse.status, signer.url, session)
      } catch (err) {
        // TODO(Alec): Review this error handling
        session.logger.error(err)
      }
    }

    return this.handleFailure(signer, signerResponse.status ?? 502, session)
  }

  private async sendMeteredSignerRequest(
    signer: SignerService,
    session: Session<R>
  ): Promise<FetchResponse> {
    const start = `Start ${signer.url}/${this.signerEndpoint}`
    const end = `End ${signer.url}/${this.signerEndpoint}`
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

  private handleFailure(signer: SignerService, errorCode: number | undefined, session: Session<R>) {
    if (errorCode) {
      session.incrementErrorCodeCount(errorCode)
    }
    // Tracking failed request count via signer url prevents
    // double counting the same failed request by mistake
    session.failedSigners.add(signer.url)

    const shouldFailFast = this.signers.length - session.failedSigners.size < this.threshold
    session.logger.info(
      `Recieved failure from ${session.failedSigners.size}/${this.signers.length} signers`
    )
    if (shouldFailFast) {
      session.logger.info('Not possible to reach a threshold of signer responses. Failing fast')
      session.controller.abort()
    }
  }

  private async handleSignerRequestFailure(err: any, signer: SignerService, session: Session<R>) {
    let errorCode: number | undefined
    if (err instanceof Error && err.name === 'AbortError') {
      if (session.timedOut) {
        errorCode = 408
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

    this.handleFailure(signer, errorCode, session)
  }
}
