import { zip } from '@celo/utils/lib/src/collections'
import BN from 'bn.js'
import Web3 from 'web3'
import { TransactionObject } from 'web3/eth/types'
import { Address } from '../base'
import { LockedGold } from '../generated/types/LockedGold'
import { BaseWrapper } from '../wrappers/BaseWrapper'

export interface VotingDetails {
  accountAddress: Address
  voterAddress: Address
  weight: BN
}

interface Commitment {
  time: BN
  value: BN
}

export interface Commitments {
  locked: Commitment[]
  notified: Commitment[]
  total: {
    gold: BN
    weight: BN
  }
}

enum Roles {
  validating,
  voting,
  rewards,
}

export class LockedGoldWrapper extends BaseWrapper<LockedGold> {
  async getAccountWeight(account: Address): Promise<BN> {
    const accountWeight = await this.contract.methods.getAccountWeight(account).call()
    return Web3.utils.toBN(accountWeight)
  }

  async getVotingDetails(accountOrVoterAddress: Address): Promise<VotingDetails> {
    const accountAddress = await this.contract.methods
      .getAccountFromDelegateAndRole(accountOrVoterAddress, Roles.voting)
      .call()

    return {
      accountAddress,
      voterAddress: accountOrVoterAddress,
      weight: await this.getAccountWeight(accountAddress),
    }
  }

  async getLockedCommitmentValue(account: string, noticePeriod: string): Promise<BN> {
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

  async getNotifiedCommitmentValue(account: string, availTime: string): Promise<BN> {
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

    let gold = new BN(0)
    locked.forEach((bond) => (gold = gold.add(bond.value)))
    notified.forEach((bond) => (gold = gold.add(bond.value)))

    return {
      locked,
      notified,
      total: { weight, gold },
    }
  }

  // FIXME this.contract.methods.delegateRewards does not exist
  async delegateRewardsTx(account: string, delegate: string): Promise<TransactionObject<void>> {
    const sig = await this.getParsedSignatureOfAddress(account, delegate)

    return this.contract.methods.delegateRole(Roles.rewards, delegate, sig.v, sig.r, sig.s)
  }

  private getValueFromCommitment(commitment: { 0: string; 1: string }) {
    return Web3.utils.toBN(commitment[0])
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
    valueFunc: (account: string, time: string) => Promise<BN>
  ) {
    const accountTimes = await timesFunc(account).call()
    const accountValues = await Promise.all(accountTimes.map((time) => valueFunc(account, time)))
    return zip(
      // tslint:disable-next-line: no-object-literal-type-assertion
      (time, value) => ({ time, value } as Commitment),
      accountTimes.map((time) => Web3.utils.toBN(time)),
      accountValues
    )
  }
}
