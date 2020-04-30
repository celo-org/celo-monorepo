import { Address } from '@celo/contractkit'
import { eqAddress } from '@celo/utils/lib/address'
import { concurrentMap } from '@celo/utils/lib/async'
import { flags } from '@oclif/command'
import { cli } from 'cli-ux'
import { Block } from 'web3-eth'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { Flags } from '../../utils/command'
import { ElectionResultsCache } from '../../utils/election'

interface ValidatorStatusEntry {
  name: string
  address: Address
  signer: Address
  elected: boolean
  frontRunner: boolean
  signatures: number
  proposed: number
}

export const statusTable = {
  address: {},
  name: {},
  signer: {},
  elected: {},
  frontRunner: {},
  proposed: { get: (v: ValidatorStatusEntry) => (v.elected || v.proposed ? v.proposed : '') },
  signatures: {
    get: (v: ValidatorStatusEntry) =>
      isNaN(v.signatures) ? '' : Math.round(v.signatures * 100) + '%',
  },
}

export default class ValidatorStatus extends BaseCommand {
  static description =
    'Shows the consensus status of a validator. This command will show whether a validator is currently elected, would be elected if an election were to be run right now, and the percentage of blocks signed and number of blocks successfully proposed within a given window.'

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
    validator: Flags.address({
      description: 'address of the validator to check if elected and validating',
      exclusive: ['all', 'signer'],
    }),
    signer: Flags.address({
      description: 'address of the signer to check if elected and validating',
      exclusive: ['validator', 'all'],
    }),
    all: flags.boolean({
      description: 'get the status of all registered validators',
      exclusive: ['validator', 'signer'],
    }),
    lookback: flags.integer({
      description: 'how many blocks to look back for signer activity',
      default: 100,
    }),
  }

  static examples = [
    'status --validator 0x5409ED021D9299bf6814279A6A1411A7e866A631',
    'status --all --lookback 100',
  ]

  async run() {
    const res = this.parse(ValidatorStatus)
    const accounts = await this.kit.contracts.getAccounts()
    const validators = await this.kit.contracts.getValidators()
    const election = await this.kit.contracts.getElection()

    // Resolve the signer address(es) from the provide flags.
    let signers: string[] = []
    const checker = newCheckBuilder(this)
    if (res.flags.signer) {
      signers = [res.flags.signer]
      const validator = await accounts.signerToAccount(res.flags.signer)
      checker.isAccount(validator).isValidator(validator)
      await checker.runChecks()
    } else if (res.flags.validator) {
      checker.isAccount(res.flags.validator).isValidator(res.flags.validator)
      await checker.runChecks()
      const signer = await accounts.getValidatorSigner(res.flags.validator)
      signers = [signer]
    } else {
      signers = await concurrentMap(10, await validators.getRegisteredValidatorsAddresses(), (a) =>
        accounts.getValidatorSigner(a)
      )
    }

    if (res.flags.lookback! < 0) {
      this.error('lookback value must be greater than or equal to zero')
    }

    // Fetch the blocks to consider for signature percentages.
    const latest = await this.web3.eth.getBlock('latest')
    let blocks: Block[]
    if (res.flags.lookback! > 1) {
      cli.action.start(`Fetching ${res.flags.lookback} blocks`)
      blocks = await concurrentMap(10, [...Array(res.flags.lookback).keys()], (i) =>
        this.web3.eth.getBlock(latest.number - i)
      )
      cli.action.stop()
    } else {
      blocks = [latest]
    }

    cli.action.start(`Calculating status information`)
    const epochSize = await validators.getEpochSize()
    const electionCache = new ElectionResultsCache(election, epochSize.toNumber())
    let frontRunnerSigners: string[] = []
    try {
      frontRunnerSigners = await election.electValidatorSigners()
    } catch (err) {
      console.warn('Warning: Elections not available')
    }

    const validatorStatuses = await concurrentMap(10, signers, (s) =>
      this.getStatus(s, blocks, electionCache, frontRunnerSigners)
    )
    cli.action.stop()

    cli.table(validatorStatuses, statusTable, { 'no-truncate': !res.flags.truncate })
  }

  private async getStatus(
    signer: Address,
    blocks: Block[],
    electionCache: ElectionResultsCache,
    frontRunnerSigners: Address[]
  ): Promise<ValidatorStatusEntry> {
    const accounts = await this.kit.contracts.getAccounts()
    const validators = await this.kit.contracts.getValidators()
    const validator = await accounts.signerToAccount(signer)
    let name = 'Unregistered validator'
    if (await validators.isValidator(validator)) {
      name = (await accounts.getName(validator)) || ''
    }
    const proposedCount = blocks.filter((b) => eqAddress(b.miner, signer)).length
    let signatures = 0
    let eligible = 0
    for (const block of blocks) {
      if (await electionCache.elected(signer, block.number - 1)) {
        eligible++
        if (await electionCache.signedParent(signer, block)) {
          signatures++
        }
      }
    }
    return {
      name,
      address: validator,
      signer,
      elected: await electionCache.elected(signer, blocks[0].number),
      frontRunner: frontRunnerSigners.some(eqAddress.bind(null, signer)),
      proposed: proposedCount,
      signatures: signatures / eligible, // may be NaN
    }
  }
}
