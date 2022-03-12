import {
  CombinerEndpoint,
  DomainRequest,
  GetBlindedMessageSigRequest,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'

export type DistributedRequest = GetBlindedMessageSigRequest | DomainRequest

export interface ICombinerService {
  handleDistributedRequest(
    request: Request<{}, {}, unknown>,
    response: Response,
    endpoint: CombinerEndpoint
  ): Promise<void>
}
