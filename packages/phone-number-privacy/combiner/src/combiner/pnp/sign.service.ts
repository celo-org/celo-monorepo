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
  send,
  SignerEndpoint,
  SignMessageResponse,
  SignMessageResponseFailure,
  SignMessageResponseSuccess,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { HeaderInit } from 'node-fetch'
import { VERSION } from '../../config'
import { getContractKit } from '../../web3/contracts'
import { Session } from '../session'
import { SignService } from '../sign.service'

export class PnpSignService extends SignService<SignMessageRequest> {
  readonly endpoint: CombinerEndpoint = CombinerEndpoint.SIGN_MESSAGE
  readonly signerEndpoint: SignerEndpoint = getSignerEndpoint(CombinerEndpoint.SIGN_MESSAGE)

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

  protected validateSignerResponse(
    data: string,
    _url: string,
    _session: Session<SignMessageRequest>
  ): SignMessageResponse {
    // TODO(Alec)(Next): add io-ts types for pnp
    const res: unknown = JSON.parse(data)
    // if (!domainRestrictedSignatureResponseSchema(SequentialDelayDomainStateSchema).is(res)) {
    //   // TODO(Alec): add error type for this
    //   const msg = `Signer request to ${url}/${this.signerEndpoint} returned malformed response`
    //   session.logger.error({ data, signer: url }, msg)
    //   throw new Error(msg)
    // }
    // if (!signerResponse.signature)
    return res as SignMessageResponse
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
        return this.sendSuccess(200, session.response, session.logger, combinedSignature)
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
      ...(request.headers.authorization ? { Authorization: request.headers.authorization } : {}),
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

  protected sendSuccess(
    status: number,
    response: Response<SignMessageResponseSuccess>,
    logger: Logger,
    combinedSignature: string
  ) {
    send(
      response,
      {
        success: true,
        version: VERSION,
        signature: combinedSignature,
      },
      status,
      logger
    )
  }

  protected sendFailure(
    error: ErrorType,
    status: number,
    response: Response<SignMessageResponseFailure>,
    logger: Logger,
    performedQueryCount?: number,
    totalQuota?: number,
    blockNumber?: number
  ) {
    send(
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
      logger
    )
  }

  // TODO(Alec): clean this up
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
