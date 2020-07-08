import { concurrentMap } from '@celo/utils/lib/async'
import { bitIsSet, parseBlockExtraData } from '@celo/utils/lib/istanbul'
import { flags } from '@oclif/command'
import { readFileSync } from 'fs'
import { BaseCommand } from '../../base'
import { Flags } from '../../utils/command'
import { ElectionResultsCache } from '../../utils/election'

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
    'downtime --genesis ./genesis.json',
    'downtime',
    'downtime --at-block 100000 --genesis ./genesis.json',
    'downtime --lookback 500 --genesis ./genesis.json',
  ]

  async run() {
    const res = this.parse(ValidatorSignedBlocks)
    let electionCache

    // Validators added from extra data in genesis
    const missedBlocks = new Map<string, number[]>()

    const latest = res.flags['at-block']
      ? res.flags['at-block'] + 1
      : (await this.web3.eth.getBlock('latest')).number

    // If running from genesis, do that, otherwise pull from contracts..
    let electedSigners: string[]
    if (!res.flags.genesis) {
      const election = await this.kit.contracts.getElection()
      const validators = await this.kit.contracts.getValidators()
      const epochSize = await validators.getEpochSize()
      electionCache = new ElectionResultsCache(election, epochSize.toNumber())
      electedSigners = await electionCache.electedSigners(latest)
    } else {
      const genesisJson = JSON.parse(readFileSync(res.flags.genesis, 'utf-8'))
      electedSigners = parseBlockExtraData(genesisJson.extraData).addedValidators
    }

    // Get blocks
    const blocks = await concurrentMap(10, [...Array(res.flags.lookback).keys()], (i) =>
      this.web3.eth.getBlock(latest - res.flags.lookback! + i + 1)
    )
    // Calculate uptime
    for (const block of blocks) {
      // Grab new validators on new epoch
      if (!res.flags.genesis) {
        // @ts-ignore
        electedSigners = await electionCache.electedSigners(block.number)
      }
      for (let i = 0; i < electedSigners.length; i++) {
        if (!missedBlocks.has(electedSigners[i])) {
          missedBlocks.set(electedSigners[i], [])
        }
        const bitmap = parseBlockExtraData(block.extraData).parentAggregatedSeal.bitmap
        if (!bitIsSet(bitmap, i)) {
          // @ts-ignore
          missedBlocks.get(electedSigners[i]).push(block.number)
        }
      }
    }

    // Print info
    for (const [signer, missed] of missedBlocks) {
      console.info(`${signer} missed: ${missed}`)
    }
  }
}
