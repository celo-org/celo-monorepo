import {
  CombinerEndpoint,
  DisableDomainResponseSuccess,
  DomainQuotaStatusResponseSuccess,
  ErrorMessage,
  getSignerEndpoint,
  rootLogger,
  SignerEndpoint,
  SignMessageResponseFailure,
  SignMessageResponseSuccess,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import fetch, { Response as FetchResponse } from 'node-fetch'
import { respondWithError } from '../common/error-utils'
import { OdisConfig } from '../config'
import { ICombinerService } from './combiner.interface'
import { ICombinerInputService } from './input.interface'

type SignerPnpResponse = SignMessageResponseSuccess | SignMessageResponseFailure

type SignerResponse =
  | SignerPnpResponse
  | DomainQuotaStatusResponseSuccess
  | DisableDomainResponseSuccess

interface SignerResponseWithStatus {
  url: string
  res: SignerResponse
  status: number
}

interface SignerService {
  url: string
  fallbackUrl?: string
}

export abstract class CombinerService implements ICombinerService {
  protected responses: SignerResponseWithStatus[]
  protected failedSigners: Set<string>
  protected errorCodes: Map<number, number>
  protected timedOut: boolean
  protected signers: SignerService[]
  protected timeoutMs: number
  protected threshold: number
  protected pubKey: string
  protected keyVersion: number
  protected polynomial: string
  protected signerEndpoint: SignerEndpoint
  protected logger: Logger

  public constructor(
    _config: OdisConfig,
    protected endpoint: CombinerEndpoint,
    protected inputService: ICombinerInputService
  ) {
    this.logger = rootLogger() // This is later assigned a request specific logger
    this.signerEndpoint = getSignerEndpoint(endpoint)
    this.responses = []
    this.failedSigners = new Set<string>()
    this.errorCodes = new Map<number, number>()
    this.timedOut = false
    this.signers = JSON.parse(_config.odisServices.signers)
    this.timeoutMs = _config.odisServices.timeoutMilliSeconds
    this.threshold = _config.keys.threshold
    this.pubKey = _config.keys.pubKey
    this.keyVersion = _config.keys.version
    this.polynomial = _config.keys.polynomial
  }

  public async handleDistributedRequest(request: Request, response: Response) {
    this.logger = response.locals.logger
    try {
      if (!this.inputService.validate(request)) {
        respondWithError(response, 400, WarningMessage.INVALID_INPUT, this.logger)
        return
      }
      if (!(await this.inputService.authenticate(request))) {
        respondWithError(response, 401, WarningMessage.UNAUTHENTICATED_USER, this.logger)
        return
      }

      await this.forwardToSigners(request)
      await this.combineSignerResponses(response)
    } catch (err) {
      this.logger.error(`Unknown error in handleDistributedRequest for ${this.endpoint}`)
      this.logger.error(err)
      respondWithError(response, 500, ErrorMessage.UNKNOWN_ERROR, this.logger)
    }
  }

  protected async forwardToSigners(request: Request) {
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

  protected abstract combineSignerResponses(response: Response): Promise<void>

  protected abstract handleSuccessResponse(
    data: string,
    status: number,
    url: string,
    controller: AbortController
  ): Promise<void>

  private async fetchSignerResponse(
    signer: SignerService,
    request: Request,
    controller: AbortController
  ) {
    let res: FetchResponse
    try {
      res = await this.sendMeteredSignerRequest(signer, request, controller)
    } catch (err) {
      return this.handleSignerRequestFailure(err, signer, controller)
    }

    return this.handleSignerResponse(res, signer, controller)
  }

  private async handleSignerResponse(
    res: FetchResponse,
    signer: SignerService,
    controller: AbortController
  ) {
    if (!res.ok) {
      return this.handleFailure(signer, res.status, controller)
    }

    const data = await res.text()
    this.logger.info({ signer, res: data, status: res.status }, 'received response from signer')
    return this.handleSuccessResponse(data, res.status, signer.url, controller)
  }

  private async sendMeteredSignerRequest(
    signer: SignerService,
    request: Request,
    controller: AbortController
  ): Promise<FetchResponse> {
    const start = `Start ${signer.url}/${this.signerEndpoint}`
    const end = `End ${signer.url}/${this.signerEndpoint}`
    performance.mark(start)

    return this.sendRequest(signer.url, request, controller)
      .catch((e) => {
        this.logger.error(`Signer failed with primary url ${signer.url}`, e)
        if (signer.fallbackUrl) {
          this.logger.warn(`Using fallback url to call signer ${signer.fallbackUrl}`)
          return this.sendRequest(signer.fallbackUrl, request, controller)
        }
        throw e
      })
      .finally(() => {
        performance.mark(end)
        performance.measure(signer.url, start, end)
      })
  }

  private async sendRequest(
    signerUrl: string,
    request: Request,
    controller: AbortController
  ): Promise<FetchResponse> {
    this.logger.debug({ signerUrl }, `Sending signer request`)
    const url = signerUrl + this.signerEndpoint
    return fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: request.headers.authorization!,
      },
      body: JSON.stringify(request.body),
      signal: controller.signal,
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

  private incrementErrorCodeCount(errorCode: number) {
    this.errorCodes.set(errorCode, (this.errorCodes.get(errorCode) ?? 0) + 1)
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
}
