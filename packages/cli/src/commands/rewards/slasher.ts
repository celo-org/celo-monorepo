import { Validator } from '@celo/contractkit/lib/wrappers/Validators'
import { Address, mapAddressListDataOnto, normalizeAddress } from '@celo/utils/lib/address'
import { concurrentMap, sleep } from '@celo/utils/lib/async'
import { bitIsSet, parseBlockExtraData } from '@celo/utils/lib/istanbul'
import { flags } from '@oclif/command'
import { cli } from 'cli-ux'
import { appendFileSync } from 'fs'
import * as readline from 'readline'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx, printValueMapRecursive } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Slasher extends BaseCommand {
  static description = 'Slashes for downtime'

  static flags = {
    ...BaseCommand.flags,
    automatic: flags.boolean({ description: 'Automatically monitor and slash for downtime' }),
    dryRun: flags.boolean({ description: 'Dry run' }),
    endBlock: flags.integer({ description: 'Stop monitoring after block' }),
    excludeValidator: Flags.address({ description: "Don't slash this validator" }),
    excludeValidatorSigner: Flags.address({ description: "Don't slash this validator" }),
    forDowntimeBeginningAtBlock: flags.integer({
      description: 'Manually slash validator for downtime beginning at block',
    }),
    forDowntimeEndingAtBlock: flags.integer({
      description: 'Manually slash validator for downtime ending at block',
    }),
    from: Flags.address({ required: true, description: "Slasher's address" }),
    gas: flags.integer({ description: 'Gas to supply for slashing transactions' }),
    maxSlashAttempts: flags.integer({ description: 'Attempt slashing a max of N times' }),
    slashableDowntime: flags.integer({
      description: 'Overrides downtime threshold for automatically slashing',
    }),
    slashAgainAfter: flags.integer({ description: 'Slash same validator again after N blocks' }),
    slashLog: flags.string({ description: 'Filename for slash log' }),
    slashValidator: Flags.address({ description: 'Manually slash this validator' }),
    slashValidatorSigner: Flags.address({ description: 'Manually slash this validator' }),
    startBlock: flags.integer({ description: 'Start monitoring on block instead of tip' }),
  }

  static args = []

  static examples = ['slasher --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d --automatic']

  async run() {
    const res = this.parse(Slasher)
    if (res.flags.automatic && (res.flags.slashValidatorSigner || res.flags.slashValidator)) {
      throw new Error('Provided both automatic and slashValidator*')
    }
    if (res.flags.slashValidatorSigner && res.flags.slashValidator) {
      throw new Error('Provided both slashValidatorSigner and slashValidator')
    }
    const accounts = await this.kit.contracts.getAccounts()
    const validators = await this.kit.contracts.getValidators()

    this.kit.defaultAccount = res.flags.from
    const checkBuilder = newCheckBuilder(this, res.flags.from)
    checkBuilder.isSignerOrAccount()
    if (res.flags.slashValidator) {
      checkBuilder.isValidator(res.flags.slashValidator)
    } else if (res.flags.slashValidatorSigner) {
      const account = await accounts.signerToAccount(res.flags.slashValidatorSigner)
      checkBuilder.isValidator(account)
    }
    if (res.flags.excludeValidator) {
      checkBuilder.isValidator(res.flags.excludeValidator)
    }
    if (res.flags.excludeValidatorSigner) {
      const account = await accounts.signerToAccount(res.flags.excludeValidatorSigner)
      checkBuilder.isValidator(account)
    }
    await checkBuilder.runChecks()

    // Run manual or automatic
    const downtimeSlasher = await this.kit.contracts.getDowntimeSlasher()
    if (
      res.flags.slashValidatorSigner &&
      (res.flags.forDowntimeEndingAtBlock || res.flags.forDowntimeBeginningAtBlock)
    ) {
      await this.slashValidatorSignerForDowntime(
        res.flags.slashValidatorSigner,
        res.flags.forDowntimeBeginningAtBlock,
        res.flags.forDowntimeEndingAtBlock,
        res.flags.dryRun,
        res.flags.gas,
        res.flags.slashLog
      )
    } else if (
      res.flags.slashValidator &&
      (res.flags.forDowntimeEndingAtBlock || res.flags.forDowntimeBeginningAtBlock)
    ) {
      const validator = await validators.getValidator(res.flags.slashValidator)
      // Prefer slashing by signer, because to find the signer for a validator at arbitrary height,
      // we would need to consult ValidatorSignerAuthorized events (or an archival node).
      await this.slashValidatorSignerForDowntime(
        validator.signer,
        res.flags.forDowntimeBeginningAtBlock,
        res.flags.forDowntimeEndingAtBlock,
        res.flags.dryRun,
        res.flags.gas,
        res.flags.slashLog
      )
    } else if (res.flags.automatic) {
      const excludeValidator: Record<Address, boolean> = {}
      if (res.flags.excludeValidator) {
        excludeValidator[normalizeAddress(res.flags.excludeValidator)] = true
      }
      if (res.flags.excludeValidatorSigner) {
        excludeValidator[
          normalizeAddress(await accounts.signerToAccount(res.flags.excludeValidatorSigner))
        ] = true
      }
      const slashableDowntime =
        res.flags.slashableDowntime || (await downtimeSlasher.slashableDowntime())
      await this.slasher(
        slashableDowntime,
        res.flags.maxSlashAttempts || 0,
        res.flags.dryRun,
        res.flags.gas,
        res.flags.startBlock,
        res.flags.endBlock,
        res.flags.slashAgainAfter,
        res.flags.slashLog,
        excludeValidator
      )
    } else {
      throw new Error('Either --automatic or --slashValidator* and --forDowntime* is required')
    }
  }

  async slasher(
    slashableDowntime: number,
    maxSlashAttempts: number,
    dryRun: boolean,
    slashGas?: number,
    startBlock?: number,
    endBlock?: number,
    slashAgainAfter?: number,
    slashLogFilename?: string,
    excludeValidator: Record<Address, boolean> = {},
    readStdinCommands: boolean = true
  ) {
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    // We need to wait for an extra block to estimateGas
    const extraWait = slashGas && !dryRun ? 0 : 1
    const alreadySlashed: Record<Address, number> = {}

    let validatorSet: Validator[] = []
    let validatorSigners: Address[] = []
    // Negative validatorDownSince indicates validator is up
    let validatorDownSince: number[] = []
    let blockNumber = startBlock || (await this.kit.web3.eth.getBlockNumber()) - 1
    let epochNumber = -1
    let slashAttempts = 0
    let quit = false
    console.info(`Slashing for downtime >= ${slashableDowntime} with extraWait = ${extraWait} ...`)

    const rl = readStdinCommands
      ? readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        })
      : null
    if (rl) {
      rl.on('line', (command: string) => {
        switch (command) {
          case 'q':
            quit = true
            break
          case 'd':
            console.log('Down validators:')
            for (let i = 0; i < validatorSet.length; i++) {
              if (validatorDownSince[i] < 0) {
                continue
              }
              printValueMapRecursive({
                validator: validatorSet[i].name,
                downSince: validatorDownSince[i],
                downBlocks: blockNumber - validatorDownSince[i],
              })
            }
            break
          default:
            console.log(`Unknown command "${command}"`)
            break
        }
      })
    }

    const done = () =>
      quit ||
      (endBlock && blockNumber >= endBlock) ||
      (maxSlashAttempts && slashAttempts >= maxSlashAttempts)
    while (!done()) {
      // Don't use web3.eth.subscribe in case we're connected over HTTP
      const newBlockNumber = await this.kit.web3.eth.getBlockNumber()
      while (blockNumber < newBlockNumber && !done()) {
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
              const downtimeEndBlock = sealBlockNumber - extraWait
              const validator = validatorSet[i]
              const signer = validatorSigners[i]

              if (excludeValidator[normalizeAddress(validator.address)]) {
                console.info(`Excluded Validator:${i}: "${validator.name}" skipping`)
                continue
              }

              // Unnecessary if tip
              const alreadySlashedSigner = alreadySlashed[normalizeAddress(signer)]
              if (
                alreadySlashedSigner &&
                (!slashAgainAfter || downtimeEndBlock < alreadySlashedSigner + slashAgainAfter)
              ) {
                console.info(`Already slashed Validator:${i}: "${validator.name}" skipping`)
                continue
              } else {
                alreadySlashed[normalizeAddress(signer)] = downtimeEndBlock
              }

              console.info(`Validator:${i}: "${validator.name}" downtime=${downtime} slashable`)
              await this.slashValidatorSignerForDowntime(
                signer,
                undefined,
                downtimeEndBlock,
                dryRun,
                slashGas,
                slashLogFilename
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

    if (rl) {
      rl.close()
    }
  }

  async slashValidatorSignerForDowntime(
    signerAddress: Address,
    startBlock?: number,
    endBlock?: number,
    dryRun?: boolean,
    gas?: number,
    logFile?: string
  ) {
    const validators = await this.kit.contracts.getValidators()
    const validator = await validators.getValidatorFromSigner(signerAddress)
    const downtimeSlasher = await this.kit.contracts.getDowntimeSlasher()
    if (endBlock) {
      console.info(
        `Slashing ${signerAddress}: Validator ${validator.address} "${validator.name}" for downtime ending at ${endBlock}`
      )
    } else if (startBlock) {
      console.info(
        `Slashing ${signerAddress}: Validator ${validator.address} "${validator.name}" for downtime beginning at ${startBlock}`
      )
    } else {
      throw new Error('No block number provided')
    }

    const slashTx = await downtimeSlasher.slashSigner(signerAddress, startBlock, endBlock)
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
        if (logFile) {
          appendFileSync(logFile, `${signerAddress} ${startBlock} ${endBlock}`)
        }
      } catch (error) {
        cli.action.stop()
        console.info(`Slashing failed: ${error}`)
      }
    }
  }
}
