import {
  DomainRestrictedSignatureRequest,
  OdisResponse,
  SignMessageRequest,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { CryptoClient } from './crypto-clients/common'
import { Session } from './session'

export class CryptoSession<
  R extends DomainRestrictedSignatureRequest | SignMessageRequest
> extends Session<R> {
  public constructor(
    readonly request: Request<{}, {}, R>,
    readonly response: Response<OdisResponse<R>>,
    readonly crypto: CryptoClient
  ) {
    super(request, response)
  }
}
