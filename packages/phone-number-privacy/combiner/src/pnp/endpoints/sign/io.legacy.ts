import { ContractKit } from '@celo/contractkit'
import {
  authenticateUser,
  CombinerEndpoint,
  ErrorType,
  getSignerEndpoint,
  hasValidAccountParam,
  hasValidBlindedPhoneNumberParam,
  identifierIsValidIfExists,
  isBodyReasonablySized,
  send,
  SignerEndpoint,
  SignMessageRequest,
  SignMessageRequestSchema,
  SignMessageResponse,
  SignMessageResponseFailure,
  SignMessageResponseSchema,
  SignMessageResponseSuccess,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import * as t from 'io-ts'
import { BLSCryptographyClient } from '../../../common/crypto-clients/bls-crypto-client'
import { CryptoSession } from '../../../common/crypto-session'
import { IO } from '../../../common/io'
import { OdisConfig, VERSION } from '../../../config'

export class LegacyPnpSignIO extends IO<SignMessageRequest> {
  readonly endpoint: CombinerEndpoint = CombinerEndpoint.LEGACY_PNP_SIGN
  readonly signerEndpoint: SignerEndpoint = getSignerEndpoint(this.endpoint)
  readonly requestSchema: t.Type<
    SignMessageRequest,
    SignMessageRequest,
    unknown
  > = SignMessageRequestSchema
  readonly responseSchema: t.Type<
    SignMessageResponse,
    SignMessageResponse,
    unknown
  > = SignMessageResponseSchema

  constructor(readonly config: OdisConfig, readonly kit: ContractKit) {
    super(config)
  }

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<SignMessageResponse>
  ): Promise<CryptoSession<SignMessageRequest> | null> {
    if (!super.inputChecks(request, response)) {
      return null
    }
    if (!this.requestHasValidKeyVersion(request, response.locals.logger)) {
      this.sendFailure(WarningMessage.INVALID_KEY_VERSION_REQUEST, 400, response)
      return null
    }
    if (!(await this.authenticate(request, response.locals.logger))) {
      this.sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return null
    }
    return new CryptoSession(request, response, new BLSCryptographyClient(this.config))
  }

  validateClientRequest(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, SignMessageRequest> {
    return (
      super.validateClientRequest(request) &&
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
    return authenticateUser(request, this.kit, logger, this.config.shouldFailOpen)
  }

  sendSuccess(
    status: number,
    response: Response<SignMessageResponseSuccess>,
    warnings: string[],
    signature: string,
    performedQueryCount: number,
    totalQuota: number,
    blockNumber?: number
  ) {
    send(
      response,
      {
        success: true,
        version: VERSION,
        signature,
        performedQueryCount,
        totalQuota,
        blockNumber,
        warnings,
      },
      status,
      response.locals.logger
    )
  }

  sendFailure(
    error: ErrorType,
    status: number,
    response: Response<SignMessageResponseFailure>,
    performedQueryCount?: number,
    totalQuota?: number,
    blockNumber?: number,
    signature?: string
  ) {
    send(
      response,
      {
        success: false,
        version: VERSION,
        error,
        performedQueryCount,
        totalQuota,
        blockNumber,
        signature,
      },
      status,
      response.locals.logger
    )
  }
}
