import { DomainRestrictedSignatureRequest, OdisResponse } from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { BLSCryptographyClient } from '../../bls/bls-cryptography-client'
import { OdisConfig } from '../../config'
import { Session } from '../session'

export class DomainSignSession extends Session<DomainRestrictedSignatureRequest> {
  readonly blsCryptoClient: BLSCryptographyClient

  public constructor(
    readonly request: Request<{}, {}, DomainRestrictedSignatureRequest>,
    readonly response: Response<OdisResponse<DomainRestrictedSignatureRequest>>,
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