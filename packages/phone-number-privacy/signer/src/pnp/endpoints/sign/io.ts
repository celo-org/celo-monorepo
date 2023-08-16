import {
  authenticateUser,
  DataEncryptionKeyFetcher,
  ErrorType,
  hasValidAccountParam,
  hasValidBlindedPhoneNumberParam,
  isBodyReasonablySized,
  requestHasValidKeyVersion,
  SignerEndpoint,
  SignMessageRequest,
  SignMessageRequestSchema,
  SignMessageResponse,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { IO } from '../../../common/io'

import opentelemetry, { SpanStatusCode } from '@opentelemetry/api'
import { SemanticAttributes } from '@opentelemetry/semantic-conventions'
import { sendFailure } from '../../../common/handler'
const tracer = opentelemetry.trace.getTracer('signer-tracer')

export class PnpSignIO extends IO<SignMessageRequest> {
  readonly endpoint = SignerEndpoint.PNP_SIGN

  constructor(
    readonly enabled: boolean,
    readonly shouldFailOpen: boolean,
    readonly dekFetcher: DataEncryptionKeyFetcher
  ) {
    super(enabled)
  }

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<SignMessageResponse>
  ): Promise<[false, null] | [true, string[]]> {
    const span = tracer.startSpan('pnpSignIO - Init')

    try {
      const logger = response.locals.logger

      if (!super.inputChecks(request, response)) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: response.statusMessage,
        })

        return [false, null]
      }

      if (!requestHasValidKeyVersion(request, logger)) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: WarningMessage.INVALID_KEY_VERSION_REQUEST,
        })

        span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, 400)
        sendFailure(WarningMessage.INVALID_KEY_VERSION_REQUEST, 400, response)

        return [false, null]
      }

      const warnings: ErrorType[] = []
      if (
        !(await authenticateUser(request, logger, this.dekFetcher, this.shouldFailOpen, warnings))
      ) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: WarningMessage.UNAUTHENTICATED_USER,
        })
        span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, 401)
        sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)

        return [false, null]
      }

      span.setStatus({
        code: SpanStatusCode.OK,
        message: response.statusMessage,
      })

      return [true, warnings]
    } finally {
      span.end()
    }
  }

  validate(request: Request<{}, {}, unknown>): request is Request<{}, {}, SignMessageRequest> {
    return (
      SignMessageRequestSchema.is(request.body) &&
      hasValidAccountParam(request.body) &&
      hasValidBlindedPhoneNumberParam(request.body) &&
      isBodyReasonablySized(request.body)
    )
  }
}
