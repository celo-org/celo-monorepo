import {
  authenticateUser,
  hasValidAccountParam,
  hasValidBlindedPhoneNumberParam,
  identifierIsValidIfExists,
  isBodyReasonablySized,
  KEY_VERSION_HEADER,
  send,
  SignMessageRequest,
  SignMessageRequestSchema,
  SignMessageResponse,
  SignMessageResponseFailure,
  SignMessageResponseSuccess,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { Config, getVersion } from '../../config'
import { Key } from '../../key-management/key-provider-base'
import { getContractKit } from '../../web3/contracts'
import { IIOService } from '../io.interface'
import { PnpSession } from './session'

export class PnpSignIO implements IIOService<SignMessageRequest> {
  constructor(readonly config: Config) {}

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<SignMessageResponse>
  ): Promise<PnpSession<SignMessageRequest> | null> {
    const logger: Logger = response.locals.logger()
    if (!this.config.api.phoneNumberPrivacy.enabled) {
      this.sendFailure(WarningMessage.API_UNAVAILABLE, 503, response)
      return null
    }
    // if (this.getRequestKeyVersion(request, logger) ?? false) {
    //   this.sendFailure(WarningMessage.INVALID_KEY_VERSION_REQUEST, 400, response)
    //   return null
    // }
    if (!this.validate(request)) {
      this.sendFailure(WarningMessage.INVALID_INPUT, 400, response)
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
    return authenticateUser(request, getContractKit(), logger)
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
        warnings, // TODO(Alec): update handling of these types in combiner
      },
      status,
      response.locals.logger()
    )
    // Counters.responses.labels(this.endpoint, status.toString()).inc()
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
      response.locals.logger()
    )
    // Counters.responses.labels(this.endpoint, status.toString()).inc()
  }
}
