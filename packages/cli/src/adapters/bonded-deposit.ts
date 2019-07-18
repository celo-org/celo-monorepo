import Web3 from 'web3'
import { BondedDeposits } from '../generated/contracts'
import { Address, zip } from '../utils/helpers'

import BN from 'bn.js'
import { TransactionObject } from 'web3/eth/types'

export interface VotingDetails {
  accountAddress: Address
  voterAddress: Address
  weight: BN
}

interface Deposit {
  time: BN
  value: BN
}

export interface Deposits {
  bonded: Deposit[]
  notified: Deposit[]
  total: {
    gold: BN
    weight: BN
  }
}
export class BondedDepositAdapter {
  public contractPromise: ReturnType<typeof BondedDeposits>

  constructor(private web3: Web3, from?: Address) {
    this.contractPromise = BondedDeposits(this.web3, from)
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

    const accountAddress = await contract.methods.getAccountFromVoter(accountOrVoterAddress).call()

    return {
      accountAddress,
      voterAddress: accountOrVoterAddress,
      weight: await this.getAccountWeight(accountAddress),
    }
  }

  async getBondedDepositValue(account: string, noticePeriod: string) {
    const contract = await this.contract()
    const deposit = await contract.methods.getBondedDeposit(account, noticePeriod).call()
    return this.getValueFromDeposit(deposit)
  }

  async zipAccountTimesAndValuesToDeposits(
    account: string,
    timesFunc: (account: string) => TransactionObject<string[]>,
    valueFunc: (account: string, time: string) => Promise<BN>
  ) {
    const accountTimes = await timesFunc(account).call()
    const accountValues = await Promise.all(
      accountTimes.map((time) => valueFunc.apply(this, [account, time]))
    )
    return zip(
      (time, value) => ({ time, value } as Deposit),
      accountTimes.map((time) => Web3.utils.toBN(time)),
      accountValues
    )
  }

  async getBondedDeposits(account: string): Promise<Deposit[]> {
    const contract = await this.contract()
    return this.zipAccountTimesAndValuesToDeposits(
      account,
      contract.methods.getNoticePeriods,
      this.getBondedDepositValue
    )
  }

  async getNotifiedDepositValue(account: string, availTime: string) {
    const contract = await this.contract()
    const deposit = await contract.methods.getNotifiedDeposit(account, availTime).call()
    return this.getValueFromDeposit(deposit)
  }

  async getNotifiedDeposits(account: string): Promise<Deposit[]> {
    const contract = await this.contract()
    return this.zipAccountTimesAndValuesToDeposits(
      account,
      contract.methods.getAvailabilityTimes,
      this.getNotifiedDepositValue
    )
  }

  getValueFromDeposit(deposit: { 0: string; 1: string }) {
    return Web3.utils.toBN(deposit[0])
  }

  async getDeposits(account: string): Promise<Deposits> {
    const bonded = await this.getBondedDeposits(account)
    const notified = await this.getNotifiedDeposits(account)
    const weight = await this.getAccountWeight(account)

    let gold = new BN(0)
    bonded.forEach((bond) => (gold = gold.add(bond.value)))
    notified.forEach((bond) => (gold = gold.add(bond.value)))

    return {
      bonded,
      notified,
      total: { weight, gold },
    }
  }

  async delegateRewardsTx(account: string, delegate: string) {
    const contract = await this.contract()
    const sig = await this.getParsedSignatureOfAddress(account, delegate)

    return contract.methods.delegateRewards(delegate, sig.v, sig.r, sig.s)
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
