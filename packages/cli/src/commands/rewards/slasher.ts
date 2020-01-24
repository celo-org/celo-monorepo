// Not intended for publication.  Used only as scaffolding to develop contractkit.
import { Address } from '@celo/contractkit'
import { Validator } from '@celo/contractkit/lib/wrappers/Validators'
import { mapAddressListDataOnto } from '@celo/utils/lib/address'
import { sleep } from '@celo/utils/lib/async'
import { bitIsSet, parseBlockExtraData } from '@celo/utils/lib/istanbul'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'

export default class Slasher extends BaseCommand {
  static description = 'Slashes for downtime'

  static flags = {
    ...BaseCommand.flags,
    dryRun: flags.boolean({ description: 'Dry run' }),
    slashableDowntime: flags.integer({ description: 'Downtime to slash for' }),
    slashValidator: flags.string({ description: 'Slash validator address' }),
    forDowntimeEndingAtBlock: flags.integer({
      description: 'Slash validator for downtime ending at block',
    }),
  }

  static args = []

  static examples = ['slasher']

  async run() {
    const res = this.parse(Slasher)
    const downtimeSlasher = await this.kit.contracts.getDowntimeSlasher()

    if (res.flags.slashValidator && res.flags.forDowntimeEndingAtBlock) {
      await newCheckBuilder(this)
        .isValidator(res.flags.slashValidator)
        .runChecks()
      const validators = await this.kit.contracts.getValidators()
      const validator = await validators.getValidator(res.flags.slashValidator)
      await this.slashValidatorForDowntimeEndingAtBlock(
        validator,
        res.flags.forDowntimeEndingAtBlock,
        res.flags.dryRun
      )
    } else {
      const slashableDowntime =
        res.flags.slashableDowntime || (await downtimeSlasher.slashableDowntime())
      await this.slasher(slashableDowntime, res.flags.dryRun)
    }
  }

  async slasher(slashableDowntime: number, dryRun: boolean) {
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()

    let validatorSigners: Address[] = []
    let validatorDownSince: number[] = []
    let blockNumber = (await this.kit.web3.eth.getBlockNumber()) - 1
    let epochNumber = -2
    console.info(`Slashing for downtime >= ${slashableDowntime} ...`)

    // Don't use web3.eth.subscribe in case we're connected over HTTP
    while (true) {
      const newBlockNumber = await this.kit.web3.eth.getBlockNumber()
      while (blockNumber < newBlockNumber) {
        blockNumber++

        const newEpochNumber = await this.kit.getEpochNumberOfBlock(blockNumber)
        if (epochNumber !== newEpochNumber) {
          epochNumber = newEpochNumber
          console.info(`New epoch: ${epochNumber}`)
          const oldEpochSigners = await election.getValidatorSigners(blockNumber - 1)
          const newEpochSigners = await election.getValidatorSigners(blockNumber)
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
              console.info(`Validator:${i}: "${validator.name}" downtime=${downtime} slashable`)
              await this.slashValidatorForDowntimeEndingAtBlock(
                validator,
                blockNumber,
                dryRun
              ).catch(console.log)
              validatorDownSince[i] = -1
            }
          }
        }
      }
      await sleep(1)
    }
  }

  async slashValidatorForDowntimeEndingAtBlock(
    validator: Validator,
    blockNumber: number,
    dryRun: boolean
  ) {
    const downtimeSlasher = await this.kit.contracts.getDowntimeSlasher()
    console.info(`Slashing "${validator.name}" for downtime ending at ${blockNumber}`)
    const slashTx = await downtimeSlasher.slashValidator(validator.address, undefined, blockNumber)
    if (dryRun) {
      console.info(slashTx)
      const res = await slashTx.txo.call()
      console.info(res)
    } else {
      const res = await displaySendTx('slashing', slashTx)
      console.info(res)
    }
  }
}
