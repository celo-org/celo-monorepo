import { findAddressIndex } from '@celo/base/lib/address'
import { CeloTxObject, Contract, toTransactionObject } from '@celo/connect'
import { proxyCall, valueToBigNumber } from './BaseWrapper'
import { BaseWrapperForGoverning } from './BaseWrapperForGoverning'

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
    slash(...args: any): CeloTxObject<void>
    slashingIncentives(): CeloTxObject<{
      penalty: string
      reward: string
    }>
  }
}

export class BaseSlasher<T extends SlasherContract> extends BaseWrapperForGoverning<T> {
  protected async signerIndexAtBlock(address: string, blockNumber: number) {
    const election = await this.contracts.getElection()
    const validators = await this.contracts.getValidators()
    const validator = await validators.getValidator(address, blockNumber)
    return findAddressIndex(validator.signer, await election.getValidatorSigners(blockNumber))
  }

  protected async trailingSlashArgs(
    address: string,
    blockNumber: number
  ): Promise<TrailingSlasherParams> {
    const validators = await this.contracts.getValidators()
    const account = await validators.validatorSignerToAccount(address)
    const membership = await validators.getValidatorMembershipHistoryIndex(account, blockNumber)
    const incentives = await this.slashingIncentives()
    const lockedGold = await this.contracts.getLockedGold()
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
    toTransactionObject(this.connection, this.contract.methods.slash(...args))

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
