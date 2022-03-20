import { SignMessageRequest } from '@celo/identity/lib/odis/query'
import {
  authenticateUser,
  CombinerEndpoint,
  ErrorType,
  getSignerEndpoint,
  hasValidAccountParam,
  hasValidBlindedPhoneNumberParam,
  identifierIsValidIfExists,
  isBodyReasonablySized,
  MAX_BLOCK_DISCREPANCY_THRESHOLD,
  respondWithError,
  SignerEndpoint,
  SignMessageResponse,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request } from 'express'
import { HeaderInit } from 'node-fetch'
import { OdisConfig, VERSION } from '../../config'
import { getContractKit } from '../../web3/contracts'
import { Session } from '../session'
import { SignService } from '../sign.service'
export class PnpSignService extends SignService<SignMessageRequest> {
  readonly endpoint: CombinerEndpoint
  readonly signerEndpoint: SignerEndpoint

  public constructor(config: OdisConfig) {
    super(config)
    this.endpoint = CombinerEndpoint.SIGN_MESSAGE
    this.signerEndpoint = getSignerEndpoint(this.endpoint)
  }

  protected validate(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, SignMessageRequest> {
    return (
      // TODO(Alec): add io-ts schemas for phone number privacy
      hasValidAccountParam(request.body as SignMessageRequest) &&
      hasValidBlindedPhoneNumberParam(request.body as SignMessageRequest) &&
      identifierIsValidIfExists(request.body as SignMessageRequest) &&
      isBodyReasonablySized(request.body as SignMessageRequest)
    )
  }

  protected async authenticate(
    request: Request<{}, {}, SignMessageRequest>,
    logger: Logger
  ): Promise<boolean> {
    return authenticateUser(request, getContractKit(), logger)
  }

  protected async combine(session: Session<SignMessageRequest>): Promise<void> {
    this.logResponseDiscrepancies(session)

    if (session.blsCryptoClient.hasSufficientSignatures()) {
      try {
        const combinedSignature = await session.blsCryptoClient.combinePartialBlindedSignatures(
          this.parseBlindedMessage(session.request.body),
          session.logger
        )
        // TODO(Alec)(Next)(responding): return other fields?
        return this.sendSuccessResponse(
          {
            success: true,
            version: VERSION,
            signature: combinedSignature,
          },
          200,
          session
        )
      } catch {
        // May fail upon combining signatures if too many sigs are invalid
        // Fallback to handleMissingSignatures
      }
    }

    this.handleMissingSignatures(session)
  }

  protected headers(request: Request<{}, {}, SignMessageRequest>): HeaderInit | undefined {
    return {
      ...super.headers(request),
      Authorization: request.headers.authorization!,
    }
  }

  protected parseBlindedMessage(req: SignMessageRequest): string {
    return req.blindedQueryPhoneNumber
  }

  protected parseSignature(
    res: SignMessageResponse,
    signerUrl: string,
    session: Session<SignMessageRequest>
  ): string | undefined {
    if (!res.success) {
      session.logger.error(
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
    error: ErrorType,
    status: number,
    session: Session<SignMessageRequest>,
    performedQueryCount?: number,
    totalQuota?: number,
    blockNumber?: number
  ) {
    respondWithError(
      session.response,
      {
        success: false,
        version: VERSION,
        error,
        performedQueryCount,
        totalQuota,
        blockNumber,
      },
      status,
      session.logger
    )
  }

  // TODO(Alec): clean this up, consider adding to Session
  protected logResponseDiscrepancies(session: Session<SignMessageRequest>): void {
    // Only compare responses which have values for the quota fields
    const successes = session.responses.filter(
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
        session.logger.error({ values }, WarningMessage.INCONSISTENT_SIGNER_QUOTA_MEASUREMENTS)
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
        session.logger.error({ values }, WarningMessage.INCONSISTENT_SIGNER_BLOCK_NUMBERS)
        discrepancyFound = true
      }
      if (discrepancyFound) {
        return
      }
    }
  }
}
