import {
  ErrorMessage,
  ErrorType,
  MAX_BLOCK_DISCREPANCY_THRESHOLD,
  SignMessageRequest,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { CryptoSession } from '../../../common/crypto-session'
import { SignAction } from '../../../common/sign'

export class PnpSignAction extends SignAction<SignMessageRequest> {
  combine(session: CryptoSession<SignMessageRequest>): void {
    this.logResponseDiscrepancies(session)

    if (session.crypto.hasSufficientSignatures()) {
      try {
        const combinedSignature = session.crypto.combinePartialBlindedSignatures(
          this.parseBlindedMessage(session.request.body),
          session.logger
        )

        const pnpQuotaStatus = this.thresholdStateService.findCombinerQuotaState(session)
        return this.io.sendSuccess(
          200,
          session.response,
          combinedSignature,
          pnpQuotaStatus.performedQueryCount,
          pnpQuotaStatus.totalQuota,
          pnpQuotaStatus.blockNumber
        )
      } catch (error) {
        // May fail upon combining signatures if too many sigs are invalid
        // Fallback to handleMissingSignatures
        session.logger.error(error)
      }
    }

    this.handleMissingSignatures(session)
  }

  protected parseBlindedMessage(req: SignMessageRequest): string {
    return req.blindedQueryPhoneNumber
  }

  protected logResponseDiscrepancies(session: CryptoSession<SignMessageRequest>): void {
    // TODO: responses should all already be successes due to CombineAction receiveSuccess

    const parsedResponses: Array<{
      signerUrl: string
      valuesOfInterest: {
        version: string
        performedQueryCount: number
        totalQuota: number
        blockNumber?: number
        warnings?: string[]
      }
    }> = []
    session.responses.forEach((response) => {
      if (response.res.success) {
        const { version, performedQueryCount, totalQuota, blockNumber, warnings } = response.res
        parsedResponses.push({
          signerUrl: response.url,
          valuesOfInterest: { version, performedQueryCount, totalQuota, blockNumber, warnings },
        })
      }
    })

    if (parsedResponses.length === 0) {
      // session.logger.info("No response discrepencies found!")
      // TODO
      return
    }

    let discrepancyFound = false
    const first = JSON.stringify(parsedResponses[0].valuesOfInterest)
    for (let i = 1; i < parsedResponses.length; i++) {
      if (JSON.stringify(parsedResponses[i].valuesOfInterest) !== first) {
        discrepancyFound = true
        break
      }
    }

    // log all responses if we notice any discrepency to aid with debugging
    if (discrepancyFound) {
      session.logger.warn({ parsedResponses }, 'Discrepencies detected in signer responses')
    }

    // Some values should trigger custom logging if we detect discrepencies beyond certain thresholds

    // blockNumber
    parsedResponses.forEach((res) => {
      if (res.valuesOfInterest.blockNumber === undefined) {
        session.logger.warn(
          { signerUrl: res.signerUrl },
          'Signer responded with undefined blockNumber'
        )
      }
    })
    const sortedDescByBlockNumber = parsedResponses
      .filter((res) => !!res.valuesOfInterest.blockNumber)
      .sort((a, b) => a.valuesOfInterest.blockNumber! - b.valuesOfInterest.blockNumber!)

    if (
      sortedDescByBlockNumber.length &&
      sortedDescByBlockNumber[0].valuesOfInterest.blockNumber! -
        sortedDescByBlockNumber[sortedDescByBlockNumber.length - 1].valuesOfInterest.blockNumber! >
        MAX_BLOCK_DISCREPANCY_THRESHOLD
    ) {
      session.logger.error(
        { sortedDescByBlockNumber },
        WarningMessage.INCONSISTENT_SIGNER_BLOCK_NUMBERS
      )
    }

    // totalQuota
    const sortedDescByTotalQuota = parsedResponses.sort(
      (a, b) => a.valuesOfInterest.totalQuota - b.valuesOfInterest.totalQuota
    )

    if (
      sortedDescByTotalQuota.length &&
      sortedDescByTotalQuota[0].valuesOfInterest.totalQuota -
        sortedDescByTotalQuota[sortedDescByTotalQuota.length - 1].valuesOfInterest.totalQuota >
        MAX_TOTAL_QUOTA_DISCREPENCY_THRESHOLD
    ) {
      session.logger.error({ sortedDescByTotalQuota }, WarningMessage.INCONSISTENT_TOTAL_QUOTA)
    }

    // const values = session.responses
    //   .map(
    //     (response) =>
    //       response.res.success && {
    //         signer: response.url,
    //         blockNumber: response.res.blockNumber,
    //         totalQuota: response.res.totalQuota,
    //         performedQueryCount: response.res.performedQueryCount,
    //       }
    //   )
    //   .filter((val) => val)

    // const expectedRes = responses[0]
    // responses.forEach((res) => {
    //   if (
    //     res.blockNumber &&
    //     expectedRes.blockNumber &&
    //     Math.abs(res.blockNumber - expectedRes.blockNumber) > MAX_BLOCK_DISCREPANCY_THRESHOLD
    //   ) {
    //     const blockValues = session.responses
    //       .map(
    //         (response) =>
    //           response.res.success && {
    //             signer: response.url,
    //             blockNumber: response.res.blockNumber,
    //             warnings: response.res.warnings,
    //           }
    //       )
    //       .filter((val) => val)
    //     session.logger.error({ blockValues }, WarningMessage.INCONSISTENT_SIGNER_BLOCK_NUMBERS)
    //     return
    //   } else if (res.totalQuota !== expectedRes.totalQuota) {
    //     session.logger.error({ values }, WarningMessage.INCONSISTENT_SIGNER_QUOTA_MEASUREMENTS)
    //     return
    //   } else if (
    //     res.performedQueryCount !== expectedRes.performedQueryCount ||
    //     res.warnings !== expectedRes.warnings
    //   ) {
    //     session.logger.warn({ values }, 'Discrepancies in signer quota responses')
    //     return
    //   }
    // })
  }

  protected errorCodeToError(errorCode: number): ErrorType {
    switch (errorCode) {
      case 403:
        return WarningMessage.EXCEEDED_QUOTA
      default:
        return ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES
    }
  }
}
