import { findAddressIndex } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { Address } from '../base'
import { DowntimeSlasher } from '../generated/DowntimeSlasher'
import {
  BaseWrapper,
  CeloTransactionObject,
  proxyCall,
  toTransactionObject,
  valueToBigNumber,
  valueToInt,
} from './BaseWrapper'
import { Validator } from './Validators'

export interface DowntimeSlasherConfig {
  slashableDowntime: number
  slashingIncentives: {
    reward: BigNumber
    penalty: BigNumber
  }
}

export interface DowntimeWindow {
  start: number
  end: number
  length: number
}

/**
 * Contract handling slashing for Validator downtime
 */
export class DowntimeSlasherWrapper extends BaseWrapper<DowntimeSlasher> {
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
   * Returns slashable downtime in blocks.
   * @return The number of consecutive blocks before a Validator missing from IBFT consensus
   * can be slashed.
   */
  slashableDowntime = proxyCall(this.contract.methods.slashableDowntime, undefined, valueToInt)

  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<DowntimeSlasherConfig> {
    const res = await Promise.all([this.slashableDowntime(), this.slashingIncentives()])
    return {
      slashableDowntime: res[0],
      slashingIncentives: res[1],
    }
  }

  /**
   * Tests if a validator has been down.
   * @param startBlock First block of the downtime.
   * @param startSignerIndex Validator index at the first block.
   * @param endSignerIndex Validator index at the last block.
   */
  isDown = proxyCall(this.contract.methods.isDown)

  /**
   * Tests if the given validator or signer has been down.
   * @param validatorOrSignerAddress Address of the validator account or signer.
   * @param startBlock First block of the downtime, undefined if using endBlock.
   * @param endBlock Last block of the downtime. Determined from startBlock or grandparent of latest block if not provided.
   */
  async isValidatorDown(validatorOrSignerAddress: Address, startBlock?: number, endBlock?: number) {
    const window = await this.getSlashableDowntimeWindow(startBlock, endBlock)
    const startSignerIndex = await this.getValidatorSignerIndex(
      validatorOrSignerAddress,
      window.start
    )
    const endSignerIndex = await this.getValidatorSignerIndex(validatorOrSignerAddress, window.end)
    return this.isDown(window.start, startSignerIndex, endSignerIndex)
  }

  /**
   * Determines the validator signer given an account or signer address and block number.
   * @param validatorOrSignerAddress Address of the validator account or signer.
   * @param blockNumber Block at which to determine the signer index.
   */
  async getValidatorSignerIndex(validatorOrSignerAddress: Address, blockNumber: number) {
    // If the provided address is the account, fetch the signer at the given block.
    const accounts = await this.kit.contracts.getAccounts()
    const validators = await this.kit.contracts.getValidators()
    const isAccount = await accounts.isAccount(validatorOrSignerAddress)
    const signer = isAccount
      ? (await validators.getValidator(validatorOrSignerAddress, blockNumber)).signer
      : validatorOrSignerAddress

    // Determine the index of the validator signer in the elected set at the given block.
    const election = await this.kit.contracts.getElection()
    const index = findAddressIndex(signer, await election.getValidatorSigners(blockNumber))
    if (index < 0) {
      throw new Error(`Validator signer ${signer} was not elected at block ${blockNumber}`)
    }
    return index
  }

  /**
   * Slash a Validator for downtime.
   * @param validator Validator account or signer to slash for downtime.
   * @param startBlock First block of the downtime, undefined if using endBlock.
   * @param endBlock Last block of the downtime. Determined from startBlock or grandparent of latest block if not provided.
   */
  async slashValidator(
    validatorOrSignerAddress: Address,
    startBlock?: number,
    endBlock?: number
  ): Promise<CeloTransactionObject<void>> {
    const window = await this.getSlashableDowntimeWindow(startBlock, endBlock)
    return this.slashEndSignerIndex(
      window.end,
      await this.getValidatorSignerIndex(validatorOrSignerAddress, window.end)
    )
  }

