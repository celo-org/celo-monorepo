import {
  CombinerEndpoint,
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureRequestSchema,
  DomainRestrictedSignatureResponse,
  DomainSchema,
  verifyDomainRestrictedSignatureRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import * as t from 'io-ts'
import { DomainCryptoClient } from '../../../common/crypto-clients/domain-crypto-client'
import { CryptoSession } from '../../../common/crypto-session'
import {
  getKeyVersionInfo,
  IO,
  requestHasSupportedKeyVersion,
  sendFailure,
} from '../../../common/io'
import { OdisConfig } from '../../../config'

export class DomainSignIO extends IO<DomainRestrictedSignatureRequest> {
  readonly requestSchema: t.Type<
    DomainRestrictedSignatureRequest,
    DomainRestrictedSignatureRequest,
    unknown
  > = domainRestrictedSignatureRequestSchema(DomainSchema)

  constructor(config: OdisConfig) {
    super(config, CombinerEndpoint.DOMAIN_SIGN)
  }

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<DomainRestrictedSignatureResponse>
  ): Promise<CryptoSession<DomainRestrictedSignatureRequest> | null> {
    if (!this.validateClientRequest(request)) {
      sendFailure(WarningMessage.INVALID_INPUT, 400, response)
      return null
    }
    if (!requestHasSupportedKeyVersion(request, this.config, response.locals.logger)) {
      sendFailure(WarningMessage.INVALID_KEY_VERSION_REQUEST, 400, response)
      return null
    }

    // Note that signing requests may include a nonce for replay protection that will be checked by
    // the signer, but is not checked here. As a result, requests that pass the authentication check
    // here may still fail when sent to the signer.
    if (!verifyDomainRestrictedSignatureRequestAuthenticity(request.body)) {
      sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return null
    }
    const keyVersionInfo = getKeyVersionInfo(request, this.config, response.locals.logger)
    return new CryptoSession(
      request,
      response,
      keyVersionInfo,
      new DomainCryptoClient(keyVersionInfo)
    )
  }
}
