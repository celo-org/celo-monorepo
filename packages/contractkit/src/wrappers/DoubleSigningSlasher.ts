import { findAddressIndex } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { Address } from '../base'
import { DoubleSigningSlasher } from '../generated/DoubleSigningSlasher'
import {
  BaseWrapper,
  CeloTransactionObject,
  proxyCall,
  toTransactionObject,
  valueToBigNumber,
  valueToInt,
} from './BaseWrapper'

/**
 * Contract handling slashing for Validator double-signing
 */
export class DoubleSigningSlasherWrapper extends BaseWrapper<DoubleSigningSlasher> {
  /**
   * Returns slashing incentives.
   * @return Rewards and penaltys for slashing.
   */
  slashingIncentives = proxyCall(this.contract.methods.slashingIncentives, undefined, (res): {
    reward: BigNumber
    penalty: BigNumber
  } => ({
    reward: valueToBigNumber(res.reward),
    penalty: valueToBigNumber(res.penalty),
  }))

  /**
   * Parses block number out of header.
   * @param header RLP encoded header
   * @return Block number.
   */
  async getBlockNumberFromHeader(header: string): Promise<number> {
    const res = await this.contract.methods.getBlockNumberFromHeader(header).call()
    return valueToInt(res)
  }

  /**
   * Slash a Validator for double-signing.
   * @param validator Validator to slash.
   * @param headerA First double signed block header.
   * @param headerB Second double signed block header.
   */
  async slashValidator(
    validatorAddress: Address,
    headerA: string,
    headerB: string
  ): Promise<CeloTransactionObject<void>> {
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const validator = await validators.getValidator(validatorAddress)
    const blockNumber = await this.getBlockNumberFromHeader(headerA)
    return this.slash(
      findAddressIndex(validator.signer, await election.getValidatorSigners(blockNumber)),
      headerA,
      headerB
    )
  }

  /**
   * Slash a Validator for double-signing.
   * @param validator Validator to slash.
   * @param headerA First double signed block header.
   * @param headerB Second double signed block header.
   */
  async slashSigner(
    signerAddress: Address,
    headerA: string,
    headerB: string
  ): Promise<CeloTransactionObject<void>> {
    const election = await this.kit.contracts.getElection()
    const blockNumber = await this.getBlockNumberFromHeader(headerA)
    return this.slash(
      findAddressIndex(signerAddress, await election.getValidatorSigners(blockNumber)),
      headerA,
      headerB
    )
  }

  /**
   * Slash a Validator for double-signing.
   * @param signerIndex Validator index at the block.
   * @param headerA First double signed block header.
   * @param headerB Second double signed block header.
   */
  private async slash(
    signerIndex: number,
    headerA: string,
    headerB: string
  ): Promise<CeloTransactionObject<void>> {
    const incentives = await this.slashingIncentives()
    const blockNumber = await this.getBlockNumberFromHeader(headerA)
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const signer = await election.validatorSignerAddressFromSet(signerIndex, blockNumber)
    const validator = await validators.getValidatorFromSigner(signer)
    const membership = await validators.getValidatorMembershipHistoryIndex(validator, blockNumber)
    const lockedGold = await this.kit.contracts.getLockedGold()
    const slashValidator = await lockedGold.computeInitialParametersForSlashing(
      validator.address,
      incentives.penalty
    )
    const slashGroup = await lockedGold.computeParametersForSlashing(
      membership.group,
      incentives.penalty,
      slashValidator.list
    )

    return toTransactionObject(
      this.kit,
      this.contract.methods.slash(
        signer,
        signerIndex,
        headerA,
        headerB,
        membership.historyIndex,
        slashValidator.lessers,
        slashValidator.greaters,
        slashValidator.indices,
        slashGroup.lessers,
        slashGroup.greaters,
        slashGroup.indices
      )
    )
  }
}
