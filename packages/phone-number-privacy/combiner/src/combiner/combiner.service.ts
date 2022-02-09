import {
  CombinerEndpoint,
  DisableDomainResponse,
  DomainQuotaStatusResponse,
  ErrorMessage,
  ErrorType,
  FailureResponse,
  OdisResponse,
  respondWithError,
  rootLogger,
  SignerEndpoint,
  SignMessageResponse,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import AbortController from 'abort-controller'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import fetch, { HeaderInit, Response as FetchResponse } from 'node-fetch'
import { OdisConfig, VERSION } from '../config'
import { DistributedRequest, ICombinerService } from './combiner.interface'
import { IInputService } from './input.interface'

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

export abstract class CombinerService implements ICombinerService {
  protected failedSigners: Set<string>
  protected errorCodes: Map<number, number>
  protected timedOut: boolean
  protected signers: SignerService[]
  protected timeoutMs: number
  protected threshold: number
  protected enabled: boolean
  protected logger: Logger
  protected abstract endpoint: CombinerEndpoint
  protected abstract signerEndpoint: SignerEndpoint
  protected abstract responses: SignerResponseWithStatus[]

  public constructor(config: OdisConfig, protected io: IInputService) {
    this.logger = rootLogger()
    this.failedSigners = new Set<string>()
    this.errorCodes = new Map<number, number>()
    this.timedOut = false
    this.signers = JSON.parse(config.odisServices.signers)
    this.timeoutMs = config.odisServices.timeoutMilliSeconds
    this.threshold = config.keys.threshold
    this.enabled = config.enabled
  }

  public async handleDistributedRequest(
    request: Request<{}, {}, DistributedRequest>,
    response: Response
  ) {
    this.logger = response.locals.logger
    try {
      if (!(await this.inputCheck(request, response))) {
        return
      }
      await this.forwardToSigners(request)
      await this.combineSignerResponses(request, response)
    } catch (err) {
      this.logger.error(`Unknown error in handleDistributedRequest for ${this.endpoint}`)
      this.logger.error(err)
      this.sendFailureResponse(response, ErrorMessage.UNKNOWN_ERROR, 500)
    }
  }

  protected async inputCheck(
    request: Request<{}, {}, DistributedRequest>,
    response: Response
  ): Promise<boolean> {
    if (!this.enabled) {
      this.sendFailureResponse(response, WarningMessage.API_UNAVAILABLE, 501)
      return false
    }
    if (!this.io.validate(request, this.logger)) {
      this.sendFailureResponse(response, WarningMessage.INVALID_INPUT, 400)
      return false
    }
    if (!(await this.io.authenticate(request, this.logger))) {
      this.sendFailureResponse(response, WarningMessage.UNAUTHENTICATED_USER, 401)
      return false
    }
    return true
  }

  protected async forwardToSigners(request: Request<{}, {}, DistributedRequest>) {
    // TODO(Alec): Factor out metering code
    const obs = new PerformanceObserver((list) => {
      const entry = list.getEntries()[0]
      this.logger.info({ latency: entry, signer: entry!.name }, 'Signer response latency measured')
    })
    obs.observe({ entryTypes: ['measure'], buffered: true })

    const controller = new AbortController()
    const timeout = setTimeout(() => {
      this.timedOut = true
      controller.abort()
    }, this.timeoutMs)

    await Promise.all(
      this.signers.map((signer) => this.fetchSignerResponse(signer, request, controller))
    )

    clearTimeout(timeout)

    performance.clearMarks()
    obs.disconnect()
  }

  protected headers(_request: Request<{}, {}, DistributedRequest>): HeaderInit | undefined {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }
  }

  protected async sendRequest(
    signerUrl: string,
    request: Request<{}, {}, DistributedRequest>,
    controller: AbortController
  ): Promise<FetchResponse> {
    this.logger.debug({ signerUrl }, `Sending signer request`)
    const url = signerUrl + this.signerEndpoint
    return fetch(url, {
      method: 'POST',
      headers: this.headers(request),
      body: JSON.stringify(request.body),
      signal: controller.signal,
    })
  }

  protected sendFailureResponse(
    response: Response<FailureResponse>,
    error: ErrorType,
    status: number
  ) {
    respondWithError(
      response,
      {
        success: false,
        version: VERSION,
        error,
      },
      status,
      this.logger
    )
  }

  protected getMajorityErrorCode() {
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
      // This gives priority to the lower status codes in the event of a tie
      // because 400s are more helpful than 500s for user feedback
      if (count > maxCount || (count === maxCount && errorCode < maxErrorCode)) {
        maxCount = count
        maxErrorCode = errorCode
      }
    })
    return maxErrorCode > 0 ? maxErrorCode : null
  }

  protected abstract combineSignerResponses(
    request: Request<{}, {}, DistributedRequest>,
    response: Response<OdisResponse>
  ): Promise<void>

  protected abstract handleResponseOK(
    request: Request<{}, {}, DistributedRequest>,
    data: string,
    status: number,
    url: string,
    controller?: AbortController
  ): Promise<void>

  private async fetchSignerResponse(
    signer: SignerService,
    request: Request<{}, {}, DistributedRequest>,
    controller: AbortController
  ) {
    let signerResponse: FetchResponse
    try {
      signerResponse = await this.sendMeteredSignerRequest(request, signer, controller)
    } catch (err) {
      return this.handleSignerRequestFailure(err, signer, controller)
    }

    return this.handleSignerResponse(request, signerResponse, signer, controller)
  }

  private async handleSignerResponse(
    request: Request<{}, {}, DistributedRequest>,
    signerResponse: FetchResponse,
    signer: SignerService,
    controller: AbortController
  ) {
    if (signerResponse.ok) {
      try {
        const data = await signerResponse.text()
        this.logger.info(
          { signer, res: data, status: signerResponse.status },
          'received ok response from signer'
        )
        await this.handleResponseOK(request, data, signerResponse.status, signer.url, controller)
      } catch (err) {
        // TODO(Alec): Review this error handling
        this.logger.error(err)
      }
    }

    return this.handleFailure(signer, signerResponse.status ?? 502, controller)
  }

  private async sendMeteredSignerRequest(
    request: Request<{}, {}, DistributedRequest>,
    signer: SignerService,
    controller: AbortController
  ): Promise<FetchResponse> {
    const start = `Start ${signer.url}/${this.signerEndpoint}`
    const end = `End ${signer.url}/${this.signerEndpoint}`
    performance.mark(start)

    return this.sendRequest(signer.url, request, controller)
      .catch((err) => {
        this.logger.error(`Signer failed with primary url ${signer.url}`, err)
        if (signer.fallbackUrl) {
          this.logger.warn(`Using fallback url to call signer ${signer.fallbackUrl}`)
          return this.sendRequest(signer.fallbackUrl, request, controller)
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
    controller: AbortController
  ) {
    if (errorCode) {
      this.incrementErrorCodeCount(errorCode)
    }
    // Tracking failed request count via signer url prevents
    // double counting the same failed request by mistake
    this.failedSigners.add(signer.url)

    const shouldFailFast = this.signers.length - this.failedSigners.size < this.threshold
    this.logger.info(
      `Recieved failure from ${this.failedSigners.size}/${this.signers.length} signers`
    )
    if (shouldFailFast) {
      this.logger.info('Not possible to reach a threshold of signer responses. Failing fast')
      controller.abort()
    }
  }

  private async handleSignerRequestFailure(
    err: any,
    signer: SignerService,
    controller: AbortController
  ) {
    let errorCode: number | undefined
    if (err instanceof Error && err.name === 'AbortError') {
      if (this.timedOut) {
        errorCode = 408
        this.logger.error({ signer }, ErrorMessage.TIMEOUT_FROM_SIGNER)
      } else {
        // Request was cancelled, assuming it would have been successful (no errorCode)
        this.logger.info({ signer }, WarningMessage.CANCELLED_REQUEST_TO_SIGNER)
      }
    } else {
      errorCode = 500
      this.logger.error({ signer }, ErrorMessage.SIGNER_REQUEST_ERROR)
    }
    this.logger.error(err)

    this.handleFailure(signer, errorCode, controller)
  }

  private incrementErrorCodeCount(errorCode: number) {
    this.errorCodes.set(errorCode, (this.errorCodes.get(errorCode) ?? 0) + 1)
  }
}
