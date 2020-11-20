import { flags } from '@oclif/command'
import { cli } from 'cli-ux'
import fs from 'fs'
import { writeFileSync } from 'fs-extra'
import { EventLog } from 'web3-core'
import { BaseCommand } from '../../../base'
import {
  AttestationIssuers,
  calculateRewards,
  initializeBalancesByBlock,
  mergeEvents,
  processAttestationCompletion,
  processTransfer,
  RewardsCalculationState,
} from '../../../utils/events'

export default class CalculateRewards extends BaseCommand {
  static description = 'Parses Events for data'

  static flags = {
    ...BaseCommand.flags,
    attestationEvents: flags.string({
      required: true,
      description: 'File containing AttestationCompleted events',
    }),
    transferEvents: flags.string({
      required: true,
      multiple: true,
      description: 'File containing Transfer events',
    }),
  }

  async run() {
    const res = this.parse(CalculateRewards)
    const attestationEvents = JSON.parse(fs.readFileSync(res.flags.attestationEvents, 'utf8'))
    // parse multiple Json events input files
    const transferEvents = res.flags.transferEvents.reduce(
      (arr: EventLog[], eventsArr): EventLog[] => {
        const events = JSON.parse(fs.readFileSync(eventsArr, 'utf8'))
        return arr.concat(events)
      },
      []
    )
    // const transferEvents = JSON.parse(fs.readFileSync(res.flags.transferEvents, 'utf8'))
    const allEvents: EventLog[] = mergeEvents(attestationEvents, transferEvents)

    // State over time
    const trackIssuers: AttestationIssuers = {}
    const attestationCompletions = {}
    const balances = {}
    const balancesByBlock = {}
    const state: RewardsCalculationState = {
      attestationCompletions,
      balances,
      balancesByBlock,
      // TODO: Move these into cmd args
      blockNumberToStartTracking: 0,
      blockNumberToFinishTracking: 3500000,
      startedBlockBalanceTracking: false,
      rewardPercentage: 0.06,
    }

    const progressBar = cli.progress()
    progressBar.start(allEvents.length, 0)

    allEvents.forEach((event, index) => {
      progressBar.update(index)
      if (
        event.blockNumber >= state.blockNumberToStartTracking &&
        !state.startedBlockBalanceTracking
      ) {
        initializeBalancesByBlock(state)
        state.startedBlockBalanceTracking = true
      }

      switch (event.event) {
        case 'AttestationCompleted':
          processAttestationCompletion(state, trackIssuers, event)
          break
        case 'Transfer':
          processTransfer(state, event)
          break
        default:
          throw new Error('Unknown event')
      }
    })
    progressBar.stop()

    writeFileSync(
      'rewardsBalances.json',
      JSON.stringify(
        calculateRewards(
          balancesByBlock,
          state.blockNumberToStartTracking,
          state.blockNumberToFinishTracking,
          state.rewardPercentage
        ),
        null,
        2
      )
    )
    writeFileSync('rewardsCalculationState.json', JSON.stringify(state, null, 2))

    console.info('Done')
  }
}
