import { Address, CeloTransactionObject } from '@celo/connect'
import { BigNumber } from 'bignumber.js'
import { OdisPayments } from '@celo/abis/types/web3/OdisPayments'
import { BaseWrapper, proxyCall, proxySend, valueToBigNumber } from './BaseWrapper'

export class OdisPaymentsWrapper extends BaseWrapper<OdisPayments> {
  /**
   * @notice Fetches total amount sent (all-time) for given account to odisPayments
   * @param account The account to fetch total amount of funds sent
   */
  totalPaidCUSD: (account: Address) => Promise<BigNumber> = proxyCall(
    this.contract.methods.totalPaidCUSD,
    undefined,
    valueToBigNumber
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

export type OdisPaymentsWrapperType = OdisPaymentsWrapper
