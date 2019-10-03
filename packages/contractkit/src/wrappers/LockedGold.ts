import { zip } from '@celo/utils/lib/collections'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
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
  unlock = proxySend(this.kit, this.contract.methods.unlock)
  createAccount = proxySend(this.kit, this.contract.methods.createAccount)
  withdraw = proxySend(this.kit, this.contract.methods.withdraw)
  lock = proxySend(this.kit, this.contract.methods.lock)
  relock = proxySend(this.kit, this.contract.methods.relock)

  getAccountTotalLockedGold = proxyCall(
    this.contract.methods.getAccountTotalLockedGold,
    undefined,
    toBigNumber
  )
  getAccountNonvotingLockedGold = proxyCall(
    this.contract.methods.getAccountNonvotingLockedGold,
    undefined,
    toBigNumber
  )
  getVoterFromAccount: (account: string) => Promise<Address> = proxyCall(
    this.contract.methods.getVoterFromAccount
  )
  getValidatorFromAccount: (account: string) => Promise<Address> = proxyCall(
    this.contract.methods.getValidatorFromAccount
  )

  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<LockedGoldConfig> {
    return {
      unlockingPeriod: toBigNumber(await this.contract.methods.unlockingPeriod().call()),
    }
  }

  /**
   * Authorize voting on behalf of this account to another address.
   * @param account Address of the active account.
   * @param voter Address to be used for voting.
   * @return A CeloTransactionObject
   */
  async authorizeVoter(account: Address, voter: Address): Promise<CeloTransactionObject<void>> {
    const sig = await this.getParsedSignatureOfAddress(account, voter)
    return wrapSend(this.kit, this.contract.methods.authorizeVoter(voter, sig.v, sig.r, sig.s))
  }

  /**
   * Authorize validating on behalf of this account to another address.
   * @param account Address of the active account.
   * @param voter Address to be used for validating.
   * @return A CeloTransactionObject
   */
  async authorizeValidator(
    account: Address,
    validator: Address
  ): Promise<CeloTransactionObject<void>> {
    const sig = await this.getParsedSignatureOfAddress(account, validator)
    return wrapSend(
      this.kit,
      this.contract.methods.authorizeValidator(validator, sig.v, sig.r, sig.s)
    )
  }

  async getPendingWithdrawals(account: string) {
    const withdrawals = await this.contract.methods.getPendingWithdrawals(account).call()
    return zip(
      // tslint:disable-next-line: no-object-literal-type-assertion
      (time, value) =>
        ({ time: toBigNumber(time), value: toBigNumber(value) } as PendingWithdrawal),
      withdrawals[1],
      withdrawals[0]
    )
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
}
