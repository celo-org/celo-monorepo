import { zip } from '@celo/utils/lib/collections'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { TransactionObject } from 'web3/eth/types'
import { Address } from '../base'
import { LockedGold } from '../generated/types/LockedGold'
import {
  BaseWrapper,
  CeloTransactionObject,
  proxyCall,
  proxySend,
  toBigNumber,
  wrapSend,
} from '../wrappers/BaseWrapper'

export interface VotingDetails {
  accountAddress: Address
  voterAddress: Address
  /** vote's weight */
  weight: BigNumber
}

interface Commitment {
  time: BigNumber
  value: BigNumber
}

export interface Commitments {
  locked: Commitment[]
  notified: Commitment[]
  total: {
    gold: BigNumber
    weight: BigNumber
  }
}

export enum Roles {
  Validating = '0',
  Voting = '1',
  Rewards = '2',
}

export interface LockedGoldConfig {
  maxNoticePeriod: BigNumber
}

/**
 * Contract for handling deposits needed for voting.
 */
export class LockedGoldWrapper extends BaseWrapper<LockedGold> {
  /**
   * Notifies a Locked Gold commitment, allowing funds to be withdrawn after the notice
   *   period.
   * @param value The amount of the commitment to eventually withdraw.
   * @param noticePeriod The notice period of the Locked Gold commitment.
   * @return CeloTransactionObject
   */
  notifyCommitment: (
    value: string | number,
    noticePeriod: string | number
  ) => CeloTransactionObject<string> = proxySend(this.kit, this.contract.methods.notifyCommitment)

  /**
   * Creates an account.
   * @return CeloTransactionObject
   */
  createAccount: () => CeloTransactionObject<boolean> = proxySend(
    this.kit,
    this.contract.methods.createAccount
  )

  /**
   * Withdraws a notified commitment after the duration of the notice period.
   * @param availabilityTime The availability time of the notified commitment.
   * @return CeloTransactionObject
   */
  withdrawCommitment: (
    availabilityTime: string | number
  ) => CeloTransactionObject<string> = proxySend(this.kit, this.contract.methods.withdrawCommitment)

  /**
   * Redeems rewards accrued since the last redemption for the specified account.
   * @return CeloTransactionObject
   */
  redeemRewards: () => CeloTransactionObject<string> = proxySend(
    this.kit,
    this.contract.methods.redeemRewards
  )

  /**
   * Adds a Locked Gold commitment to `msg.sender`'s account.
   * @param noticePeriod The notice period for the commitment.
   * @return CeloTransactionObject
   */
  newCommitment: (noticePeriod: string | number) => CeloTransactionObject<string> = proxySend(
    this.kit,
    this.contract.methods.newCommitment
  )

  /**
   * Rebonds a notified commitment, with notice period >= the remaining time to
   * availability.
   *
   * @param value The amount of the commitment to rebond.
   * @param availabilityTime The availability time of the notified commitment.
   * @return CeloTransactionObject
   */
  extendCommitment: (
    value: string | number,
    availabilityTime: string | number
  ) => CeloTransactionObject<string> = proxySend(this.kit, this.contract.methods.extendCommitment)

  /**
   * Returns whether or not a specified account is voting.
   * @param account The address of the account.
   * @return Whether or not the account is voting.
   */
  isVoting = proxyCall(this.contract.methods.isVoting)

  /**
   * Query maximum notice period.
   * @returns Current maximum notice period.
   */
  maxNoticePeriod = proxyCall(this.contract.methods.maxNoticePeriod, undefined, toBigNumber)

  /**
   * Returns the weight of a specified account.
   * @param _account The address of the account.
   * @return The weight of the specified account.
   */
  getAccountWeight = proxyCall(this.contract.methods.getAccountWeight, undefined, toBigNumber)
  /**
   * Get the delegate for a role.
   * @param account Address of the active account.
   * @param role one of Roles Enum ("validating", "voting", "rewards")
   * @return Address of the delegate
   */
  getDelegateFromAccountAndRole: (account: string, role: Roles) => Promise<Address> = proxyCall(
    this.contract.methods.getDelegateFromAccountAndRole
  )

  /**
   * Returns current configuration parameters.
   */

  async getConfig(): Promise<LockedGoldConfig> {
    return {
      maxNoticePeriod: await this.maxNoticePeriod(),
    }
  }

  /**
   * Get voting details for an address
   * @param accountOrVoterAddress Accout or Voter address
   */
  async getVotingDetails(accountOrVoterAddress: Address): Promise<VotingDetails> {
    const accountAddress = await this.contract.methods
      .getAccountFromDelegateAndRole(accountOrVoterAddress, Roles.Voting)
      .call()

    return {
      accountAddress,
      voterAddress: accountOrVoterAddress,
      weight: await this.getAccountWeight(accountAddress),
    }
  }

