import { isKnownDomain } from '@celo/identity/lib/odis/domains'
import {
  DisableDomainRequest,
  DisableDomainResponse,
  DisableDomainResponseSuccess,
  ErrorMessage,
  SequentialDelayDomain,
  SequentialDelayDomainOptions,
  SignerEndpoint,
  verifyDisableDomainRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import AbortController from 'abort-controller'
import Logger from 'bunyan'
import { Request, Response } from 'firebase-functions'
import fetch, { Response as FetchResponse } from 'node-fetch'
import { performance, PerformanceObserver } from 'perf_hooks'
import { respondWithError } from '../common/error-utils'
import config, { VERSION } from '../config'

// TODO(Alec): De-dupe with get-threhold-signature

interface SignerService {
  url: string
  fallbackUrl?: string
}

interface DisableDomainRespWithStatus {
  url: string
  disableDomainResponse: DisableDomainResponseSuccess
  status: number
}

export async function handleDomainDisableReq(request: Request, response: Response) {
  const logger: Logger = response.locals.logger
  try {
    if (!isValidDisableDomainInput(request)) {
      respondWithError(response, 400, WarningMessage.INVALID_INPUT, logger)
      return
    }
    if (!authenticateDisableDomainRequest(request)) {
      respondWithError(response, 401, WarningMessage.UNAUTHENTICATED_USER, logger)
      return
    }
    logger.debug('Requesting that signers disable domain')
    await requestSignersDisableDomain(request, response)
  } catch (err) {
    logger.error('Unknown error in handleDomainDisableReq')
    logger.error(err)
    respondWithError(response, 500, ErrorMessage.UNKNOWN_ERROR, logger)
  }
}

async function requestSignersDisableDomain(request: Request, response: Response) {
  const logger: Logger = response.locals.logger

  const successes: DisableDomainRespWithStatus[] = []
  const failures = new Set<string>()
  const errorCodes: Map<number, number> = new Map()

  const obs = new PerformanceObserver((list) => {
    const entry = list.getEntries()[0]
    logger.info({ latency: entry, signer: entry!.name }, 'Signer response latency measured')
  })
  obs.observe({ entryTypes: ['measure'], buffered: true })

  const signers: SignerService[] = JSON.parse(config.odisServices.domains.signers)
  const timeoutMs = config.odisServices.domains.timeoutMilliSeconds
  const threshold = config.keys.domains.threshold

  let timedOut = false
  const controller = new AbortController()
  const timeout = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)

  const signerReqs = signers.map((service) => {
    const startMark = `Begin requestSignersDisableDomain ${service.url}`
    const endMark = `End requestSignersDisableDomain ${service.url}`
    const entryName = service.url
    performance.mark(startMark)

    return requestDisableDomain(service, request, controller, SignerEndpoint.DISABLE_DOMAIN, logger)
      .then(async (res: FetchResponse) => {
        const data = await res.text()
        logger.info(
          { signer: service, res: data, status: res.status },
          'received requestDisableDomain response from signer'
        )
        if (res.ok) {
          await handleSuccessResponse(
            data,
            res.status,
            response,
            successes,
            service.url,
            controller,
            threshold
          )
        } else {
          handleFailedResponse(
            service,
            res.status,
            signers.length,
            failures,
            response,
            controller,
            errorCodes,
            threshold
          )
        }
      })
      .catch((err) => {
        let status: number | undefined = 500
        if (err.name === 'AbortError') {
          if (timedOut) {
            status = 408
            logger.error({ signer: service }, ErrorMessage.TIMEOUT_FROM_SIGNER)
          } else {
            // Request was cancelled, assuming it would have been successful
            status = undefined
            logger.info({ signer: service }, WarningMessage.CANCELLED_REQUEST_TO_SIGNER)
          }
        } else {
          logger.error({ signer: service }, ErrorMessage.SIGNER_DISABLE_DOMAIN_FAILURE)
        }
        logger.error(err)
        handleFailedResponse(
          service,
          status,
          signers.length,
          failures,
          response,
          controller,
          errorCodes,
          threshold
        )
      })
      .finally(() => {
        performance.mark(endMark)
        performance.measure(entryName, startMark, endMark)
      })
  })

  await Promise.all(signerReqs)
  clearTimeout(timeout)
  performance.clearMarks()
  obs.disconnect()

  if (successes.length >= threshold) {
    response.json({ success: true, version: VERSION })
    return
  }

  const majorityErrorCode = getMajorityErrorCode(errorCodes, logger)
  respondWithError(
    response,
    majorityErrorCode ?? 500,
    ErrorMessage.THRESHOLD_DISABLE_DOMAIN_FAILURE,
    logger
  )
}

