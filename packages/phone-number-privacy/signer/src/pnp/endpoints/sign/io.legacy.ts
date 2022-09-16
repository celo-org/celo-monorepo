import { ContractKit } from '@celo/contractkit'
import {
  authenticateUser,
  ErrorMessage,
  ErrorType,
  hasValidAccountParam,
  hasValidBlindedPhoneNumberParam,
  identifierIsValidIfExists,
  isBodyReasonablySized,
  KEY_VERSION_HEADER,
  PnpQuotaStatus,
  send,
  SignerEndpoint,
  SignMessageRequest,
  SignMessageRequestSchema,
  SignMessageResponse,
  SignMessageResponseFailure,
  SignMessageResponseSuccess,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { IO } from '../../../common/io'
import { Key } from '../../../common/key-management/key-provider-base'
import { Counters } from '../../../common/metrics'
import { getVersion } from '../../../config'
import { PnpSession } from '../../session'

export class LegacyPnpSignIO extends IO<SignMessageRequest> {
  readonly endpoint = SignerEndpoint.LEGACY_PNP_SIGN

  constructor(
    readonly enabled: boolean,
    readonly shouldFailOpen: boolean,
    readonly kit: ContractKit
  ) {
    super(enabled)
  }

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<SignMessageResponse>
  ): Promise<PnpSession<SignMessageRequest> | null> {
    const logger = response.locals.logger
    const warnings: ErrorType[] = []
    if (!super.inputChecks(request, response)) {
      return null
    }
    if (!this.requestHasValidKeyVersion(request, logger)) {
      this.sendFailure(WarningMessage.INVALID_KEY_VERSION_REQUEST, 400, response)
      return null
    }
    if (!(await this.authenticate(request, warnings, logger))) {
      this.sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return null
    }
    const session = new PnpSession(request, response)
    session.errors.push(...warnings)
    return session
  }

  validate(request: Request<{}, {}, unknown>): request is Request<{}, {}, SignMessageRequest> {
    return (
      SignMessageRequestSchema.is(request.body) &&
      hasValidAccountParam(request.body) &&
      hasValidBlindedPhoneNumberParam(request.body) &&
      identifierIsValidIfExists(request.body) &&
      isBodyReasonablySized(request.body)
    )
  }

  async authenticate(
    request: Request<{}, {}, SignMessageRequest>,
    warnings: string[],
    logger: Logger
  ): Promise<boolean> {
    const { success, failedOpen } = await authenticateUser(
      request,
      this.kit,
      logger,
      this.shouldFailOpen
    )

    if (failedOpen) {
      warnings.push(ErrorMessage.FAILURE_TO_GET_DEK)
      logger.error({ warning: ErrorMessage.FAILURE_TO_GET_DEK }, ErrorMessage.FAILING_OPEN)
    }

    return success
  }

  sendSuccess(
    status: number,
    response: Response<SignMessageResponseSuccess>,
    key: Key,
    signature: string,
    quotaStatus: PnpQuotaStatus,
    warnings?: string[]
  ) {
    response.set(KEY_VERSION_HEADER, key.version.toString())
    send(
      response,
      {
        success: true,
        version: getVersion(),
        signature,
        ...quotaStatus,
        warnings,
      },
      status,
      response.locals.logger
    )
    Counters.responses.labels(this.endpoint, status.toString()).inc()
  }

  sendFailure(
    error: string,
    status: number,
    response: Response<SignMessageResponseFailure>,
    performedQueryCount?: number,
    totalQuota?: number,
    blockNumber?: number
  ) {
    send(
      response,
      {
        success: false,
        version: getVersion(),
        error,
        performedQueryCount,
        totalQuota,
        blockNumber,
      },
      status,
      response.locals.logger
    )
    Counters.responses.labels(this.endpoint, status.toString()).inc()
  }
}
