import { Address } from '../base'
import { DoubleSigningSlasher } from '../generated/DoubleSigningSlasher'
import { BaseSlasher } from './BaseSlasher'
import { valueToInt } from './BaseWrapper'

/**
 * Contract handling slashing for Validator double-signing
 */
export class DoubleSigningSlasherWrapper extends BaseSlasher<DoubleSigningSlasher> {
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
   * @param validatorAddress Validator to slash.
   * @param headerA First double signed block header.
   * @param headerB Second double signed block header.
   */
  async slashValidator(validatorAddress: Address, headerA: string, headerB: string) {
    const validators = await this.kit.contracts.getValidators()
    const validator = await validators.getValidator(validatorAddress)
    return this.slashSigner(validator.signer, headerA, headerB)
  }

  /**
   * Slash a Validator signer for double-signing.
   * @param signer Validator signer address to slash.
   * @param headerA First double signed block header.
   * @param headerB Second double signed block header.
   */
  async slashSigner(signerAddress: Address, headerA: string, headerB: string) {
    const blockNumber = await this.getBlockNumberFromHeader(headerA)
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
