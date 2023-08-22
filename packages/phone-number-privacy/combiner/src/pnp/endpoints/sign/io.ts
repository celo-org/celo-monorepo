import { ContractKit } from '@celo/contractkit'
import {
  authenticateUser,
  CombinerEndpoint,
  DataEncryptionKeyFetcher,
  hasValidAccountParam,
  hasValidBlindedPhoneNumberParam,
  isBodyReasonablySized,
  SignMessageRequest,
  SignMessageRequestSchema,
  SignMessageResponse,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
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
import { OdisConfig } from '../../../config'

export class PnpSignIO extends IO<SignMessageRequest> {
  readonly requestSchema: t.Type<SignMessageRequest, SignMessageRequest, unknown> =
    SignMessageRequestSchema

  constructor(
    config: OdisConfig,
    readonly kit: ContractKit,
    readonly dekFetcher: DataEncryptionKeyFetcher
  ) {
    super(config, CombinerEndpoint.PNP_SIGN)
  }

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<SignMessageResponse>
  ): Promise<Session<SignMessageRequest> | null> {
    if (!this.validateClientRequest(request)) {
      sendFailure(WarningMessage.INVALID_INPUT, 400, response)
      return null
    }
    if (!requestHasSupportedKeyVersion(request, this.config, response.locals.logger)) {
      sendFailure(WarningMessage.INVALID_KEY_VERSION_REQUEST, 400, response)
      return null
    }
    if (!(await authenticateUser(request, response.locals.logger, this.dekFetcher))) {
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
}
