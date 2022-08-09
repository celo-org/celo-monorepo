import { PnpQuotaRequest, SignMessageRequest } from '@celo/phone-number-privacy-common'
import BigNumber from 'bignumber.js'
import { QuotaService } from '../../common/quota'
import { getOnChainOdisPayments } from '../../common/web3/contracts'
import { config } from '../../config'
import { PnpSession } from '../session'
import { PnpQuotaService } from './quota'

export class OnChainPnpQuotaService
  extends PnpQuotaService
  implements QuotaService<SignMessageRequest | PnpQuotaRequest> {
  /*
   * Calculates how many queries the caller has unlocked based on the total
   * amount of funds paid to the OdisPayments.sol contract on-chain.
   */
  protected async getTotalQuotaWithoutMeter(
    session: PnpSession<SignMessageRequest | PnpQuotaRequest>
  ): Promise<number> {
    const { queryPriceInCUSD } = config.quota
    const { account } = session.request.body
    const totalPaidInWei = await getOnChainOdisPayments(
      this.kit,
      session.logger,
      account,
      session.request.url
    )
    const totalQuota = totalPaidInWei
      .div(queryPriceInCUSD.times(new BigNumber(1e18)))
      .integerValue(BigNumber.ROUND_DOWN)
    // If any account hits an overflow here, we need to redesign how
    // quota/queries are computed anyways.
    return totalQuota.toNumber()
  }
}
