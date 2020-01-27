import { Address } from '@celo/contractkit'
import { eqAddress } from '@celo/utils/lib/address'
import { bitIsSet, parseBlockExtraData } from '@celo/utils/lib/istanbul'
import { Block } from 'web3/eth/types'

/**
 * Cache to efficiently retreive the elected validators for many blocks within an epoch.
 */
export class ElectionResultsCache {
  private readonly cache = new Map()

  constructor(private readonly election: any, private readonly epochSize: number) {}

  /**
   * Returns the list of elected signers for a given block.
   * @param blockNumber The block number to get elected signers for.
   */
  async electedSigners(blockNumber: number): Promise<Address[]> {
    const epoch = this.epochNumber(blockNumber)
    const cached = this.cache.get(epoch)
    if (cached) {
      return cached
    }
    const electedSigners = await this.election.getCurrentValidatorSigners(
      this.firstBlockOfEpoch(epoch)
    )
    this.cache.set(epoch, electedSigners)
    return electedSigners
  }

  /**
   * Returns true if the given signer is elected at the given block number.
   * @param signer Validator signer address to check if elected.
   * @param blockNumber The block number to check the election status at.
   */
  async elected(signer: Address, blockNumber: number): Promise<boolean> {
    const electedSigners = await this.electedSigners(blockNumber)
    return electedSigners.some(eqAddress.bind(null, signer))
  }

  /**
   * Returns true if the given signer is present in the parent aggregated seal of the given block.
   * @param signer Validator signer address to check if presnt in the block.
   * @param block The block to check for a signature on.
   */
  async signed(signer: Address, block: Block): Promise<boolean> {
    const electedSigners = await this.electedSigners(block.number)
    const signerIndex = electedSigners.map(eqAddress.bind(null, signer)).indexOf(true)
    if (signerIndex < 0) {
      return false
    }
    const bitmap = parseBlockExtraData(block.extraData).parentAggregatedSeal.bitmap
    return bitIsSet(bitmap, signerIndex)
  }

  private epochNumber(blockNumber: number): number {
    return Math.ceil(blockNumber / this.epochSize)
  }

  private firstBlockOfEpoch(epochNumber: number): number {
    return (epochNumber - 1) * this.epochSize + 1
  }
}
