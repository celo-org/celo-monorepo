import {
  CombinerEndpoint,
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureRequestSchema,
  DomainRestrictedSignatureResponse,
  domainRestrictedSignatureResponseSchema,
  DomainRestrictedSignatureResponseSuccess,
  DomainSchema,
  DomainState,
  getSignerEndpoint,
  send,
  SequentialDelayDomainStateSchema,
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
import { getCombinerVersion } from '../../../config'

export class DomainSignIO extends IO<DomainRestrictedSignatureRequest> {
  readonly endpoint = CombinerEndpoint.DOMAIN_SIGN
  readonly signerEndpoint = getSignerEndpoint(this.endpoint)
  readonly requestSchema: t.Type<
    DomainRestrictedSignatureRequest,
    DomainRestrictedSignatureRequest,
    unknown
  > = domainRestrictedSignatureRequestSchema(DomainSchema)
  readonly responseSchema: t.Type<
    DomainRestrictedSignatureResponse,
    DomainRestrictedSignatureResponse,
    unknown
  > = domainRestrictedSignatureResponseSchema(SequentialDelayDomainStateSchema)

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<DomainRestrictedSignatureResponse>
  ): Promise<CryptoSession<DomainRestrictedSignatureRequest> | null> {
    if (!super.inputChecks(request, response)) {
      return null
    }
    if (!requestHasSupportedKeyVersion(request, this.config, response.locals.logger)) {
      sendFailure(WarningMessage.INVALID_KEY_VERSION_REQUEST, 400, response)
      return null
    }
    if (!(await this.authenticate(request))) {
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

  authenticate(request: Request<{}, {}, DomainRestrictedSignatureRequest>): Promise<boolean> {
    // Note that signing requests may include a nonce for replay protection that will be checked by
    // the signer, but is not checked here. As a result, requests that pass the authentication check
    // here may still fail when sent to the signer.
    return Promise.resolve(verifyDomainRestrictedSignatureRequestAuthenticity(request.body))
  }

  sendSuccess(
    status: number,
    response: Response<DomainRestrictedSignatureResponseSuccess>,
    signature: string,
    domainState: DomainState
  ) {
    send(
      response,
      {
        success: true,
        version: getCombinerVersion(),
        signature,
        status: domainState,
      },
      status,
      response.locals.logger
    )
  }
}
