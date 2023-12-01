import { LockedGold } from '@celo/abis/types/web3/LockedGold'
import {
  AddressListItem as ALI,
  Comparator,
  linkedListChanges as baseLinkedListChanges,
  zip,
} from '@celo/base/lib/collections'
import { Address, CeloTransactionObject, EventLog } from '@celo/connect'
import BigNumber from 'bignumber.js'
import { ContractVersion } from '../versions'
import {
  proxyCall,
  proxySend,
  secondsToDurationString,
  tupleParser,
  valueToBigNumber,
  valueToString,
} from '../wrappers/BaseWrapper'
import { BaseWrapperForGoverning } from './BaseWrapperForGoverning'

type AddressListItem = ALI<BigNumber>
const bigNumberComparator: Comparator<BigNumber> = (a: BigNumber, b: BigNumber) => a.lt(b)
function linkedListChanges(
  groups: AddressListItem[],
  changed: AddressListItem[]
): { lessers: string[]; greaters: string[]; list: AddressListItem[] } {
  return baseLinkedListChanges(groups, changed, bigNumberComparator)
}

export interface VotingDetails {
  accountAddress: Address
  voterAddress: Address
  /** vote's weight */
  weight: BigNumber
}

export interface DelegateInfo {
  totalPercentDelegated: string
  delegatees: string[]
  totalVotesDelegatedToThisAccount: BigNumber
}

interface AccountSummary {
  lockedGold: {
    total: BigNumber
    nonvoting: BigNumber
    requirement: BigNumber
  }
  totalGovernaneVotingPower: BigNumber
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

export class LockedGoldWrapper extends BaseWrapperForGoverning<LockedGold> {
  /**
   * Withdraws a gold that has been unlocked after the unlocking period has passed.
   * @param index The index of the pending withdrawal to withdraw.
   */
  withdraw: (index: number) => CeloTransactionObject<void> = proxySend(
    this.connection,
    this.contract.methods.withdraw
  )

  /**
   * Locks gold to be used for voting.
   * The gold to be locked, must be specified as the `tx.value`
   */
  lock = proxySend(this.connection, this.contract.methods.lock)

  /**
   * Delegates locked gold.
   */
  delegate = proxySend(this.connection, this.contract.methods.delegateGovernanceVotes)

  /**
   * Updates the amount of delegated locked gold. There might be discrepancy between the amount of locked gold
   * and the amount of delegated locked gold because of received rewards.
   */
  updateDelegatedAmount = proxySend(this.connection, this.contract.methods.updateDelegatedAmount)

  /**
   * Revokes delegated locked gold.
   */
  revokeDelegated = proxySend(this.connection, this.contract.methods.revokeDelegatedGovernanceVotes)

  getMaxDelegateesCount = async () => {
    const maxDelegateesCountHex = await this.connection.web3.eth.getStorageAt(
      // tslint:disable-next-line:no-string-literal
      this.contract['_address'],
      10
    )
    return new BigNumber(maxDelegateesCountHex, 16)
  }

  getDelegateInfo = async (account: string): Promise<DelegateInfo> => {
    const totalDelegatedFractionPromise = this.contract.methods
      .getAccountTotalDelegatedFraction(account)
      .call()
    const totalDelegatedCeloPromise = this.contract.methods.totalDelegatedCelo(account).call()
    const delegateesPromise = this.contract.methods.getDelegateesOfDelegator(account).call()

    const fixidity = new BigNumber('1000000000000000000000000')

    return {
      totalPercentDelegated:
        new BigNumber(await totalDelegatedFractionPromise)
          .multipliedBy(100)
          .div(fixidity)
          .toFixed() + '%',
      delegatees: await delegateesPromise,
      totalVotesDelegatedToThisAccount: new BigNumber(await totalDelegatedCeloPromise),
    }
  }

  /**
   * Unlocks gold that becomes withdrawable after the unlocking period.
   * @param value The amount of gold to unlock.
   */
  unlock: (value: BigNumber.Value) => CeloTransactionObject<void> = proxySend(
    this.connection,
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
    this.connection,
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

  /**
   * @dev Returns human readable configuration of the lockedgold contract
   * @return LockedGoldConfig object
   */
  async getHumanReadableConfig() {
    const config = await this.getConfig()
    return {
      ...config,
      unlockingPeriod: secondsToDurationString(config.unlockingPeriod),
    }
  }

  async getAccountSummary(account: string): Promise<AccountSummary> {
    const validators = await this.contracts.getValidators()
    const nonvotingPromise = this.getAccountNonvotingLockedGold(account)
    const totalPromise = this.getAccountTotalLockedGold(account)
    const requirementPromise = validators.getAccountLockedGoldRequirement(account)
    const pendingWithdrawalsPromise = this.getPendingWithdrawals(account)
    const accountTotalGovernanceVotingPowerPromise =
      this.getAccountTotalGovernanceVotingPower(account)
    return {
      lockedGold: {
        total: await totalPromise,
        nonvoting: await nonvotingPromise,
        requirement: await requirementPromise,
      },
      totalGovernaneVotingPower: await accountTotalGovernanceVotingPowerPromise,
      pendingWithdrawals: await pendingWithdrawalsPromise,
    }
  }

  /**
   * Returns the total amount of governance voting power for an account.
   * @param account The address of the account.
   * @return The total amount of governance voting power for an account.
   */
  async getAccountTotalGovernanceVotingPower(account: string) {
    const totalGovernanceVotingPower = await this.contract.methods
      .getAccountTotalGovernanceVotingPower(account)
      .call()
    return new BigNumber(totalGovernanceVotingPower)
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
   * Returns the pending withdrawal at a given index for a given account.
   * @param account The address of the account.
   * @param index The index of the pending withdrawal.
   * @return The value of the pending withdrawal.
   * @return The timestamp of the pending withdrawal.
   */
  async getPendingWithdrawal(account: string, index: number) {
    const response = await this.contract.methods.getPendingWithdrawal(account, index).call()
    return {
      value: valueToBigNumber(response[0]),
      time: valueToBigNumber(response[1]),
    }
  }

  /**
   * Retrieves AccountSlashed for epochNumber.
   * @param epochNumber The epoch to retrieve AccountSlashed at.
   */
  async getAccountsSlashed(epochNumber: number): Promise<AccountSlashed[]> {
    const blockchainParamsWrapper = await this.contracts.getBlockchainParameters()
    const events = await this.getPastEvents('AccountSlashed', {
      fromBlock: await blockchainParamsWrapper.getFirstBlockNumberForEpoch(epochNumber),
      toBlock: await blockchainParamsWrapper.getLastBlockNumberForEpoch(epochNumber),
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
    const election = await this.contracts.getElection()
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
    const election = await this.contracts.getElection()
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

  /**
   * Returns the number of pending withdrawals for the specified account.
   * @param account The account.
   * @notice This method is only available in version 1.1.4 or higher of the LockedGold contract.
   * @returns The count of pending withdrawals.
   */
  async getTotalPendingWithdrawalsCount(account: string) {
    const minVersion = new ContractVersion(1, 1, 4, 0)
    const version = await this.version()
    if (version.isAtLeast(minVersion)) {
      return this._getTotalPendingWithdrawalsCount(account)
    } else {
      throw new Error(
        `getTotalPendingWithdrawalsCount not implemented for LockedGold version (${version.toString()}) deployed to this chain`
      )
    }
  }

  _getTotalPendingWithdrawalsCount = proxyCall(
    this.contract.methods.getTotalPendingWithdrawalsCount,
    undefined,
    valueToBigNumber
  )
}

export type LockedGoldWrapperType = LockedGoldWrapper
