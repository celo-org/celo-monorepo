import { OdisResponse, SignMessageRequest } from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { BLSCryptographyClient } from '../../bls/bls-cryptography-client'
import { OdisConfig } from '../../config'
import { Session } from '../session'

export class PnpSignSession extends Session<SignMessageRequest> {
  readonly blsCryptoClient: BLSCryptographyClient

  public constructor(
    readonly request: Request<{}, {}, SignMessageRequest>,
    readonly response: Response<OdisResponse<SignMessageRequest>>,
    readonly config: OdisConfig
  ) {
    super(request, response)
    this.blsCryptoClient = new BLSCryptographyClient(
      config.keys.threshold,
      config.keys.pubKey,
      config.keys.polynomial
    )
  }
}