async function handleSuccessResponse(
  data: string,
  status: number,
  response: Response,
  successes: DisableDomainRespWithStatus[],
  serviceUrl: string,
  controller: AbortController,
  threshold: number
) {
  const logger: Logger = response.locals.logger
  const disableDomainResponse = JSON.parse(data) as DisableDomainResponse

  // TODO(Alec): think through the consequences of throwing here
  if (!disableDomainResponse.success) {
    logger.error(
      {
        error: disableDomainResponse.error,
        signer: serviceUrl,
      },
      'Signer responded with error'
    )
    throw new Error('Disable domain request failed')
  }

  successes.push({ url: serviceUrl, disableDomainResponse, status })
  logger.info({ signer: serviceUrl }, 'Signer successfully disabled domain')
  // Send response immediately once we cross threshold
  if (successes.length >= threshold) {
    controller.abort()
  }
}

function handleFailedResponse(
  service: SignerService,
  status: number | undefined,
  signerCount: number,
  failures: Set<string>,
  response: Response,
  controller: AbortController,
  errorCodes: Map<number, number>,
  threshold: number
) {
  const logger: Logger = response.locals.logger
  if (status) {
    // Increment counter for status code by 1
    errorCodes.set(status, (errorCodes.get(status) ?? 0) + 1)
  }
  // Tracking failed request count via signer url prevents
  // double counting the same failed request by mistake
  failures.add(service.url)
  const shouldFailFast = signerCount - failures.size < threshold
  logger.info(`Recieved failure from ${failures.size}/${signerCount} signers.`)
  if (shouldFailFast) {
    logger.info(
      'Not possible to reach a threshold of succesful disableDomain responses. Failing fast.'
    )
    controller.abort()
  }
}

function requestDisableDomain(
  service: SignerService,
  request: Request,
  controller: AbortController,
  endpoint: SignerEndpoint,
  logger: Logger
): Promise<FetchResponse> {
  return parameterizedSignerRequest(service.url, request, controller, endpoint, logger).catch(
    (e) => {
      logger.error(`Signer failed with primary url ${service.url}`, e)
      if (service.fallbackUrl) {
        logger.warn(`Using fallback url to call signer ${service.fallbackUrl!}`)
        return parameterizedSignerRequest(
          service.fallbackUrl!,
          request,
          controller,
          endpoint,
          logger
        )
      }
      throw e
    }
  )
}

function parameterizedSignerRequest(
  baseUrl: string,
  request: Request,
  controller: AbortController,
  endpoint: SignerEndpoint,
  logger: Logger
): Promise<FetchResponse> {
  logger.debug({ signer: baseUrl }, 'sending disableDomain request to signer')
  const url = baseUrl + endpoint
  return fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request.body),
    signal: controller.signal,
  })
}

function getMajorityErrorCode(errorCodes: Map<number, number>, logger: Logger) {
  // Ignore timeouts
  const ignoredErrorCodes = [408]
  const uniqueErrorCount = Array.from(errorCodes.keys()).filter(
    (status) => !ignoredErrorCodes.includes(status)
  ).length
  if (uniqueErrorCount > 1) {
    logger.error(
      { errorCodes: JSON.stringify([...errorCodes]) },
      ErrorMessage.INCONSISTENT_SIGNER_RESPONSES
    )
  }

  let maxErrorCode = -1
  let maxCount = -1
  errorCodes.forEach((count, errorCode) => {
    // This gives priority to the lower status codes in the event of a tie
    // because 400s are more helpful than 500s for user feedback
    if (count > maxCount || (count === maxCount && errorCode < maxErrorCode)) {
      maxCount = count
      maxErrorCode = errorCode
    }
  })
  return maxErrorCode > 0 ? maxErrorCode : null
}

function isValidDisableDomainInput(request: Request): boolean {
  return isKnownDomain(
    (request.body as DisableDomainRequest<SequentialDelayDomain, SequentialDelayDomainOptions>)
      .domain
  )
}

function authenticateDisableDomainRequest(request: Request): boolean {
  return verifyDisableDomainRequestAuthenticity(
    request.body as DisableDomainRequest<SequentialDelayDomain, SequentialDelayDomainOptions>
  )
}
