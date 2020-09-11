import { Address } from '@celo/contractkit'
import { concurrentMap } from '@celo/utils/lib/async'
import { bitIsSet, parseBlockExtraData } from '@celo/utils/lib/istanbul'
import { flags } from '@oclif/command'
import { cli } from 'cli-ux'
import { readFileSync } from 'fs'
import { BaseCommand } from '../../base'
import { Flags } from '../../utils/command'
import { ElectionResultsCache } from '../../utils/election'

interface VerboseValidatorEntry {
  name: string
  group: string
  address: Address
  count: number
  missedBlocks: number[]
}

interface ValidatorEntry {
  address: Address
  count: number
  missedBlocks: number[]
}

export const verboseStatusTable = {
  address: {},
  name: {},
  group: {},
  count: {},
  missedBlocks: {},
}

export const statusTable = {
  address: {},
  count: {},
  missedBlocks: {},
}

export default class ValidatorSignedBlocks extends BaseCommand {
  static description =
    'Display a list of blocks that each validator missed. Can use the genesis to not rely on contracts, but contracts works better.'

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
    genesis: Flags.path({
      description:
        'path to the genesis block to get the initial validator set, uses contracts if not provided.',
    }),
    'at-block': flags.integer({
      description: 'latest block to examine for signer activity',
    }),
    lookback: flags.integer({
      description: 'how many blocks to look back for signer activity',
      default: 120,
    }),
  }

  static examples = [
    'missed-blocks',
    'missed-blocks --genesis genesis.json',
    'missed-blocks --at-block 100000 --genesis genesis.json',
    'missed-blocks --lookback 500',
  ]

  async run() {
    const res = this.parse(ValidatorSignedBlocks)

    const latest = res.flags['at-block']
      ? res.flags['at-block'] + 1
      : (await this.web3.eth.getBlock('latest')).number

    let electionCache
    let validators, accounts
    let electedSigners: string[]
    const validatorToGroupName = new Map<Address, string>()
    // Try to get contracts, if not try to fall back to genesis block
    try {
      const election = await this.kit.contracts.getElection()
      accounts = await this.kit.contracts.getAccounts()
      validators = await this.kit.contracts.getValidators()
      const vgroups = await validators.getRegisteredValidatorGroups(latest)
      for (const group of vgroups) {
        for (const member of group.members) {
          validatorToGroupName.set(member, group.name || '')
        }
      }
      const epochSize = await validators.getEpochSize()
      electionCache = new ElectionResultsCache(election, epochSize.toNumber())
      electedSigners = await electionCache.electedSigners(latest)
    } catch (e) {
      if (res.flags.genesis) {
        const genesisJson = JSON.parse(readFileSync(res.flags.genesis, 'utf-8'))
        electedSigners = parseBlockExtraData(genesisJson.extraData).addedValidators
      } else {
        if (res.flags['at-block']) {
          this.error(
            'Unable to read contracts at the desired block. Double check that your node provider has not pruned that state.'
          )
        } else {
          this.error('Unable to read contracts & not able to fall back onto genesis.json')
        }
      }
    }

    // Validators added from extra data in genesis
    const missedBlocks = new Map<string, number[]>()

    // Get blocks
    const blocks = await concurrentMap(10, [...Array(res.flags.lookback).keys()], (i) =>
      this.web3.eth.getBlock(latest - res.flags.lookback! + i + 1)
    )
    // Calculate uptime
    for (const block of blocks) {
      // Grab new validators on new epoch
      if (electionCache) {
        electedSigners = await electionCache.electedSigners(block.number)
      }
      for (let i = 0; i < electedSigners.length; i++) {
        if (!missedBlocks.has(electedSigners[i])) {
          missedBlocks.set(electedSigners[i], [])
        }
        const bitmap = parseBlockExtraData(block.extraData).parentAggregatedSeal.bitmap
        if (!bitIsSet(bitmap, i)) {
          // The bitmap refers to signers of the previous block
          // @ts-ignore - TS can't realize that I already initialized this validator entry.
          missedBlocks.get(electedSigners[i]).push(block.number - 1)
        }
      }
    }

    // Print info
    if (accounts && validators) {
      const info: VerboseValidatorEntry[] = []
      for (const [signer, missed] of missedBlocks) {
        const validator = await accounts.signerToAccount(signer)
        let name = 'Unregistered Validator'
        let group = ''
        if (await validators.isValidator(validator)) {
          name = (await accounts.getName(validator)) || ''
          group = validatorToGroupName.get(validator) || ''
        }
        info.push({ address: signer, name, group, count: missed.length, missedBlocks: missed })
      }
      cli.table(info, verboseStatusTable, { 'no-truncate': !res.flags.truncate })
    } else {
      const info: ValidatorEntry[] = []
      for (const [signer, missed] of missedBlocks) {
        info.push({ address: signer, missedBlocks: missed, count: missed.length })
      }
      cli.table(info, statusTable, { 'no-truncate': !res.flags.truncate })
    }
  }
}
