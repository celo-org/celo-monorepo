// Not intended for publication.  Used only as scaffolding to develop contractkit.
import { Address } from '@celo/contractkit'
import { mapAddressListDataOnto } from '@celo/utils/lib/address'
import { sleep } from '@celo/utils/lib/async'
import { bitIsSet, parseBlockExtraData } from '@celo/utils/lib/istanbul'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'

export default class Slasher extends BaseCommand {
  static description = 'Slashes for downtime'

  static flags = {
    ...BaseCommand.flags,
    slashableDowntime: flags.integer({ description: 'Downtime to slash for' }),
  }

  static args = []

  static examples = ['slasher']

  async run() {
    const res = this.parse(Slasher)
    const validators = await this.kit.contracts.getValidators()
    const downtimeSlasher = await this.kit.contracts.getDowntimeSlasher()
    const slashableDowntime =
      res.flags.slashableDowntime || (await downtimeSlasher.slashableDowntime())
    let validatorSigners: Address[] = []
    let validatorDownSince: number[] = []
    let blockNumber = (await this.kit.web3.eth.getBlockNumber()) - 1
    let epochNumber = -2
    console.info(`Slashing for downtime >= ${slashableDowntime} ...`)

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
          validatorSigners = newEpochSigners
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
        const seal = istanbulExtra.aggregatedSeal

        for (let i = 0; i < validatorDownSince.length; i++) {
          const validatorUp = bitIsSet(seal.bitmap, i)
          if (validatorUp) {
            if (validatorDownSince[i] >= 0) {
              const downtime = blockNumber - validatorDownSince[i]
              validatorDownSince[i] = -1
              const validator = await validators.getValidatorFromSigner(validatorSigners[i])
              console.info(
                `Validator:${i}: "${validator.name}" back at block ${blockNumber}, downtime=${downtime}`
              )
            }
          } else {
            if (validatorDownSince[i] < 0) {
              validatorDownSince[i] = blockNumber
              const validator = await validators.getValidatorFromSigner(validatorSigners[i])
              console.info(`Validator:${i}: "${validator.name}" missing from block ${blockNumber}`)
            } else if (blockNumber - validatorDownSince[i] >= slashableDowntime) {
              const downtime = blockNumber - validatorDownSince[i]
              const validator = await validators.getValidatorFromSigner(validatorSigners[i])
              console.info(
                `Validator:${i}: "${validator.name}" slashing for downtime=${downtime} at ${blockNumber}`
              )
              const slashTx = await downtimeSlasher.slashEndSignerIndex(blockNumber, i)
              await displaySendTx('slashing', slashTx)
              validatorDownSince[i] = -1
            }
          }
        }
      }
      await sleep(1)
    }
  }
}
