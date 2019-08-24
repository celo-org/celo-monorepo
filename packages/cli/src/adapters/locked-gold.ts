import { LockedGold } from '@celo/walletkit'
import BN from 'bn.js'
import Web3 from 'web3'
import { TransactionObject } from 'web3/eth/types'
import { Address, zip } from '../utils/helpers'

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

export class LockedGoldAdapter {
  public contractPromise: ReturnType<typeof LockedGold>

  constructor(private web3: Web3, from?: Address) {
    this.contractPromise = LockedGold(this.web3, from)
  }

  contract() {
    return this.contractPromise
  }

  async getAccountWeight(account: Address): Promise<BN> {
    const contract = await this.contract()
    const accountWeight = await contract.methods.getAccountWeight(account).call()
    return Web3.utils.toBN(accountWeight)
  }

  async getVotingDetails(accountOrVoterAddress: Address): Promise<VotingDetails> {
    const contract = await this.contract()

    const accountAddress = await contract.methods
      .getAccountFromDelegateAndRole(accountOrVoterAddress, Roles.voting)
      .call()

    return {
      accountAddress,
      voterAddress: accountOrVoterAddress,
      weight: await this.getAccountWeight(accountAddress),
    }
  }

  async getLockedCommitmentValue(account: string, noticePeriod: string) {
    const contract = await this.contract()
    const commitment = await contract.methods.getLockedCommitment(account, noticePeriod).call()
    return this.getValueFromCommitment(commitment)
  }

  async zipAccountTimesAndValuesToCommitments(
    account: string,
    timesFunc: (account: string) => TransactionObject<string[]>,
    valueFunc: (account: string, time: string) => Promise<BN>
  ) {
    const accountTimes = await timesFunc(account).call()
    const accountValues = await Promise.all(
      accountTimes.map((time) => valueFunc.apply(this, [account, time]))
    )
    return zip(
      (time, value) => ({ time, value } as Commitment),
      accountTimes.map((time) => Web3.utils.toBN(time)),
      accountValues
    )
  }

  async getLockedGold(account: string): Promise<Commitment[]> {
    const contract = await this.contract()
    return this.zipAccountTimesAndValuesToCommitments(
      account,
      contract.methods.getNoticePeriods,
      this.getLockedCommitmentValue
    )
  }

  async getNotifiedCommitmentValue(account: string, availTime: string) {
    const contract = await this.contract()
    const commitment = await contract.methods.getNotifiedCommitment(account, availTime).call()
    return this.getValueFromCommitment(commitment)
  }

  async getNotifiedCommitments(account: string): Promise<Commitment[]> {
    const contract = await this.contract()
    return this.zipAccountTimesAndValuesToCommitments(
      account,
      contract.methods.getAvailabilityTimes,
      this.getNotifiedCommitmentValue
    )
  }

  getValueFromCommitment(commitment: { 0: string; 1: string }) {
    return Web3.utils.toBN(commitment[0])
  }

  async getCommitments(account: string): Promise<Commitments> {
    const locked = await this.getLockedGold(account)
    const notified = await this.getNotifiedCommitments(account)
    const weight = await this.getAccountWeight(account)

    let gold = new BN(0)
    locked.forEach((commitment) => (gold = gold.add(commitment.value)))
    notified.forEach((commitment) => (gold = gold.add(commitment.value)))

    return {
      locked,
      notified,
      total: { weight, gold },
    }
  }

  async delegateRewardsTx(account: string, delegate: string) {
    const contract = await this.contract()
    const sig = await this.getParsedSignatureOfAddress(account, delegate)

    return contract.methods.delegateRole(Roles.rewards, delegate, sig.v, sig.r, sig.s)
  }

  async getParsedSignatureOfAddress(address: string, signer: string) {
    // @ts-ignore
    const hash = Web3.utils.soliditySha3({ type: 'address', value: address })
    const signature = (await this.web3.eth.sign(hash, signer)).slice(2)
    return {
      r: `0x${signature.slice(0, 64)}`,
      s: `0x${signature.slice(64, 128)}`,
      v: Web3.utils.hexToNumber(signature.slice(128, 130)) + 27,
    }
  }
}
