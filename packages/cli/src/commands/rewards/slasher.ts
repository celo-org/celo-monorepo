// Not intended for publication.  Used only as scaffolding to develop contractkit.
import { Address } from '@celo/contractkit/lib/base'
import { ValidatorsWrapper } from '@celo/contractkit/lib/wrappers/Validators'
import { sleep } from '@celo/utils/lib/async'
import { bitIsSet, parseBlockExtraData } from '@celo/utils/lib/istanbul'
import { BaseCommand } from '../../base'

export default class Slasher extends BaseCommand {
  static description = 'Mines for slashable downtime'

  static flags = {
    ...BaseCommand.flags,
  }

  static args = []

  static examples = ['slasher']

  async run() {
    this.parse(Slasher)
    const validators = await this.kit.contracts.getValidators()
    const downtimeSlasher = await this.kit.contracts.getDowntimeSlasher()
    const slashableDowntime = await downtimeSlasher.slashableDowntime()
    let validatorDownSince: number[] = []

    let blockNumber = (await this.kit.web3.eth.getBlockNumber()) - 1
    let epochNumber = -2
    while (true) {
      const newBlockNumber = await this.kit.web3.eth.getBlockNumber()
      while (blockNumber < newBlockNumber) {
        blockNumber++

        const newEpochNumber = await this.kit.getEpochNumberOfBlock(blockNumber)
        if (epochNumber !== newEpochNumber) {
          epochNumber = newEpochNumber
          console.info(`New epoch: ${epochNumber}`)
          validatorDownSince = await mapSignerIndexedDataToNextEpoch(
            validators,
            blockNumber,
            validatorDownSince,
            -1
          )
        }

        const block = await this.kit.web3.eth.getBlock(blockNumber)
        console.info(`New block: ${blockNumber}`)

        const istanbulExtra = parseBlockExtraData(block.extraData)
        const round = istanbulExtra.aggregatedSeal.round.toNumber()
        console.info(`Round: ${round}`)

        for (let i = 0; i < validatorDownSince.length; i++) {
          const validatorUp = bitIsSet(istanbulExtra.aggregatedSeal.bitmap, i)
          if (validatorUp) {
            if (validatorDownSince[i] >= 0) {
              validatorDownSince[i] = -1
            }
          } else {
            if (validatorDownSince[i] < 0) {
              validatorDownSince[i] = blockNumber
            } else if (blockNumber - validatorDownSince[i] >= slashableDowntime) {
              validatorDownSince[i] = -1
              console.info(`Slashing signer index ${i} for downtime through block ${blockNumber}`)
              await downtimeSlasher.slashEndSignerIndex(blockNumber, i)
            }
          }
        }
      }
      await sleep(1)
    }
  }
}

async function mapSignerIndexedDataToNextEpoch<T>(
  validators: ValidatorsWrapper,
  blockNumber: number,
  signerData: T[],
  initialValue: T
): Promise<T[]> {
  const oldEpochSigners = await validators.getSignersForBlock(blockNumber - 1)
  if (oldEpochSigners.length !== signerData.length) {
    throw new Error(`Signer set size mismatch ${oldEpochSigners.length} != ${signerData.length}`)
  }

  const newEpochSigners = await validators.getSignersForBlock(blockNumber)
  const oldEpochSignerIndex: Array<{
    signer: Address
    index: number
  }> = oldEpochSigners.map((signer: Address, index: number) => ({ signer, index }))
  const newEpochSignerIndex: Array<{
    signer: Address
    index: number
  }> = newEpochSigners.map((signer: Address, index: number) => ({ signer, index }))
  oldEpochSignerIndex.sort((a, b) => a.signer.localeCompare(b.signer))
  newEpochSignerIndex.sort((a, b) => a.signer.localeCompare(b.signer))

  const ret = [...Array(newEpochSigners.length).fill(initialValue)]
  for (let i = 0, j = 0; i < oldEpochSigners.length && j < newEpochSigners.length /**/; ) {
    if (oldEpochSignerIndex[i].signer < newEpochSignerIndex[i].signer) {
      i++
    } else if (newEpochSignerIndex[j].signer < oldEpochSignerIndex[i].signer) {
      j++
    } else {
      ret[newEpochSignerIndex[j].index] = signerData[oldEpochSignerIndex[i].index]
      i++
      j++
    }
  }
  return ret
}
