import { findAddressIndex } from '@celo/base/lib/address'
import { TransactionObject } from 'web3-eth'
import { Contract } from 'web3-eth-contract'
import { BaseWrapper, proxyCall, toTransactionObject, valueToBigNumber } from './BaseWrapper'

type TrailingSlasherParams = [
  number | string,
  string[],
  string[],
  Array<number | string>,
  string[],
  string[],
  Array<number | string>
]

interface SlasherContract extends Contract {
  methods: {
    slash(...args: any): TransactionObject<void>
    slashingIncentives(): TransactionObject<{
      penalty: string
      reward: string
    }>
  }
}

export class BaseSlasher<T extends SlasherContract> extends BaseWrapper<T> {
  protected async signerIndexAtBlock(address: string, blockNumber: number) {
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const validator = await validators.getValidator(address, blockNumber)
    return findAddressIndex(validator.signer, await election.getValidatorSigners(blockNumber))
  }

  protected async trailingSlashArgs(
    address: string,
    blockNumber: number
  ): Promise<TrailingSlasherParams> {
    const validators = await this.kit.contracts.getValidators()
    const account = await validators.validatorSignerToAccount(address)
    const membership = await validators.getValidatorMembershipHistoryIndex(account, blockNumber)
    const incentives = await this.slashingIncentives()
    const lockedGold = await this.kit.contracts.getLockedGold()
    const lockedGoldValidatorSlash = await lockedGold.computeInitialParametersForSlashing(
      account,
      incentives.penalty
    )
    const lockedGoldValidatorGroupSlash = await lockedGold.computeParametersForSlashing(
      membership.group,
      incentives.penalty,
      lockedGoldValidatorSlash.list
    )
    return [
      membership.historyIndex,
      lockedGoldValidatorSlash.lessers,
      lockedGoldValidatorSlash.greaters,
      lockedGoldValidatorSlash.indices,
      lockedGoldValidatorGroupSlash.lessers,
      lockedGoldValidatorGroupSlash.greaters,
      lockedGoldValidatorGroupSlash.indices,
    ]
  }

  protected slash = (...args: Parameters<T['methods']['slash']>) =>
    toTransactionObject(this.kit, this.contract.methods.slash(...args))

  /**
   * Returns slashing incentives.
   * @return Rewards and penalties for slashing.
   */
  public slashingIncentives = proxyCall(
    this.contract.methods.slashingIncentives,
    undefined,
    (res) => ({
      reward: valueToBigNumber(res.reward),
      penalty: valueToBigNumber(res.penalty),
    })
  )
}
