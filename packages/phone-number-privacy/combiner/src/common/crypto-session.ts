import { OdisResponse } from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { CryptoClient } from './crypto-clients/common'
import { Session } from './session'
import { OdisSignatureRequest } from './sign'

export class CryptoSession<R extends OdisSignatureRequest> extends Session<R> {
  public constructor(
    readonly request: Request<{}, {}, R>,
    readonly response: Response<OdisResponse<R>>,
    readonly crypto: CryptoClient
  ) {
    super(request, response)
  }
}