  /**
   * Slash a Validator for downtime.
   * @param startBlock First block of the downtime.
   * @param startSignerIndex Validator index at the first block.
   */
  async slashStartSignerIndex(
    startBlock: number,
    startSignerIndex: number
  ): Promise<CeloTransactionObject<void>> {
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const signer = await election.validatorSignerAddressFromSet(startSignerIndex, startBlock)
    const startEpoch = await this.kit.getEpochNumberOfBlock(startBlock)
    // Follows DowntimeSlasher.getEndBlock()
    const endBlock = startBlock + (await this.slashableDowntime()) - 1
    const endEpoch = await this.kit.getEpochNumberOfBlock(endBlock)
    const endSignerIndex =
      startEpoch === endEpoch
        ? startSignerIndex
        : findAddressIndex(signer, await election.getValidatorSigners(endBlock))
    const validator = await validators.getValidatorFromSigner(signer)
    return this.slash(validator, startBlock, startSignerIndex, endSignerIndex)
  }

  /**
   * Slash a Validator for downtime.
   * @param endBlock The last block of the downtime to slash for.
   * @param endSignerIndex Validator index at the last block.
   */
  async slashEndSignerIndex(
    endBlock: number,
    endSignerIndex: number
  ): Promise<CeloTransactionObject<void>> {
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const signer = await election.validatorSignerAddressFromSet(endSignerIndex, endBlock)
    const endEpoch = await this.kit.getEpochNumberOfBlock(endBlock)
    // Reverses DowntimeSlasher.getEndBlock()
    const startBlock = endBlock - (await this.slashableDowntime()) + 1
    const startEpoch = await this.kit.getEpochNumberOfBlock(startBlock)
    const startSignerIndex =
      startEpoch === endEpoch
        ? endSignerIndex
        : findAddressIndex(signer, await election.getValidatorSigners(startBlock))
    const validator = await validators.getValidatorFromSigner(signer)
    return this.slash(validator, startBlock, startSignerIndex, endSignerIndex)
  }

  /**
   * Slash a Validator for downtime.
   * @param validator Validator to slash for downtime.
   * @param startBlock First block of the downtime.
   * @param startSignerIndex Validator index at the first block.
   * @param endSignerIndex Validator index at the last block.
   */
  private async slash(
    validator: Validator,
    startBlock: number,
    startSignerIndex: number,
    endSignerIndex: number
  ): Promise<CeloTransactionObject<void>> {
    const incentives = await this.slashingIncentives()
    const validators = await this.kit.contracts.getValidators()
    const membership = await validators.getValidatorMembershipHistoryIndex(validator, startBlock)
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
        startBlock,
        startSignerIndex,
        endSignerIndex,
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

  /**
   * Calculate the slashable window with respect to a provided start or end block number.
   * @param startBlock First block of the downtime. Determined from endBlock if not provided.
   * @param endBlock Last block of the downtime. Determined from startBlock or grandparent of latest block if not provided.
   */
  private async getSlashableDowntimeWindow(
    startBlock?: number,
    endBlock?: number
  ): Promise<DowntimeWindow> {
    const length = await this.slashableDowntime()
    if (startBlock !== undefined && endBlock !== undefined) {
      if (endBlock - startBlock + 1 !== length) {
        throw new Error(`Start and end block must define a window of ${length} blocks`)
      }
      return {
        start: startBlock,
        end: endBlock,
        length,
      }
    }
    if (endBlock !== undefined) {
      return {
        start: endBlock - length + 1,
        end: endBlock,
        length,
      }
    }
    if (startBlock !== undefined) {
      return {
        start: startBlock,
        end: startBlock + length - 1,
        length,
      }
    }

    // Use the latest grandparent because that is the most recent block eligible for inclusion.
    const latest = (await this.kit.web3.eth.getBlockNumber()) - 2
    return {
      start: latest - length + 1,
      end: latest,
      length,
    }
  }
}
