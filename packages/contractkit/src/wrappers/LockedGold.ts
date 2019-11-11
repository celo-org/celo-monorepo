import { zip } from '@celo/utils/lib/collections'
import BigNumber from 'bignumber.js'
import { Address } from '../base'
import { LockedGold } from '../generated/types/LockedGold'
import {
  BaseWrapper,
  CeloTransactionObject,
  NumberLike,
  parseNumber,
  proxyCall,
  proxySend,
  toBigNumber,
  tupleParser,
} from '../wrappers/BaseWrapper'

export interface VotingDetails {
  accountAddress: Address
  voterAddress: Address
  /** vote's weight */
  weight: BigNumber
}

interface AccountSummary {
  lockedGold: {
    total: BigNumber
    nonvoting: BigNumber
  }
  pendingWithdrawals: PendingWithdrawal[]
}

interface PendingWithdrawal {
  time: BigNumber
  value: BigNumber
}

export interface LockedGoldConfig {
  unlockingPeriod: BigNumber
}

/**
 * Contract for handling deposits needed for voting.
 */
export class LockedGoldWrapper extends BaseWrapper<LockedGold> {
  /**
   * Withdraws a gold that has been unlocked after the unlocking period has passed.
   * @param index The index of the pending withdrawal to withdraw.
   */
  withdraw: (index: number) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.withdraw
  )

  /**
   * Locks gold to be used for voting.
   * The gold to be locked, must be specified as the `tx.value`
   */
  lock = proxySend(this.kit, this.contract.methods.lock)

  /**
   * Unlocks gold that becomes withdrawable after the unlocking period.
   * @param value The amount of gold to unlock.
   */
  unlock: (value: NumberLike) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.unlock,
    tupleParser(parseNumber)
  )

  /**
   * Relocks gold that has been unlocked but not withdrawn.
   * @param index The index of the pending withdrawal to relock.
   */
  relock: (index: number) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.relock
  )

  /**
   * Returns the total amount of locked gold for an account.
   * @param account The account.
   * @return The total amount of locked gold for an account.
   */
  getAccountTotalLockedGold = proxyCall(
    this.contract.methods.getAccountTotalLockedGold,
    undefined,
    toBigNumber
  )

  /**
   * Returns the total amount of non-voting locked gold for an account.
   * @param account The account.
   * @return The total amount of non-voting locked gold for an account.
   */
  getAccountNonvotingLockedGold = proxyCall(
    this.contract.methods.getAccountNonvotingLockedGold,
    undefined,
    toBigNumber
  )

  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<LockedGoldConfig> {
    return {
      unlockingPeriod: toBigNumber(await this.contract.methods.unlockingPeriod().call()),
    }
  }

  async getAccountSummary(account: string): Promise<AccountSummary> {
    const nonvoting = await this.getAccountNonvotingLockedGold(account)
    const total = await this.getAccountTotalLockedGold(account)
    const pendingWithdrawals = await this.getPendingWithdrawals(account)
    return {
      lockedGold: {
        total,
        nonvoting,
      },
      pendingWithdrawals,
    }
  }

  /**
   * Returns the pending withdrawals from unlocked gold for an account.
   * @param account The address of the account.
   * @return The value and timestamp for each pending withdrawal.
   */
  async getPendingWithdrawals(account: string) {
    const withdrawals = await this.contract.methods.getPendingWithdrawals(account).call()
    return zip(
      (time, value) =>
        // tslint:disable-next-line: no-object-literal-type-assertion
        ({ time: toBigNumber(time), value: toBigNumber(value) } as PendingWithdrawal),
      withdrawals[1],
      withdrawals[0]
    )
  }
}
