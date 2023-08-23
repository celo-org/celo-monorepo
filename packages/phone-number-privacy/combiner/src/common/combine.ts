import {
  ErrorMessage,
  KeyVersionInfo,
  OdisRequest,
  OdisResponse,
  responseHasExpectedKeyVersion,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request } from 'express'
import * as t from 'io-ts'
import { PerformanceObserver } from 'perf_hooks'
import { fetchSignerResponseWithFallback, SignerResponse } from './io'

export interface Signer {
  url: string
  fallbackUrl?: string
}

export async function thresholdCallToSigners<R extends OdisRequest>(
  logger: Logger,
  signers: Signer[],
  endpoint: string,
  request: Request<{}, {}, R>,
  keyVersionInfo: KeyVersionInfo,
  keyVersion: number | null,
  requestTimeoutMS: number,
  responseSchema: t.Type<OdisResponse<R>, OdisResponse<R>, unknown>,
  processResult: (res: OdisResponse<R>) => Promise<boolean> = (_) => Promise.resolve(false)
): Promise<{ signerResponses: Array<SignerResponse<R>>; maxErrorCode?: number }> {
  const obs = new PerformanceObserver((list) => {
    // Possible race condition here: if multiple signers take exactly the same
    // amount of time, the PerformanceObserver callback may be called twice with
    // both entries present. Node 12 doesn't allow for entries to be deleted by name,
    // and eliminating the race condition requires a more significant redesign of
    // the measurement code.
    // This is only used for monitoring purposes, so a rare
    // duplicate latency measure for the signer should have minimal impact.
    list.getEntries().forEach((entry) => {
      logger.info({ latency: entry, signer: entry.name }, 'Signer response latency measured')
    })
  })
  obs.observe({ entryTypes: ['measure'], buffered: false })

  const manualAbort = new AbortController()
  const timeoutSignal = AbortSignal.timeout(requestTimeoutMS)
  const abortSignal = (AbortSignal as any).any([manualAbort.signal, timeoutSignal]) as AbortSignal

  let errorCount = 0
  const errorCodes: Map<number, number> = new Map<number, number>()

  const requiredThreshold = keyVersionInfo.threshold

  const responses: Array<SignerResponse<R>> = []
  // Forward request to signers
  // An unexpected error in handling the result for one signer should not
  // block a threshold of correct responses, but should be logged.
  await Promise.all(
    signers.map(async (signer) => {
      try {
        const signerFetchResult = await fetchSignerResponseWithFallback(
          signer,
          endpoint,
          keyVersionInfo.keyVersion,
          request,
          logger,
          abortSignal
        )

        if (!signerFetchResult.ok) {
          errorCount++
          errorCodes.set(
            signerFetchResult.status,
            (errorCodes.get(signerFetchResult.status) ?? 0) + 1
          )

          if (signers.length - errorCount < requiredThreshold) {
            logger.warn('Not possible to reach a threshold of signer responses. Failing fast')
            manualAbort.abort()
          }
          return
        }

        // if given key version, check that
        if (
          keyVersion != null &&
          !responseHasExpectedKeyVersion(signerFetchResult, keyVersion, logger)
        ) {
          throw new Error(ErrorMessage.INVALID_KEY_VERSION_RESPONSE)
        }

        const data: any = await signerFetchResult.json()
        logger.info(
          { signer, res: data, status: signerFetchResult.status },
          `received 'OK' response from signer`
        )

        const odisResponse: OdisResponse<R> = parseSchema(responseSchema, data, logger)
        if (!odisResponse.success) {
          logger.error(
            { err: odisResponse.error, signer: signer.url },
            `Signer request to failed with 'OK' status`
          )
          throw new Error(ErrorMessage.SIGNER_RESPONSE_FAILED_WITH_OK_STATUS)
        }

        responses.push({ res: odisResponse, url: signer.url })

        if (await processResult(odisResponse)) {
          // we already have enough responses
          manualAbort.abort()
        }
      } catch (err) {
        if (isTimeoutError(err)) {
          logger.error({ signer }, ErrorMessage.TIMEOUT_FROM_SIGNER)
        } else if (isAbortError(err)) {
          logger.info({ signer }, WarningMessage.CANCELLED_REQUEST_TO_SIGNER)
        } else {
          // Logging the err & message simultaneously fails to log the message in some cases
          logger.error({ signer }, ErrorMessage.SIGNER_REQUEST_ERROR)
          logger.error({ signer, err })

          // Tracking failed request count via signer url prevents
          // double counting the same failed request by mistake
          errorCount++
          if (signers.length - errorCount < requiredThreshold) {
            logger.warn('Not possible to reach a threshold of signer responses. Failing fast')
            manualAbort.abort()
          }

          // TODO (mcortesi) doesn't seem we need to fail at first error
          // throw err
        }
      }
    })
  )

  // DO NOT call performance.clearMarks() as this also deletes marks used to
  // measure e2e combiner latency.
  obs.disconnect()

  if (errorCodes.size > 1) {
    logger.error(
      { errorCodes: JSON.stringify([...errorCodes]) },
      ErrorMessage.INCONSISTENT_SIGNER_RESPONSES
    )

    return { signerResponses: responses, maxErrorCode: getMajorityErrorCode(errorCodes) }
  } else {
    return { signerResponses: responses }
  }
}

function parseSchema<T>(schema: t.Type<T, T, unknown>, data: unknown, logger: Logger): T {
  if (!schema.is(data)) {
    logger.error({ data }, `Malformed schema`)
    throw new Error(ErrorMessage.INVALID_SIGNER_RESPONSE)
  }
  return data
}

function isTimeoutError(err: unknown) {
  return err instanceof Error && err.name === 'TimeoutError'
}

function isAbortError(err: unknown) {
  return err instanceof Error && err.name === 'AbortError'
}

function getMajorityErrorCode(errorCodes: Map<number, number>): number {
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
  return maxErrorCode
}
