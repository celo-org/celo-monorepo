import { ContractKit } from '@celo/contractkit'
import {
  authenticateUser,
  ErrorType,
  hasValidAccountParam,
  hasValidBlindedPhoneNumberParam,
  identifierIsValidIfExists,
  isBodyReasonablySized,
  KEY_VERSION_HEADER,
  LegacySignMessageRequest,
  LegacySignMessageRequestSchema,
  PnpQuotaStatus,
  requestHasValidKeyVersion,
  send,
  SignerEndpoint,
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
import { getSignerVersion } from '../../../config'
import { PnpSession } from '../../session'

export class LegacyPnpSignIO extends IO<LegacySignMessageRequest> {
  readonly endpoint = SignerEndpoint.LEGACY_PNP_SIGN

  constructor(
    readonly enabled: boolean,
    readonly shouldFailOpen: boolean,
    readonly timeoutMs: number,
    readonly retryCount: number,
    readonly retryDelayMs: number,
    readonly kit: ContractKit
  ) {
    super(enabled)
  }

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<SignMessageResponse>
  ): Promise<PnpSession<LegacySignMessageRequest> | null> {
    const logger = response.locals.logger
    const warnings: ErrorType[] = []
    if (!super.inputChecks(request, response)) {
      return null
    }
    if (!requestHasValidKeyVersion(request, logger)) {
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

  validate(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, LegacySignMessageRequest> {
    return (
      LegacySignMessageRequestSchema.is(request.body) &&
      hasValidAccountParam(request.body) &&
      hasValidBlindedPhoneNumberParam(request.body) &&
      identifierIsValidIfExists(request.body) &&
      isBodyReasonablySized(request.body)
    )
  }

  async authenticate(
    request: Request<{}, {}, LegacySignMessageRequest>,
    warnings: ErrorType[],
    logger: Logger
  ): Promise<boolean> {
    return authenticateUser(
      request,
      this.kit,
      logger,
      this.shouldFailOpen,
      warnings,
      this.timeoutMs,
      this.retryCount,
      this.retryDelayMs
    )
  }

  sendSuccess(
    status: number,
    response: Response<SignMessageResponseSuccess>,
    key: Key,
    signature: string,
    quotaStatus: PnpQuotaStatus,
    warnings: string[]
  ) {
    response.set(KEY_VERSION_HEADER, key.version.toString())
    send(
      response,
      {
        success: true,
        version: getSignerVersion(),
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
    quotaStatus?: PnpQuotaStatus
  ) {
    send(
      response,
      {
        success: false,
        version: getSignerVersion(),
        error,
        ...quotaStatus,
      },
      status,
      response.locals.logger
    )
    Counters.responses.labels(this.endpoint, status.toString()).inc()
  }
}
