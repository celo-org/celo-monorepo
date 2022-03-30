import { OdisResponse, SignMessageRequest } from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { BLSCryptographyClient } from '../../bls/bls-cryptography-client'
import { Session } from '../session'

export class PnpSignSession extends Session<SignMessageRequest> {
  public constructor(
    readonly request: Request<{}, {}, SignMessageRequest>,
    readonly response: Response<OdisResponse<SignMessageRequest>>,
    readonly crypto: BLSCryptographyClient
  ) {
    super(request, response)
    // this.blsCryptoClient = new BLSCryptographyClient(
    //   config.keys.threshold,
    //   config.keys.pubKey,
    //   config.keys.polynomial
    // )
  }
}
