import BigNumber from 'bignumber.js'
import { Address } from '../base'
import { DoubleSigningSlasher } from '../generated/types/DoubleSigningSlasher'
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
  getBlockNumberFromHeader = proxyCall(
    this.contract.methods.getBlockNumberFromHeader,
    undefined,
    valueToInt
  )

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
    const validators = await this.kit.contracts.getValidators()
    const validator = await validators.getValidator(validatorAddress)
    const blockNumber = await this.getBlockNumberFromHeader([headerA])
    return this.slash(
      validators.findSignerIndex(
        validator.signer,
        await validators.getSignersForBlock(blockNumber)
      ),
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
    const validators = await this.kit.contracts.getValidators()
    const blockNumber = await this.getBlockNumberFromHeader([headerA])
    return this.slash(
      validators.findSignerIndex(signerAddress, await validators.getSignersForBlock(blockNumber)),
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
  async slash(
    signerIndex: number,
    headerA: string,
    headerB: string
  ): Promise<CeloTransactionObject<void>> {
    const incentives = await this.slashingIncentives()
    const blockNumber = await this.getBlockNumberFromHeader([headerA])
    const validators = await this.kit.contracts.getValidators()
    const signer = await validators.validatorSignerAddressFromSet(signerIndex, blockNumber)
    const validator = await validators.getValidatorFromSigner(signer)
    const membership = await validators.getValidatorGroupMembership(validator.address, blockNumber)
    const lockedGold = await this.kit.contracts.getLockedGold()
    const slashValidator = await lockedGold.computeParametersForSlashing(
      validator.address,
      incentives.penalty
    )
    const slashGroup = await lockedGold.computeParametersForSlashing(
      membership.group,
      incentives.penalty
    )

    return toTransactionObject(
      this.kit,
      this.contract.methods.slash(
        signer,
        signerIndex,
        [headerA],
        [headerB],
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
