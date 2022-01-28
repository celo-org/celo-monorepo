import {
  CombinerEndpoint,
  GetBlindedMessageSigRequest,
  getSignerEndpoint,
  MAX_BLOCK_DISCREPANCY_THRESHOLD,
  SignerEndpoint,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { OdisConfig } from '../../config'
import { SignerPnpResponse, SignerResponseWithStatus } from '../combiner.service'
import { ICombinerInputService } from '../input.interface'
import { SignService } from '../sign.service'

interface PnpSignResponseWithStatus extends SignerResponseWithStatus {
  url: string
  res: SignerPnpResponse
  status: number
}
export class PnpSignService extends SignService {
  protected endpoint: CombinerEndpoint
  protected signerEndpoint: SignerEndpoint
  protected responses: PnpSignResponseWithStatus[]

  public constructor(config: OdisConfig, protected inputService: ICombinerInputService) {
    super(config, inputService)
    this.endpoint = CombinerEndpoint.GET_BLINDED_MESSAGE_SIG
    this.signerEndpoint = getSignerEndpoint(this.endpoint)
    this.responses = []
  }

  protected parseBlindedMessage(req: GetBlindedMessageSigRequest): string {
    return req.blindedQueryPhoneNumber
  }

  protected parseSignature(res: SignerPnpResponse, signerUrl: string): string | undefined {
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
