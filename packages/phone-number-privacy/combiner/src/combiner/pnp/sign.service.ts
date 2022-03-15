import {
  CombinerEndpoint,
  ErrorType,
  GetBlindedMessageSigRequest,
  getSignerEndpoint,
  MAX_BLOCK_DISCREPANCY_THRESHOLD,
  respondWithError,
  SignerEndpoint,
  SignMessageResponse,
  SignMessageResponseFailure,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { HeaderInit } from 'node-fetch'
import { OdisConfig, VERSION } from '../../config'
import { SignerResponseWithStatus } from '../combiner.service'
import { IInputService } from '../input.interface'
import { SignService } from '../sign.service'

interface PnpSignResponseWithStatus extends SignerResponseWithStatus {
  url: string
  res: SignMessageResponse
  status: number
}
export class PnpSignService extends SignService {
  protected endpoint: CombinerEndpoint
  protected signerEndpoint: SignerEndpoint
  protected responses: PnpSignResponseWithStatus[]

  public constructor(config: OdisConfig, protected inputService: IInputService) {
    super(config, inputService)
    this.endpoint = CombinerEndpoint.SIGN_MESSAGE
    this.signerEndpoint = getSignerEndpoint(this.endpoint)
    this.responses = []
  }

  protected headers(request: Request<{}, {}, GetBlindedMessageSigRequest>): HeaderInit | undefined {
    return {
      ...super.headers(request),
      Authorization: request.headers.authorization!,
    }
  }

  protected parseBlindedMessage(req: GetBlindedMessageSigRequest): string {
    return req.blindedQueryPhoneNumber
  }

  protected parseSignature(res: SignMessageResponse, signerUrl: string): string | undefined {
    if (!res.success) {
      this.logger.error(
        {
          error: res.error,
          signer: signerUrl,
        },
        'Signer responded with error'
      )
      // Continue on failure as long as signature is present to unblock user
    }
    return res.signature
  }

  protected sendFailureResponse(
    response: Response<SignMessageResponseFailure>,
    error: ErrorType,
    status: number,
    performedQueryCount?: number,
    totalQuota?: number,
    blockNumber?: number
  ) {
    respondWithError(
      response,
      {
        success: false,
        version: VERSION,
        error,
        performedQueryCount,
        totalQuota,
        blockNumber,
      },
      status,
      this.logger
    )
  }

  // TODO(Alec): clean this up
  protected logResponseDiscrepancies(): void {
    // Only compare responses which have values for the quota fields
    const successes = this.responses.filter(
      (signerResponse) =>
        signerResponse.res &&
        signerResponse.res.performedQueryCount &&
        signerResponse.res.totalQuota &&
        signerResponse.res.blockNumber
    )

    if (successes.length === 0) {
      return
    }
    // Compare the first response to the rest of the responses
    const expectedQueryCount = successes[0].res.performedQueryCount
    const expectedTotalQuota = successes[0].res.totalQuota
    const expectedBlockNumber = successes[0].res.blockNumber!
    let discrepancyFound = false
    for (const signerResponse of successes) {
      // Performed query count should never diverge; however the totalQuota may
      // diverge if the queried block number is different
      if (
        signerResponse.res.performedQueryCount !== expectedQueryCount ||
        (signerResponse.res.totalQuota !== expectedTotalQuota &&
          signerResponse.res.blockNumber === expectedBlockNumber)
      ) {
        const values = successes.map((_signerResponse) => {
          return {
            signer: _signerResponse.url,
            performedQueryCount: _signerResponse.res.performedQueryCount,
            totalQuota: _signerResponse.res.totalQuota,
          }
        })
        this.logger.error({ values }, WarningMessage.INCONSISTENT_SIGNER_QUOTA_MEASUREMENTS)
        discrepancyFound = true
      }
      if (
        Math.abs(signerResponse.res.blockNumber! - expectedBlockNumber) >
        MAX_BLOCK_DISCREPANCY_THRESHOLD
      ) {
        const values = successes.map((response) => {
          return {
            signer: response.url,
            blockNumber: response.res.blockNumber,
          }
        })
        this.logger.error({ values }, WarningMessage.INCONSISTENT_SIGNER_BLOCK_NUMBERS)
        discrepancyFound = true
      }
      if (discrepancyFound) {
        return
      }
    }
  }
}
