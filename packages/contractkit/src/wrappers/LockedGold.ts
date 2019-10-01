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
  notifyCommitment = proxySend(this.kit, this.contract.methods.notifyCommitment)
  createAccount = proxySend(this.kit, this.contract.methods.createAccount)
  withdrawCommitment = proxySend(this.kit, this.contract.methods.withdrawCommitment)
  redeemRewards = proxySend(this.kit, this.contract.methods.redeemRewards)
  newCommitment = proxySend(this.kit, this.contract.methods.newCommitment)
  extendCommitment = proxySend(this.kit, this.contract.methods.extendCommitment)
  isVoting = proxyCall(this.contract.methods.isVoting)
  /**
   * Query maximum notice period.
   * @returns Current maximum notice period.
   */
  maxNoticePeriod = proxyCall(this.contract.methods.maxNoticePeriod, undefined, toBigNumber)

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

  async getLockedCommitmentValue(account: string, noticePeriod: string): Promise<BigNumber> {
    const commitment = await this.contract.methods.getLockedCommitment(account, noticePeriod).call()
    return this.getValueFromCommitment(commitment)
  }

  async getLockedCommitments(account: string): Promise<Commitment[]> {
    return this.zipAccountTimesAndValuesToCommitments(
      account,
      this.contract.methods.getNoticePeriods,
      this.getLockedCommitmentValue.bind(this)
    )
  }

  async getNotifiedCommitmentValue(account: string, availTime: string): Promise<BigNumber> {
    const commitment = await this.contract.methods.getNotifiedCommitment(account, availTime).call()
    return this.getValueFromCommitment(commitment)
  }

  async getNotifiedCommitments(account: string): Promise<Commitment[]> {
    return this.zipAccountTimesAndValuesToCommitments(
      account,
      this.contract.methods.getAvailabilityTimes,
      this.getNotifiedCommitmentValue.bind(this)
    )
  }

  async getCommitments(account: string): Promise<Commitments> {
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

  private async getParsedSignatureOfAddress(address: string, signer: string) {
    const hash = Web3.utils.soliditySha3({ type: 'address', value: address })
    const signature = (await this.kit.web3.eth.sign(hash, signer)).slice(2)
    return {
      r: `0x${signature.slice(0, 64)}`,
      s: `0x${signature.slice(64, 128)}`,
      v: Web3.utils.hexToNumber(signature.slice(128, 130)) + 27,
    }
  }

  private async zipAccountTimesAndValuesToCommitments(
    account: string,
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
