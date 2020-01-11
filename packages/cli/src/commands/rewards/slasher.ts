// Not intended for publication.  Used only as scaffolding to develop contractkit.
import { mapAddressListDataOnto } from '@celo/utils/lib/address'
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
          const oldEpochSigners = await validators.getValidatorSignerAddressSet(blockNumber - 1)
          const newEpochSigners = await validators.getValidatorSignerAddressSet(blockNumber)
          validatorDownSince = await mapAddressListDataOnto(
            validatorDownSince,
            oldEpochSigners,
            newEpochSigners,
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
