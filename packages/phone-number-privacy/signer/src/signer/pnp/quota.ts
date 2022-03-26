import {
  authenticateUser,
  CombinerEndpoint,
  ErrorType,
  getCombinerEndpoint,
  GetQuotaResponseFailure,
  GetQuotaResponseSuccess,
  hasValidAccountParam,
  identifierIsValidIfExists,
  isBodyReasonablySized,
  PnpQuotaRequest,
  PnpQuotaRequestSchema,
  send,
  SignerEndpoint,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { Counters, Histograms } from '../../common/metrics'
import { getVersion } from '../../config'
import { getRemainingQueryCount } from '../../signing/query-quota'
import { getBlockNumber, getContractKit } from '../../web3/contracts'
import { Controller } from '../controller'
import { Session } from '../session'

export class PnpQuota extends Controller<PnpQuotaRequest> {
  readonly endpoint: SignerEndpoint = SignerEndpoint.GET_QUOTA
  readonly combinerEndpoint: CombinerEndpoint = getCombinerEndpoint(this.endpoint)

  protected async _handle(session: Session<PnpQuotaRequest>): Promise<void> {
    // TODO(Alec)(Next)

    // TODO(Alec): de-dupe
    const meterGetQueryCountAndBlockNumber = Histograms.getBlindedSigInstrumentation
      .labels('getQueryCountAndBlockNumber')
      .startTimer()
    const [queryCountResult, blockNumberResult] = await Promise.allSettled([
      // Note: The database read of the user's performedQueryCount
      // included here resolves to 0 on error
      getRemainingQueryCount(
        session.logger,
        session.request.body.account,
        session.request.body.hashedPhoneNumber
      ),
      getBlockNumber(),
    ]).finally(meterGetQueryCountAndBlockNumber)

    const { performedQueryCount, totalQuota } =
      queryCountResult.status === 'fulfilled'
        ? queryCountResult.value
        : { performedQueryCount: undefined, totalQuota: undefined }
    const blockNumber =
      blockNumberResult.status === 'fulfilled' ? blockNumberResult.value : undefined

    // TODO(Alec): how do we want to represent errors here?

    this.sendSuccess(
      200,
      session.response,
      session.logger,
      performedQueryCount,
      totalQuota,
      blockNumber
    )

    // catch (err) {
    //   logger.error('Failed to get user quota')
    //   logger.error(err)
    //   sendFailureResponse(response, ErrorMessage.DATABASE_GET_FAILURE, 500, endpoint, logger)
    // }
  }

  protected validate(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, PnpQuotaRequest> {
    return (
      PnpQuotaRequestSchema.is(request.body) &&
      hasValidAccountParam(request.body) &&
      identifierIsValidIfExists(request.body) &&
      isBodyReasonablySized(request.body)
    )
  }

  protected async authenticate(
    request: Request<{}, {}, PnpQuotaRequest>,
    logger: Logger
  ): Promise<boolean> {
    return authenticateUser(request, getContractKit(), logger)
  }

  // protected headers(request: Request<{}, {}, PnpQuotaRequest>): HeaderInit | undefined {
  //   return {
  //     ...super.headers(request),
  //     ...(request.headers.authorization ? { Authorization: request.headers.authorization } : {}),
  //   }
  // }

  protected sendSuccess(
    status: number,
    response: Response<GetQuotaResponseSuccess>,
    logger: Logger,
    performedQueryCount?: number,
    totalQuota?: number,
    blockNumber?: number
  ) {
    send(
      response,
      {
        success: true,
        version: getVersion(),
        performedQueryCount,
        totalQuota,
        blockNumber,
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

  protected checkRequestKeyVersion(_request: Request<{}, {}, PnpQuotaRequest>): boolean {
    return true
  }
}
