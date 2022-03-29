import { SignMessageRequest } from '@celo/identity/lib/odis/query'
import { ErrorType, send, SignMessageResponseFailure, SignMessageResponseSuccess } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { HeaderInit } from 'node-fetch'
import { VERSION } from '../../config'
import { SignAbstract } from '../sign.abstract'
import { PnpSignSession } from './sign.session'

export class PnpSignAction extends SignAbstract<SignMessageRequest> {

  async combine(session: PnpSignSession): Promise<void> {
    // this.logResponseDiscrepancies(session)

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
        performedQueryCount: undefined,
        totalQuota: undefined,
        blockNumber: undefined,
        warnings: undefined,
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
    blockNumber?: number,
    signature?: string
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
        signature,
      },
      status,
      logger
    )
  }

  // // TODO(Alec): clean this up
  // protected logResponseDiscrepancies(session: SignSession<SignMessageRequest>): void {
  //   // Only compare responses which have values for the quota fields
  //   const successes = session.responses.filter(
  //     (signerResponse) =>
  //       signerResponse.res &&
  //       signerResponse.res.performedQueryCount &&
  //       signerResponse.res.totalQuota &&
  //       signerResponse.res.blockNumber
  //   )

  //   if (successes.length === 0) {
  //     return
  //   }
  //   // Compare the first response to the rest of the responses
  //   const expectedQueryCount = successes[0].res.performedQueryCount
  //   const expectedTotalQuota = successes[0].res.totalQuota
  //   const expectedBlockNumber = successes[0].res.blockNumber!
  //   let discrepancyFound = false
  //   for (const signerResponse of successes) {
  //     // Performed query count should never diverge; however the totalQuota may
  //     // diverge if the queried block number is different
  //     if (
  //       signerResponse.res.performedQueryCount !== expectedQueryCount ||
  //       (signerResponse.res.totalQuota !== expectedTotalQuota &&
  //         signerResponse.res.blockNumber === expectedBlockNumber)
  //     ) {
  //       const values = successes.map((_signerResponse) => {
  //         return {
  //           signer: _signerResponse.url,
  //           performedQueryCount: _signerResponse.res.performedQueryCount,
  //           totalQuota: _signerResponse.res.totalQuota,
  //         }
  //       })
  //       session.logger.error({ values }, WarningMessage.INCONSISTENT_SIGNER_QUOTA_MEASUREMENTS)
  //       discrepancyFound = true
  //     }
  //     if (
  //       Math.abs(signerResponse.res.blockNumber! - expectedBlockNumber) >
  //       MAX_BLOCK_DISCREPANCY_THRESHOLD
  //     ) {
  //       const values = successes.map((response) => {
  //         return {
  //           signer: response.url,
  //           blockNumber: response.res.blockNumber,
  //         }
  //       })
  //       session.logger.error({ values }, WarningMessage.INCONSISTENT_SIGNER_BLOCK_NUMBERS)
  //       discrepancyFound = true
  //     }
  //     if (discrepancyFound) {
  //       return
  //     }
  //   }
  // }
}
