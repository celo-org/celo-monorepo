import { eqAddress } from '@celo/utils/lib/address'
import { zip } from '@celo/utils/lib/collections'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
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
  toTransactionObject,
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
  authorizations: {
    voter: null | string
    validator: null | string
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
   * Unlocks gold that becomes withdrawable after the unlocking period.
   * @param value The amount of gold to unlock.
   */
  unlock: (value: NumberLike) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.unlock,
    tupleParser(parseNumber)
  )
  /**
   * Creates an account.
   */
  createAccount = proxySend(this.kit, this.contract.methods.createAccount)
  /**
   * Withdraws a gold that has been unlocked after the unlocking period has passed.
   * @param index The index of the pending withdrawal to withdraw.
   */
  withdraw: (index: number) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.withdraw
  )
  /**
   * @notice Locks gold to be used for voting.
   */
  lock = proxySend(this.kit, this.contract.methods.lock)
  /**
   * Relocks gold that has been unlocked but not withdrawn.
   * @param index The index of the pending withdrawal to relock.
   */
  relock: (index: number) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.relock
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
   * Returns the voter for the specified account.
   * @param account The address of the account.
   * @return The address with which the account can vote.
   */
  getVoterFromAccount: (account: string) => Promise<Address> = proxyCall(
    this.contract.methods.getVoterFromAccount
  )
  /**
   * Returns the validator for the specified account.
   * @param account The address of the account.
   * @return The address with which the account can register a validator or group.
   */
  getValidatorFromAccount: (account: string) => Promise<Address> = proxyCall(
    this.contract.methods.getValidatorFromAccount
  )
  /**
   * Check if an account already exists.
   * @param account The address of the account
   * @return Returns `true` if account exists. Returns `false` otherwise.
   */
  isAccount: (account: string) => Promise<boolean> = proxyCall(this.contract.methods.isAccount)
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
    const voter = await this.getVoterFromAccount(account)
    const validator = await this.getValidatorFromAccount(account)
    const pendingWithdrawals = await this.getPendingWithdrawals(account)
    return {
      lockedGold: {
        total,
        nonvoting,
      },
      authorizations: {
        voter: eqAddress(voter, account) ? null : voter,
        validator: eqAddress(validator, account) ? null : validator,
      },
      pendingWithdrawals,
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
    // TODO(asa): Pass default tx "from" argument.
    return toTransactionObject(
      this.kit,
      this.contract.methods.authorizeVoter(voter, sig.v, sig.r, sig.s)
    )
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
    return toTransactionObject(
      this.kit,
      this.contract.methods.authorizeValidator(validator, sig.v, sig.r, sig.s)
    )
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

  private async getParsedSignatureOfAddress(address: Address, signer: string) {
    const hash = Web3.utils.soliditySha3({ type: 'address', value: address })
    const signature = (await this.kit.web3.eth.sign(hash, signer)).slice(2)
    return {
      r: `0x${signature.slice(0, 64)}`,
      s: `0x${signature.slice(64, 128)}`,
      v: Web3.utils.hexToNumber(signature.slice(128, 130)) + 27,
    }
  }
}
