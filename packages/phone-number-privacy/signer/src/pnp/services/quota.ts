import { PnpQuotaRequest, SignMessageRequest } from '@celo/phone-number-privacy-common'
import BigNumber from 'bignumber.js'
import { QuotaService } from '../../common/quota'
import { getOnChainOdisBalance } from '../../common/web3/contracts'
import { config } from '../../config'
import { PnpSession } from '../session'
import { PnpQuotaServiceCommonRename } from './quota_common_rename'
export interface PnpQuotaStatus {
  queryCount: number
  totalQuota: number
  blockNumber: number
}

export class PnpQuotaService
  extends PnpQuotaServiceCommonRename
  implements QuotaService<SignMessageRequest | PnpQuotaRequest> {
  protected readonly metricsPrefix = 'OnChainPnpQuotaService.'
  /*
   * Calculates how many queries the caller has unlocked based on the total
   * amount of funds paid to the OdisBalance.sol contract on-chain.
   */
  protected async getTotalQuotaWithoutMeter(
    session: PnpSession<SignMessageRequest | PnpQuotaRequest>
  ): Promise<number> {
    const { queryPriceInCUSD } = config.quota
    const { account } = session.request.body
    const totalPaid = await getOnChainOdisBalance(this.kit, account)
    const totalQuota = totalPaid
      .div(queryPriceInCUSD.times(new BigNumber(1e18)))
      .integerValue(BigNumber.ROUND_DOWN)
    // If any account hits an overflow here, we need to redesign how
    // quota/queries are computed anyways.
    return totalQuota.toNumber()
  }
}
