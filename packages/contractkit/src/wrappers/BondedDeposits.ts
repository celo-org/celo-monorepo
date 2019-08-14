import { zip } from '@celo/utils/lib/src/collections'
import BN from 'bn.js'
import { Address } from 'src/base'
import { BondedDeposits } from 'src/generated/types/BondedDeposits'
import { BaseWrapper } from 'src/wrappers/BaseWrapper'
import Web3 from 'web3'
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

enum roles {
  validating,
  voting,
  rewards,
}

export class BondedDepositsWrapper extends BaseWrapper<BondedDeposits> {
  async getAccountWeight(account: Address): Promise<BN> {
    const accountWeight = await this.contract.methods.getAccountWeight(account).call()
    return Web3.utils.toBN(accountWeight)
  }

  // async getVotingDetails(_accountOrVoterAddress: Address): Promise<VotingDetails> {
  //   throw new Error('Requires FIX on Incompatible Contract')
  // }
  async getVotingDetails(accountOrVoterAddress: Address): Promise<VotingDetails> {
    const accountAddress = await this.contract.methods
      .getAccountFromDelegateAndRole(accountOrVoterAddress, roles.voting)
      .call()

    return {
      accountAddress,
      voterAddress: accountOrVoterAddress,
      weight: await this.getAccountWeight(accountAddress),
    }
  }

  async getBondedDepositValue(account: string, noticePeriod: string) {
    const deposit = await this.contract.methods.getBondedDeposit(account, noticePeriod).call()
    return this.getValueFromDeposit(deposit)
  }

  async zipAccountTimesAndValuesToDeposits(
    account: string,
    timesFunc: (account: string) => TransactionObject<string[]>,
    valueFunc: (account: string, time: string) => Promise<BN>
  ) {
    const accountTimes = await timesFunc(account).call()
    const accountValues = await Promise.all(accountTimes.map((time) => valueFunc(account, time)))
    return zip(
      // tslint:disable-next-line: no-object-literal-type-assertion
      (time, value) => ({ time, value } as Deposit),
      accountTimes.map((time) => Web3.utils.toBN(time)),
      accountValues
    )
  }

  async getBondedDeposits(account: string): Promise<Deposit[]> {
    return this.zipAccountTimesAndValuesToDeposits(
      account,
      this.contract.methods.getNoticePeriods,
      this.getBondedDepositValue.bind(this)
    )
  }

  async getNotifiedDepositValue(account: string, availTime: string) {
    const deposit = await this.contract.methods.getNotifiedDeposit(account, availTime).call()
    return this.getValueFromDeposit(deposit)
  }

  async getNotifiedDeposits(account: string): Promise<Deposit[]> {
    return this.zipAccountTimesAndValuesToDeposits(
      account,
      this.contract.methods.getAvailabilityTimes,
      this.getNotifiedDepositValue.bind(this)
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

  // FIXME this.contract.methods.delegateRewards does not exist
  async delegateRewardsTx(account: string, delegate: string) {
    const sig = await this.getParsedSignatureOfAddress(account, delegate)

    return this.contract.methods.delegateRole(roles.rewards, delegate, sig.v, sig.r, sig.s)
  }

  async getParsedSignatureOfAddress(address: string, signer: string) {
    const hash = Web3.utils.soliditySha3({ type: 'address', value: address })
    const signature = (await this.kit.web3.eth.sign(hash, signer)).slice(2)
    return {
      r: `0x${signature.slice(0, 64)}`,
      s: `0x${signature.slice(64, 128)}`,
      v: Web3.utils.hexToNumber(signature.slice(128, 130)) + 27,
    }
  }
}
