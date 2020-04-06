import { Address } from '@celo/contractkit'
import { Validator } from '@celo/contractkit/lib/wrappers/Validators'
import { mapAddressListDataOnto } from '@celo/utils/lib/address'
import { concurrentMap, sleep } from '@celo/utils/lib/async'
import { bitIsSet, parseBlockExtraData } from '@celo/utils/lib/istanbul'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Slasher extends BaseCommand {
  static description = 'Slashes for downtime'

  static flags = {
    ...BaseCommand.flags,
    automatic: flags.boolean({ description: 'Automatically monitor and slash for downtime' }),
    dryRun: flags.boolean({ description: 'Dry run' }),
    forDowntimeEndingAtBlock: flags.integer({
      description: 'Manually slash validator for downtime ending at block',
    }),
    from: Flags.address({ required: true, description: "Slasher's address" }),
    slashableDowntime: flags.integer({
      description: 'Overrides downtime threshold for automatically slashing',
    }),
    slashValidator: Flags.address({ description: 'Manually slash this validator address' }),
  }

  static args = []

  static examples = ['slasher --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d --automatic']

  async run() {
    const res = this.parse(Slasher)
    this.kit.defaultAccount = res.flags.from
    const checkBuilder = newCheckBuilder(this, res.flags.from)
    checkBuilder.isSignerOrAccount()
    if (res.flags.slashValidator) {
      checkBuilder.isValidator(res.flags.slashValidator)
    }
    await checkBuilder.runChecks()

    const downtimeSlasher = await this.kit.contracts.getDowntimeSlasher()
    if (res.flags.slashValidator && res.flags.forDowntimeEndingAtBlock) {
      const validators = await this.kit.contracts.getValidators()
      const validator = await validators.getValidator(res.flags.slashValidator)
      await this.slashValidatorForDowntimeEndingAtBlock(
        validator,
        res.flags.forDowntimeEndingAtBlock,
        res.flags.dryRun
      )
    } else if (res.flags.automatic) {
      const slashableDowntime =
        res.flags.slashableDowntime || (await downtimeSlasher.slashableDowntime())
      await this.slasher(slashableDowntime, res.flags.dryRun)
    } else {
      throw new Error(
        'Either --automatic or --slashValidator and --forDowntimeEndingAtBlock is required'
      )
    }
  }

  async slasher(slashableDowntime: number, dryRun: boolean) {
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()

    let validatorSet: Validator[] = []
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
          validatorSet = await concurrentMap(10, validatorSigners, (x: Address) =>
            validators.getValidatorFromSigner(x)
          )
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
        const seal = istanbulExtra.parentAggregatedSeal

        for (let i = 0; i < validatorSet.length; i++) {
          const validatorUp = bitIsSet(seal.bitmap, i)
          if (validatorUp) {
            if (validatorDownSince[i] >= 0) {
              const downtime = blockNumber - validatorDownSince[i]
              validatorDownSince[i] = -1
              const validator = validatorSet[i]
              console.info(
                `Validator:${i}: "${validator.name}" back at block ${blockNumber}, downtime=${downtime}`
              )
            }
          } else {
            if (validatorDownSince[i] < 0) {
              validatorDownSince[i] = blockNumber
              const validator = validatorSet[i]
              console.info(`Validator:${i}: "${validator.name}" missing from block ${blockNumber}`)
            } else if (blockNumber - validatorDownSince[i] >= slashableDowntime) {
              const downtime = blockNumber - validatorDownSince[i]
              const validator = validatorSet[i]
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