  async getLockedCommitmentValue(account: Address, noticePeriod: string): Promise<BigNumber> {
    const commitment = await this.contract.methods.getLockedCommitment(account, noticePeriod).call()
    return this.getValueFromCommitment(commitment)
  }

  async getLockedCommitments(account: Address): Promise<Commitment[]> {
    return this.zipAccountTimesAndValuesToCommitments(
      account,
      this.contract.methods.getNoticePeriods,
      this.getLockedCommitmentValue.bind(this)
    )
  }

  async getNotifiedCommitmentValue(account: Address, availTime: string): Promise<BigNumber> {
    const commitment = await this.contract.methods.getNotifiedCommitment(account, availTime).call()
    return this.getValueFromCommitment(commitment)
  }

  async getNotifiedCommitments(account: Address): Promise<Commitment[]> {
    return this.zipAccountTimesAndValuesToCommitments(
      account,
      this.contract.methods.getAvailabilityTimes,
      this.getNotifiedCommitmentValue.bind(this)
    )
  }

  /**
   * Get commitments for an Account
   * @param account Account address
   */
  async getCommitments(account: Address): Promise<Commitments> {
    const locked = await this.getLockedCommitments(account)
    const notified = await this.getNotifiedCommitments(account)
    const weight = await this.getAccountWeight(account)

    const totalLocked = locked.reduce(
      (acc, commitment) => acc.plus(commitment.value),
      new BigNumber(0)
    )
    const gold = notified.reduce((acc, commitment) => acc.plus(commitment.value), totalLocked)

    return {
      locked,
      notified,
      total: { weight, gold },
    }
  }

  /**
   * Delegate a Role to another account.
   * @param account Address of the active account.
   * @param delegate Address of the delegate
   * @param role one of Roles Enum ("Validating", "Voting", "Rewards")
   * @return A CeloTransactionObject
   */
  async delegateRoleTx(
    account: Address,
    delegate: Address,
    role: Roles
  ): Promise<CeloTransactionObject<void>> {
    const sig = await this.getParsedSignatureOfAddress(account, delegate)
    return wrapSend(
      this.kit,
      this.contract.methods.delegateRole(role, delegate, sig.v, sig.r, sig.s)
    )
  }

  /**
   * Delegate a Rewards to another account.
   * @param account Address of the active account.
   * @param delegate Address of the delegate
   * @return A CeloTransactionObject
   */
  async delegateRewards(account: Address, delegate: Address): Promise<CeloTransactionObject<void>> {
    return this.delegateRoleTx(account, delegate, Roles.Rewards)
  }

  /**
   * Delegate a voting to another account.
   * @param account Address of the active account.
   * @param delegate Address of the delegate
   * @return A CeloTransactionObject
   */
  async delegateVoting(account: Address, delegate: Address): Promise<CeloTransactionObject<void>> {
    return this.delegateRoleTx(account, delegate, Roles.Voting)
  }

  /**
   * Delegate a validating to another account.
   * @param account Address of the active account.
   * @param delegate Address of the delegate
   * @return A CeloTransactionObject
   */
  async delegateValidating(
    account: Address,
    delegate: Address
  ): Promise<CeloTransactionObject<void>> {
    return this.delegateRoleTx(account, delegate, Roles.Validating)
  }

  private getValueFromCommitment(commitment: { 0: string; 1: string }) {
    return new BigNumber(commitment[0])
  }

  private async getParsedSignatureOfAddress(address: Address, signer: string) {
    const hash = Web3.utils.soliditySha3({ type: 'address', value: address })
    const signature = (await this.kit.web3.eth.sign(hash, signer)).slice(2)
    return {
      r: `0x${signature.slice(0, 64)}`,
      s: `0x${signature.slice(64, 128)}`,
      v: Web3.utils.hexToNumber(signature.slice(128, 130)) + 27,
    }
  }

  private async zipAccountTimesAndValuesToCommitments(
    account: Address,
    timesFunc: (account: string) => TransactionObject<string[]>,
    valueFunc: (account: string, time: string) => Promise<BigNumber>
  ) {
    const accountTimes = await timesFunc(account).call()
    const accountValues = await Promise.all(accountTimes.map((time) => valueFunc(account, time)))
    return zip(
      // tslint:disable-next-line: no-object-literal-type-assertion
      (time, value) => ({ time, value } as Commitment),
      accountTimes.map((time) => new BigNumber(time)),
      accountValues
    )
  }
}
