import { AddressListItem, linkedListChanges, zip } from '@celo/utils/lib/collections'
import BigNumber from 'bignumber.js'
import { EventLog } from 'web3-core'
import { Address } from '../base'
import { LockedGold } from '../generated/LockedGold'
import {
  BaseWrapper,
  CeloTransactionObject,
  proxyCall,
  proxySend,
  tupleParser,
  valueToBigNumber,
  valueToString,
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
    requirement: BigNumber
  }
  pendingWithdrawals: PendingWithdrawal[]
}

export interface AccountSlashed {
  slashed: Address
  penalty: BigNumber
  reporter: Address
  reward: BigNumber
  epochNumber: number
}

export interface PendingWithdrawal {
  time: BigNumber
  value: BigNumber
}

export interface LockedGoldConfig {
  unlockingPeriod: BigNumber
  totalLockedGold: BigNumber
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
  unlock: (value: BigNumber.Value) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.unlock,
    tupleParser(valueToString)
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
  async relock(
    account: Address,
    value: BigNumber.Value
  ): Promise<Array<CeloTransactionObject<void>>> {
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
      if (!valueToRelock.isZero()) {
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
  _relock: (index: number, value: BigNumber.Value) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.relock,
    tupleParser(valueToString, valueToString)
  )

  /**
   * Returns the total amount of locked gold for an account.
   * @param account The account.
   * @return The total amount of locked gold for an account.
   */
  getAccountTotalLockedGold = proxyCall(
    this.contract.methods.getAccountTotalLockedGold,
    undefined,
    valueToBigNumber
  )

  /**
   * Returns the total amount of locked gold in the system. Note that this does not include
   *   gold that has been unlocked but not yet withdrawn.
   * @returns The total amount of locked gold in the system.
   */
  getTotalLockedGold = proxyCall(
    this.contract.methods.getTotalLockedGold,
    undefined,
    valueToBigNumber
  )

  /**
   * Returns the total amount of non-voting locked gold for an account.
   * @param account The account.
   * @return The total amount of non-voting locked gold for an account.
   */
  getAccountNonvotingLockedGold = proxyCall(
    this.contract.methods.getAccountNonvotingLockedGold,
    undefined,
    valueToBigNumber
  )

  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<LockedGoldConfig> {
    return {
      unlockingPeriod: valueToBigNumber(await this.contract.methods.unlockingPeriod().call()),
      totalLockedGold: await this.getTotalLockedGold(),
    }
  }

  async getAccountSummary(account: string): Promise<AccountSummary> {
    const nonvoting = await this.getAccountNonvotingLockedGold(account)
    const total = await this.getAccountTotalLockedGold(account)
    const validators = await this.kit.contracts.getValidators()
    const requirement = await validators.getAccountLockedGoldRequirement(account)
    const pendingWithdrawals = await this.getPendingWithdrawals(account)
    return {
      lockedGold: {
        total,
        nonvoting,
        requirement,
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
      (time, value): PendingWithdrawal => ({
        time: valueToBigNumber(time),
        value: valueToBigNumber(value),
      }),
      withdrawals[1],
      withdrawals[0]
    )
  }

  /**
   * Retrieves AccountSlashed for epochNumber.
   * @param epochNumber The epoch to retrieve AccountSlashed at.
   */
  async getAccountsSlashed(epochNumber: number): Promise<AccountSlashed[]> {
    const events = await this.getPastEvents('AccountSlashed', {
      fromBlock: await this.kit.getFirstBlockNumberForEpoch(epochNumber),
      toBlock: await this.kit.getLastBlockNumberForEpoch(epochNumber),
    })
    return events.map(
      (e: EventLog): AccountSlashed => ({
        epochNumber,
        slashed: e.returnValues.slashed,
        penalty: valueToBigNumber(e.returnValues.penalty),
        reporter: e.returnValues.reporter,
        reward: valueToBigNumber(e.returnValues.reward),
      })
    )
  }

  /**
   * Computes parameters for slashing `penalty` from `account`.
   * @param account The account to slash.
   * @param penalty The amount to slash as penalty.
   * @return List of (group, voting gold) to decrement from `account`.
   */
  async computeInitialParametersForSlashing(account: string, penalty: BigNumber) {
    const election = await this.kit.contracts.getElection()
    const eligible = await election.getEligibleValidatorGroupsVotes()
    const groups: AddressListItem[] = eligible.map((x) => ({ address: x.address, value: x.votes }))
    return this.computeParametersForSlashing(account, penalty, groups)
  }

  async computeParametersForSlashing(
    account: string,
    penalty: BigNumber,
    groups: AddressListItem[]
  ) {
    const changed = await this.computeDecrementsForSlashing(account, penalty, groups)
    const changes = linkedListChanges(groups, changed)
    return { ...changes, indices: changed.map((a) => a.index) }
  }

  // Returns how much voting gold will be decremented from the groups voted by an account
  // Implementation follows protocol/test/common/integration slashingOfGroups()
  private async computeDecrementsForSlashing(
    account: Address,
    penalty: BigNumber,
    allGroups: AddressListItem[]
  ) {
    // first check how much voting gold has to be slashed
    const nonVoting = await this.getAccountNonvotingLockedGold(account)
    if (penalty.isLessThan(nonVoting)) {
      return []
    }
    let difference = penalty.minus(nonVoting)
    // find voted groups
    const election = await this.kit.contracts.getElection()
    const groups = await election.getGroupsVotedForByAccount(account)
    const res = []
    //
    for (let i = groups.length - 1; i >= 0; i--) {
      const group = groups[i]
      const totalVotes = allGroups.find((a) => a.address === group)?.value
      if (!totalVotes) {
        throw new Error(`Cannot find group ${group}`)
      }
      const votes = await election.getTotalVotesForGroupByAccount(group, account)
      const slashedVotes = votes.lt(difference) ? votes : difference
      res.push({ address: group, value: totalVotes.minus(slashedVotes), index: i })
      difference = difference.minus(slashedVotes)
      if (difference.eq(new BigNumber(0))) {
        break
      }
    }
    return res
  }
}
