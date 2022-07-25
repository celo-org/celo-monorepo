import { ContractKit } from '@celo/contractkit'
import {
  authenticateUser,
  hasValidAccountParam,
  hasValidBlindedPhoneNumberParam,
  identifierIsValidIfExists,
  isBodyReasonablySized,
  KEY_VERSION_HEADER,
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
import { Counters } from '../../../../common/metrics'
import { getVersion } from '../../../../config'
import { Key } from '../../../../key-management/key-provider-base'
import { IO } from '../../../base/io'
import { PnpSession } from '../../session'

export class PnpSignIO extends IO<SignMessageRequest> {
  readonly endpoint = SignerEndpoint.PNP_SIGN

  constructor(enabled: boolean, readonly kit: ContractKit) {
    super(enabled)
  }

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<SignMessageResponse>
  ): Promise<PnpSession<SignMessageRequest> | null> {
    const logger = response.locals.logger
    if (!super.inputChecks(request, response)) {
      return null
    }
    if (!this.requestHasValidKeyVersion(request, logger)) {
      this.sendFailure(WarningMessage.INVALID_KEY_VERSION_REQUEST, 400, response)
      return null
    }
    if (!(await this.authenticate(request, logger))) {
      this.sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return null
    }
    return new PnpSession(request, response)
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
    logger: Logger
  ): Promise<boolean> {
    return authenticateUser(request, this.kit, logger)
  }

  sendSuccess(
    status: number,
    response: Response<SignMessageResponseSuccess>,
    key: Key,
    signature: string,
    performedQueryCount?: number,
    totalQuota?: number,
    blockNumber?: number,
    warnings?: string[]
  ) {
    response.set(KEY_VERSION_HEADER, key.version.toString())
    send(
      response,
      {
        success: true,
        version: getVersion(),
        signature,
        performedQueryCount,
        totalQuota,
        blockNumber,
        warnings, // TODO(Alec)(pnp): update handling of these types in combiner
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
    queryCount?: number,
    totalQuota?: number,
    blockNumber?: number
  ) {
    send(
      response,
      {
        success: false,
        version: getVersion(),
        error,
        performedQueryCount: queryCount,
        totalQuota,
        blockNumber,
      },
      status,
      response.locals.logger
    )
    Counters.responses.labels(this.endpoint, status.toString()).inc()
  }
}
