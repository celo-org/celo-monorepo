import { stopProvider } from '@celo/contractkit/lib/utils/provider-utils'
import { concurrentMap } from '@celo/utils/lib/async'
import { flags } from '@oclif/command'
import chalk from 'chalk'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'
import { Flags } from '../../utils/command'
import { ElectionResultsCache } from '../../utils/election'

export default class ValidatorSignedBlocks extends BaseCommand {
  static description =
    "Display a graph of blocks and whether the given signer's signature is included in each. A green '.' indicates the signature is present in that block, a red '✘' indicates the signature is not present. A yellow '~' indicates the signer is not elected for that block."

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
    signer: Flags.address({
      description: 'address of the signer to check for signatures',
      exclusive: ['signers'],
    }),
    signers: Flags.addressArray({
      description: 'list of signer addresses to check for signatures',
      exclusive: ['signer'],
    }),
    wasDownWhileElected: flags.boolean({
      description: 'indicate whether a validator was down while elected for range',
    }),
    'at-block': flags.integer({
      description: 'latest block to examine for signer activity',
      exclusive: ['follow'],
    }),
    lookback: flags.integer({
      description: 'how many blocks to look back for signer activity',
      default: 120,
      exclusive: ['slashableDowntime'],
    }),
    slashableDowntimeLookback: flags.boolean({
      description: 'lookback of slashableDowntime',
      exclusive: ['lookback'],
    }),
    width: flags.integer({
      description: 'line width for printing marks',
      default: 40,
    }),
    follow: flags.boolean({
      char: 'f',
      default: false,
      exclusive: ['at-block'],
      hidden: true,
    }),
  }

  static examples = [
    'signed-blocks --signer 0x5409ED021D9299bf6814279A6A1411A7e866A631',
    'signed-blocks --signer 0x5409ED021D9299bf6814279A6A1411A7e866A631 --follow',
    'signed-blocks --at-block 100000 --signer 0x5409ED021D9299bf6814279A6A1411A7e866A631',
    'signed-blocks --lookback 500 --signer 0x5409ED021D9299bf6814279A6A1411A7e866A631',
    'signed-blocks --lookback 50 --width 10 --signer 0x5409ED021D9299bf6814279A6A1411A7e866A631',
  ]

  async run() {
    const res = this.parse(ValidatorSignedBlocks)
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const epochSize = await validators.getEpochSize()
    const electionCache = new ElectionResultsCache(election, epochSize.toNumber())

    if (res.flags.follow) {
      console.info('Follow mode, press q or ctrl-c to quit')
    }

    const latest = res.flags['at-block']
      ? res.flags['at-block'] + 1
      : (await this.web3.eth.getBlock('latest')).number

    let lookback: number
    if (res.flags.slashableDowntimeLookback) {
      const downtimeSlasher = await this.kit.contracts.getDowntimeSlasher()
      lookback = await downtimeSlasher.slashableDowntime()
    } else {
      lookback = res.flags.lookback
    }

    const blocks = await concurrentMap(10, [...Array(lookback).keys()], (i) =>
      this.web3.eth.getBlock(latest - lookback! + i + 1)
    )

    const signers = res.flags.signers ?? [res.flags.signer!]

    for (const signer of signers) {
      let wasDown: boolean
      let wasElected: boolean
      let printer: MarkPrinter
      if (res.flags.wasDownWhileElected) {
        wasDown = true
        wasElected = true
      } else {
        printer = new MarkPrinter(res.flags.width!)
      }
      try {
        for (const block of blocks) {
          const elected = await electionCache.elected(signer, block.number - 1)
          const signed = elected && (await electionCache.signedParent(signer, block))
          if (res.flags.wasDownWhileElected) {
            wasElected = wasElected! && elected
            wasDown = wasDown! && !signed
          } else {
            printer!.addMark(block.number - 1, elected, signed)
          }
        }

        if (res.flags.follow) {
          const web3 = await this.newWeb3()
          const subscription = web3.eth
            .subscribe('newBlockHeaders', (error) => {
              if (error) {
                this.error(error)
              }
            })
            .on('data', async (block) => {
              const elected = await electionCache.elected(signer, block.number - 1)
              const signed = elected && (await electionCache.signedParent(signer, block))
              if (!res.flags.wasDownWhileElected) {
                printer!.addMark(block.number - 1, elected, signed)
              }
            })
            .on('error', (error) => {
              this.error(`error in block header subscription: ${error}`)
            })

          try {
            let response: string
            do {
              response = await cli.prompt('', { prompt: '', type: 'single', required: false })
            } while (response !== 'q' && response !== '\u0003' /* ctrl-c */)
          } finally {
            await subscription.unsubscribe()
            await stopProvider(web3.currentProvider)
          }
        }
      } finally {
        if (res.flags.wasDownWhileElected) {
          const was = (b: boolean) => 'was' + (b ? '' : ' not')
          console.log(`signer ${signer} ${was(wasElected!)} elected and ${was(wasDown!)} down`)
        } else {
          await printer!.done()
        }
      }
    }
  }
}

/**
 * Printer object to output marks in a grid to indicate signing status.
 */
// tslint:disable-next-line:max-classes-per-file
class MarkPrinter {
  private previousBlockNumber: number | null = null

  constructor(private width: number) {}

  addMark(blockNumber: number, elected: boolean, signed: boolean) {
    if (this.previousBlockNumber === null) {
      const labelNumber = Math.floor(blockNumber / this.width) * this.width
      this.previousBlockNumber = labelNumber - 1
    }
    if (blockNumber <= this.previousBlockNumber - 1) {
      throw new Error(
        `cannot add mark for ${blockNumber} which is not after ${this.previousBlockNumber}`
      )
    }

    for (let i = this.previousBlockNumber + 1; i <= blockNumber; i++) {
      if (i % this.width === 0) {
        this.printLineLabel(i)
      }
      if (i < blockNumber) {
        process.stdout.write(' ')
      } else {
        process.stdout.write(this.mark(elected, signed))
      }
    }
    this.previousBlockNumber = blockNumber
  }

  async done() {
    // Print a final newline to complete the line.
    return new Promise((resolve, reject) => {
      process.stdout.write('\n', (err: any) => {
        err ? reject(err) : resolve()
      })
    })
  }

  private mark(elected: boolean, signed: boolean) {
    return elected ? (signed ? chalk.green('.') : chalk.red('✘')) : chalk.yellow('~')
  }

  private printLineLabel(blockNumber: number, newline: boolean = true) {
    if (newline) {
      process.stdout.write('\n')
    }
    process.stdout.write(`${blockNumber} `.padStart(8, ' '))
  }
}
