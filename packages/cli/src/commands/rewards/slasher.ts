import { Address } from '@celo/contractkit'
import { Validator } from '@celo/contractkit/lib/wrappers/Validators'
import { mapAddressListDataOnto } from '@celo/utils/lib/address'
import { concurrentMap, sleep } from '@celo/utils/lib/async'
import { bitIsSet, parseBlockExtraData } from '@celo/utils/lib/istanbul'
import { flags } from '@oclif/command'
import { cli } from 'cli-ux'
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
    gas: flags.integer({ description: 'Gas to supply for slashing transactions' }),
    maxSlashAttempts: flags.integer({ description: 'Attempt slashing a max of N times' }),
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

    // Run manual or automatic
    const downtimeSlasher = await this.kit.contracts.getDowntimeSlasher()
    if (res.flags.slashValidator && res.flags.forDowntimeEndingAtBlock) {
      const validators = await this.kit.contracts.getValidators()
      const validator = await validators.getValidator(res.flags.slashValidator)
      await this.slashValidatorForDowntimeEndingAtBlock(
        validator,
        res.flags.forDowntimeEndingAtBlock,
        res.flags.dryRun,
        res.flags.gas
      )
    } else if (res.flags.automatic) {
      const slashableDowntime =
        res.flags.slashableDowntime || (await downtimeSlasher.slashableDowntime())
      await this.slasher(
        slashableDowntime,
        res.flags.maxSlashAttempts || 0,
        res.flags.dryRun,
        res.flags.gas
      )
    } else {
      throw new Error(
        'Either --automatic or --slashValidator and --forDowntimeEndingAtBlock is required'
      )
    }
  }

  async slasher(
    slashableDowntime: number,
    maxSlashAttempts: number,
    dryRun: boolean,
    slashGas?: number
  ) {
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    // We need to wait for an extra block to estimateGas
    const extraWait = slashGas && !dryRun ? 0 : 1

    let validatorSet: Validator[] = []
    let validatorSigners: Address[] = []
    // Negative validatorDownSince indicates validator is up
    let validatorDownSince: number[] = []
    let blockNumber = (await this.kit.web3.eth.getBlockNumber()) - 1
    let epochNumber = -1
    let slashAttempts = 0
    console.info(`Slashing for downtime >= ${slashableDowntime} with extraWait = ${extraWait} ...`)

    // Don't use web3.eth.subscribe in case we're connected over HTTP
    while (!maxSlashAttempts || slashAttempts < maxSlashAttempts) {
      const newBlockNumber = await this.kit.web3.eth.getBlockNumber()
      while (blockNumber < newBlockNumber) {
        blockNumber++

        const newEpochNumber = await this.kit.getEpochNumberOfBlock(blockNumber)
        if (epochNumber !== newEpochNumber) {
          epochNumber = newEpochNumber
          console.info(`New epoch: ${epochNumber}`)

          // Map validator indices across epochs, initializing validatorDownSince to -1
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
        const sealBlockNumber = blockNumber - 1

        // Check for each validator in tip parentSeal
        for (let i = 0; i < validatorSet.length; i++) {
          const validatorUp = bitIsSet(seal.bitmap, i)
          if (validatorUp) {
            if (validatorDownSince[i] >= 0) {
              const downtime = sealBlockNumber - validatorDownSince[i]
              validatorDownSince[i] = -1
              const validator = validatorSet[i]
              console.info(
                `Validator:${i}: "${validator.name}" back at block ${sealBlockNumber}, downtime=${downtime}`
              )
            }
          } else {
            if (validatorDownSince[i] < 0) {
              validatorDownSince[i] = sealBlockNumber
              const validator = validatorSet[i]
              console.info(
                `Validator:${i}: "${validator.name}" missing from block ${sealBlockNumber}`
              )
            } else if (
              sealBlockNumber - validatorDownSince[i] + 1 >=
              slashableDowntime + extraWait
            ) {
              const downtime = sealBlockNumber - validatorDownSince[i] + 1
              const validator = validatorSet[i]
              console.info(`Validator:${i}: "${validator.name}" downtime=${downtime} slashable`)
              await this.slashValidatorForDowntimeEndingAtBlock(
                validator,
                sealBlockNumber - extraWait,
                dryRun,
                slashGas
              ).catch(console.log)
              validatorDownSince[i] = -1
              slashAttempts++
              if (maxSlashAttempts && slashAttempts >= maxSlashAttempts) {
                break
              }
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
    dryRun: boolean,
    gas?: number
  ) {
    const downtimeSlasher = await this.kit.contracts.getDowntimeSlasher()
    console.info(
      `Slashing ${validator.address} "${validator.name}" for downtime ending at ${blockNumber}`
    )
    const slashTx = await downtimeSlasher.slashValidator(validator.address, undefined, blockNumber)
    if (dryRun) {
      console.info(`encodeABI: ` + slashTx.txo.encodeABI())
      try {
        const estimatedGas = Math.round(
          (await slashTx.txo.estimateGas()) * this.kit.gasInflationFactor
        )
        console.info(`Dry-run succeeded, estimated gas: ${estimatedGas}`)
      } catch (error) {
        console.info(`Dry-run failed: ${error}`)
      }
    } else {
      try {
        await displaySendTx('slashing', slashTx, { gas })
      } catch (error) {
        cli.action.stop()
        console.info(`Slashing failed: ${error}`)
      }
    }
  }
}
