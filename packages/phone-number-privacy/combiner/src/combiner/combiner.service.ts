import {
  CombinerEndpoint,
  DisableDomainResponse,
  DomainQuotaStatusResponse,
  ErrorMessage,
  ErrorType,
  respondWithError,
  SignerEndpoint,
  SignMessageResponse,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import AbortController from 'abort-controller'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import fetch, { HeaderInit, Response as FetchResponse } from 'node-fetch'
import { OdisConfig, VERSION } from '../config'

// TODO(Alec): Rename this folder to something other than "combiner" (potentially add / refactor matchmaking code to match)

export type SignerResponse = SignMessageResponse | DomainQuotaStatusResponse | DisableDomainResponse

export interface SignerResponseWithStatus {
  url: string
  res: SignerResponse
  status: number
}

export interface SignerService {
  url: string
  fallbackUrl?: string
}

export class Session<I, O> {
  logger: Logger
  controller: AbortController
  timedOut: boolean

  readonly failedSigners: Set<string>
  readonly errorCodes: Map<number, number>
  readonly responses: SignerResponseWithStatus[]

  public constructor(readonly request: Request<{}, {}, I>, readonly response: Response<O>) {
    this.logger = response.locals.logger()
    this.controller = new AbortController()
    this.timedOut = false
    this.failedSigners = new Set<string>()
    this.errorCodes = new Map<number, number>()
    this.responses = []
  }

  public incrementErrorCodeCount(errorCode: number) {
    this.errorCodes.set(errorCode, (this.errorCodes.get(errorCode) ?? 0) + 1)
  }

  public getMajorityErrorCode() {
    // Ignore timeouts
    const ignoredErrorCodes = [408]
    const uniqueErrorCount = Array.from(this.errorCodes.keys()).filter(
      (status) => !ignoredErrorCodes.includes(status)
    ).length
    if (uniqueErrorCount > 1) {
      this.logger.error(
        { errorCodes: JSON.stringify([...this.errorCodes]) },
        ErrorMessage.INCONSISTENT_SIGNER_RESPONSES
      )
    }

    let maxErrorCode = -1
    let maxCount = -1
    this.errorCodes.forEach((count, errorCode) => {
      // B
      // This gives priority to the lower status codes in the event of a tie
      // because 400s are more helpful than 500s for user feedback
      if (count > maxCount || (count === maxCount && errorCode < maxErrorCode)) {
        maxCount = count
        maxErrorCode = errorCode
      }
    })
    return maxErrorCode > 0 ? maxErrorCode : null
  }
}

export interface ICombinerService<I, O> {
  handle(request: Request<{}, {}, I>, response: Response<O>): Promise<void>
}

// tslint:disable-next-line: max-classes-per-file
export abstract class CombinerService<I, O> implements ICombinerService<I, O> {
  protected readonly timeoutMs: number
  protected readonly signers: SignerService[]
  protected readonly threshold: number
  protected readonly enabled: boolean
  protected abstract readonly endpoint: CombinerEndpoint
  protected abstract readonly signerEndpoint: SignerEndpoint

  public constructor(config: OdisConfig) {
    this.signers = JSON.parse(config.odisServices.signers)
    this.timeoutMs = config.odisServices.timeoutMilliSeconds
    this.threshold = config.keys.threshold
    this.enabled = config.enabled
  }

  public async handle(request: Request<{}, {}, I>, response: Response) {
    const logger = response.locals.logger()
    try {
      if (!this.enabled) {
        return this.sendFailureResponse(WarningMessage.API_UNAVAILABLE, 501, logger)
      }
      if (!this.validate(request)) {
        return this.sendFailureResponse(WarningMessage.INVALID_INPUT, 400, logger)
      }
      if (!this.reqKeyHeaderCheck(request)) {
        return this.sendFailureResponse(WarningMessage.INVALID_KEY_VERSION_REQUEST, 400, logger)
      }
      if (!(await this.authenticate(request, logger))) {
        return this.sendFailureResponse(WarningMessage.UNAUTHENTICATED_USER, 401, logger)
      }

      const result = await this.distribute(request, response)
      await this.combine(result)
      // TODO(Alec)
      // const responseBody = await this.combine(result)
      // // this.send(res)
    } catch (err) {
      logger.error(`Unknown error in handleDistributedRequest for ${this.endpoint}`)
      logger.error(err)
      this.sendFailureResponse(ErrorMessage.UNKNOWN_ERROR, 500, logger)
    }
  }

  protected async distribute(
    request: Request<{}, {}, I>,
    response: Response
  ): Promise<Session<I, O>> {
    const session = new Session<I, O>(request, response)

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
      // 1
      session.timedOut = true
      session.controller.abort()
    }, this.timeoutMs)

    await Promise.all(this.signers.map((signer) => this.fetchSignerResponse(signer, session)))

    clearTimeout(timeout)

    performance.clearMarks()
    obs.disconnect()

    return session
  }

  protected headers(_request: Request<{}, {}, I>): HeaderInit | undefined {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }
  }

  protected async sendRequest(signerUrl: string, session: Session<I, O>): Promise<FetchResponse> {
    session.logger.debug({ signerUrl }, `Sending signer request`)
    const url = signerUrl + this.signerEndpoint
    return fetch(url, {
      method: 'POST',
      headers: this.headers(session.request),
      body: JSON.stringify(session.request.body),
      signal: session.controller.signal,
    })
  }

  // protected sendSuccessResponse(res: O, status: number, session: Session<I, O>) {
  //   session.response.status(status).json(res)
  // }

  protected sendFailureResponse(error: ErrorType, status: number, session: Session<I, O>) {
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

  protected abstract validate(request: Request<{}, {}, unknown>): request is Request<{}, {}, I>

  protected abstract authenticate(request: Request<{}, {}, I>, logger: Logger): Promise<boolean>

  protected abstract reqKeyHeaderCheck(request: Request<{}, {}, I>): boolean

  protected abstract combine(session: Session<I, O>): Promise<void>

  protected abstract handleResponseOK(
    data: string,
    status: number,
    url: string,
    session: Session<I, O>
  ): Promise<void>

  private async fetchSignerResponse(signer: SignerService, session: Session<I, O>) {
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
    session: Session<I, O>
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
    session: Session<I, O>
  ): Promise<FetchResponse> {
    const start = `Start ${signer.url}/${this.signerEndpoint}`
    const end = `End ${signer.url}/${this.signerEndpoint}`
    performance.mark(start)

    return this.sendRequest(signer.url, session)
      .catch((err) => {
        session.logger.error(`Signer failed with primary url ${signer.url}`, err)
        if (signer.fallbackUrl) {
          session.logger.warn(`Using fallback url to call signer ${signer.fallbackUrl}`)
          return this.sendRequest(signer.fallbackUrl, session)
        }
        throw err
      })
      .finally(() => {
        performance.mark(end)
        performance.measure(signer.url, start, end)
      })
  }

  private handleFailure(
    signer: SignerService,
    errorCode: number | undefined,
    session: Session<I, O>
  ) {
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
      session.controller.abort() // 3
    }
  }

  private async handleSignerRequestFailure(
    err: any,
    signer: SignerService,
    session: Session<I, O>
  ) {
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
