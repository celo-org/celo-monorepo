import {
  authenticateUser,
  CombinerEndpoint,
  ErrorType,
  getCombinerEndpoint,
  GetQuotaRequest,
  GetQuotaResponseFailure,
  GetQuotaResponseSuccess,
  OdisResponse,
  send,
  SignerEndpoint,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { Counters } from '../../common/metrics'
import { getVersion } from '../../config'
import { getContractKit } from '../../web3/contracts'
import { Session } from '../session'
import { Signer } from '../signer'

export class PnpQuota extends Signer<GetQuotaRequest> {
  readonly endpoint: SignerEndpoint = SignerEndpoint.GET_QUOTA
  readonly combinerEndpoint: CombinerEndpoint = getCombinerEndpoint(this.endpoint)

  protected async _handle(
    request: Request<{}, {}, GetQuotaRequest>,
    response: Response<OdisResponse<GetQuotaRequest>>,
    session: Session<GetQuotaRequest>
  ): Promise<void> {
    // TODO(Alec)(Next)
  }

  protected validate(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, GetQuotaRequest> {
    // return (
    //   // TODO(Alec): add io-ts schemas for phone number privacy
    //   hasValidAccountParam(request.body as GetQuotaRequest) &&
    //   hasValidBlindedPhoneNumberParam(request.body as GetQuotaRequest) &&
    //   identifierIsValidIfExists(request.body as GetQuotaRequest) &&
    //   isBodyReasonablySized(request.body as GetQuotaRequest)
    // )
    return true
  }

  protected async authenticate(
    request: Request<{}, {}, GetQuotaRequest>,
    logger: Logger
  ): Promise<boolean> {
    return authenticateUser(request, getContractKit(), logger)
  }

  // protected headers(request: Request<{}, {}, GetQuotaRequest>): HeaderInit | undefined {
  //   return {
  //     ...super.headers(request),
  //     ...(request.headers.authorization ? { Authorization: request.headers.authorization } : {}),
  //   }
  // }

  protected sendSuccess(
    status: number,
    response: Response<GetQuotaResponseSuccess>,
    logger: Logger
  ) {
    send(
      response,
      {
        success: true,
        version: getVersion(),
      },
      status,
      logger
    )
    Counters.responses.labels(this.endpoint, status.toString()).inc()
  }

  protected sendFailure(
    error: ErrorType,
    status: number,
    response: Response<GetQuotaResponseFailure>,
    logger: Logger,
    performedQueryCount?: number,
    totalQuota?: number,
    blockNumber?: number
  ) {
    send(
      response,
      {
        success: false,
        version: getVersion(),
        error,
        performedQueryCount,
        totalQuota,
        blockNumber,
      },
      status,
      logger
    )
    Counters.responses.labels(this.endpoint, status.toString()).inc()
  }

  protected checkRequestKeyVersion(_request: Request<{}, {}, GetQuotaRequest>): boolean {
    return true
  }
}
