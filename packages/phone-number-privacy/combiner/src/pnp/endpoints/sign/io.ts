import { ContractKit } from '@celo/contractkit'
import {
  CombinerEndpoint,
  hasValidAccountParam,
  hasValidBlindedPhoneNumberParam,
  isBodyReasonablySized,
  PnpQuotaStatus,
  send,
  SignMessageRequest,
  SignMessageRequestSchema,
  SignMessageResponse,
  SignMessageResponseSchema,
  SignMessageResponseSuccess,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import * as t from 'io-ts'
import { BLSCryptographyClient } from '../../../common/crypto-clients/bls-crypto-client'
import { CryptoSession } from '../../../common/crypto-session'
import {
  getKeyVersionInfo,
  IO,
  requestHasSupportedKeyVersion,
  sendFailure,
} from '../../../common/io'
import { Session } from '../../../common/session'
import { getCombinerVersion, OdisConfig } from '../../../config'

export class PnpSignIO extends IO<SignMessageRequest> {
  readonly requestSchema: t.Type<SignMessageRequest, SignMessageRequest, unknown> =
    SignMessageRequestSchema
  readonly responseSchema: t.Type<SignMessageResponse, SignMessageResponse, unknown> =
    SignMessageResponseSchema

  constructor(config: OdisConfig, readonly kit: ContractKit) {
    super(config, CombinerEndpoint.PNP_SIGN)
  }

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<SignMessageResponse>
  ): Promise<Session<SignMessageRequest> | null> {
    if (!super.inputChecks(request, response)) {
      return null
    }
    if (!requestHasSupportedKeyVersion(request, this.config, response.locals.logger)) {
      sendFailure(WarningMessage.INVALID_KEY_VERSION_REQUEST, 400, response)
      return null
    }
    if (!(await this.authenticate(request, response.locals.logger))) {
      sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return null
    }
    const keyVersionInfo = getKeyVersionInfo(request, this.config, response.locals.logger)
    return new CryptoSession(
      request,
      response,
      keyVersionInfo,
      new BLSCryptographyClient(keyVersionInfo)
    )
  }

  validateClientRequest(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, SignMessageRequest> {
    return (
      super.validateClientRequest(request) &&
      hasValidAccountParam(request.body) &&
      hasValidBlindedPhoneNumberParam(request.body) &&
      isBodyReasonablySized(request.body)
    )
  }

  async authenticate(
    _request: Request<{}, {}, SignMessageRequest>,
    _logger: Logger
  ): Promise<boolean> {
    return Promise.resolve(true)
    // return authenticateUser(
    //   request,
    //   logger,
    //   newContractKitFetcher(
    //     this.kit,
    //     logger,
    //     this.config.fullNodeTimeoutMs,
    //     this.config.fullNodeRetryCount,
    //     this.config.fullNodeRetryDelayMs
    //   )
    // )
  }

  sendSuccess(
    status: number,
    response: Response<SignMessageResponseSuccess>,
    signature: string,
    quotaStatus: PnpQuotaStatus,
    warnings: string[]
  ) {
    send(
      response,
      {
        success: true,
        version: getCombinerVersion(),
        signature,
        ...quotaStatus,
        warnings,
      },
      status,
      response.locals.logger
    )
  }
}
