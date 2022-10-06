import { CeloTransactionObject } from '@celo/connect'
import { OdisPayments } from '../generated/OdisPayments'
import { BaseWrapper, proxyCall, proxySend } from './BaseWrapper'

type Address = string

export class OdisPaymentsWrapper extends BaseWrapper<OdisPayments> {
  /**
   * @notice Fetches total amount sent (all-time) for given account to odisPayments
   * @param account The account to fetch all-time quota for
   */
  totalPaidCUSD: (account: Address) => Promise<string> = proxyCall(
    this.contract.methods.totalPaidCUSD
  )

  /**
   * @notice Sends cUSD to this contract to pay for ODIS quota (for queries).
   * @param account The account whose balance to increment.
   * @param value The amount in cUSD to pay.
   * @dev Throws if cUSD transfer fails.
   */
  payInCUSD: (account: Address, value: number | string) => CeloTransactionObject<void> = proxySend(
    this.connection,
    this.contract.methods.payInCUSD
  )
}
