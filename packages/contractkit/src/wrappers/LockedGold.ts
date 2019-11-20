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

  async getPendingWithdrawalsTotalValue(account: Address) {
    const pendingWithdrawals = await this.getPendingWithdrawals(account)
    // Ensure there are enough pending withdrawals to relock.
    const values = pendingWithdrawals.map((pw: PendingWithdrawal) => pw.value)
    const reducer = (total: BigNumber, pw: BigNumber) => pw.plus(total)
    return values.reduce(reducer, new BigNumber(0))
  }

  /**
   * Relocks gold that has been unlocked but not withdrawn.
   * @param value The value to relock from pending withdrawals.
   */
  async relock(account: Address, value: NumberLike): Promise<Array<CeloTransactionObject<void>>> {
    const pendingWithdrawals = await this.getPendingWithdrawals(account)
    // Ensure there are enough pending withdrawals to relock.
    const totalValue = await this.getPendingWithdrawalsTotalValue(account)
    if (totalValue.isLessThan(value)) {
      throw new Error(`Not enough pending withdrawals to relock ${value}`)
    }
    // Assert pending withdrawals are sorted by time (increasing), so that we can re-lock starting
    // with those furthest away from being available (at the end).
    const throwIfNotSorted = (pw: PendingWithdrawal, i: number) => {
      if (i > 0 && !pw.time.isGreaterThanOrEqualTo(pendingWithdrawals[i - 1].time)) {
        throw new Error('Pending withdrawals not sorted by timestamp')
      }
    }
    pendingWithdrawals.forEach(throwIfNotSorted)

    let remainingToRelock = new BigNumber(value)
    const relockPw = (
      acc: Array<CeloTransactionObject<void>>,
      pw: PendingWithdrawal,
      i: number
    ) => {
      const valueToRelock = BigNumber.minimum(pw.value, remainingToRelock)
      if (valueToRelock.isZero()) {
        remainingToRelock = remainingToRelock.minus(valueToRelock)
        acc.push(this._relock(i, valueToRelock))
      }
      return acc
    }
    return pendingWithdrawals.reduceRight(relockPw, []) as Array<CeloTransactionObject<void>>
  }

  /**
   * Relocks gold that has been unlocked but not withdrawn.
   * @param index The index of the pending withdrawal to relock from.
   * @param value The value to relock from the specified pending withdrawal.
   */
  _relock: (index: number, value: NumberLike) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.relock,
    tupleParser(parseNumber, parseNumber)
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
