import { Address } from '@celo/connect'
import { SnarkEpochDataSlasher } from '../generated/SnarkEpochDataSlasher'
import { BaseSlasher } from './BaseSlasher'
import { valueToInt } from './BaseWrapper'

/**
 * Contract handling slashing for Validator double-signing
 */
export class SnarkEpochDataSlasherWrapper extends BaseSlasher<SnarkEpochDataSlasher> {
  /**
   * Parses block number out of slashing data.
   * @param header Slashing data
   * @return Block number.
   */
  async getBlockNumberFromData(header: string): Promise<number> {
    const res = await this.contract.methods.getBlockNumberFromData(header).call()
    return valueToInt(res)
  }

  /**
   * Slash a Validator for double-signing.
   * @param validator Validator to slash.
   * @param headerA First double signed block header.
   * @param headerB Second double signed block header.
   */
  async slashValidator(validatorAddress: Address, headerA: string, headerB: string) {
    const validators = await this.kit.contracts.getValidators()
    const validator = await validators.getValidator(validatorAddress)
    return this.slashSigner(validator.signer, headerA, headerB)
  }

  /**
   * Slash a Validator for double-signing epoch snark data.
   * @param validator Validator to slash.
   * @param headerA First proof of signing.
   * @param headerB Second proof of signing.
   */
  async slashSigner(signerAddress: Address, headerA: string, headerB: string) {
    const blockNumber = await this.getBlockNumberFromData(headerA)
    const index = await this.signerIndexAtBlock(signerAddress, blockNumber)
    return this.slash(
      signerAddress,
      index,
      headerA,
      headerB,
      ...(await this.trailingSlashArgs(signerAddress, blockNumber))
    )
  }
}
