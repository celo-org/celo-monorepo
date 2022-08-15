import {
  DomainRestrictedSignatureRequest,
  OdisResponse,
  SignMessageRequest,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { CombinerCryptoClient } from './crypto-clients/crypto-client'
import { Session } from './session'

export class CryptoSession<
  R extends DomainRestrictedSignatureRequest | SignMessageRequest
> extends Session<R> {
  public constructor(
    readonly request: Request<{}, {}, R>,
    readonly response: Response<OdisResponse<R>>,
    readonly crypto: CombinerCryptoClient
  ) {
    super(request, response)
  }
}
