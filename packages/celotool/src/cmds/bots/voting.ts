// The purpose of the Voting bot in a testnet is to add incentives for good
// behavior by validators. This introduces some non-validator stakers into the
// network that will judge the validator groups, and vote accordingly.
import { ContractKit, newKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { BotsArgv } from 'src/cmds/bots'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import { AccountType, getPrivateKeysFor, privateKeyToAddress } from 'src/lib/generate_utils'
import { ensure0x } from 'src/lib/utils'
import { Argv } from 'yargs'

export const command = 'voting'

export const describe = 'for each of the voting bot accounts, vote for the best groups available'

interface SimulateVotingArgv extends BotsArgv {
  celoProvider: string
}

export const builder = (yargs: Argv) => {
  return yargs.option('celoProvider', {
    type: 'string',
    description: 'The node to use',
    default: 'http://localhost:8545',
  })
}

export const handler = async function simulateVoting(argv: SimulateVotingArgv) {
  console.info('starting voting command')
  try {
    // Set up contract kit instance and instances of all the contracts we'll need
    // to interact with
    const kit: ContractKit = newKit(argv.celoProvider)
    const mnemonic = fetchEnv(envVar.MNEMONIC)
    const numVotingBots = parseInt(fetchEnv(envVar.VOTING_BOTS), 10)
    const election = await kit.contracts.getElection()
    const validators = await kit.contracts.getValidators()

    // TODO: this should not be 1. Pick a real value and also deal with TS's terrible float-handling
    // Maybe this should even be variable, based on how "happy" the staker is with their current vote
    const changeVoteProbability = 1

    // Determine which of the groups can accept more votes
    const groupCapacities = new Map<string, BigNumber>()
    for (const vgv of await election.getValidatorGroupsVotes()) {
      if (vgv.eligible && vgv.capacity.isGreaterThan(0)) {
        groupCapacities.set(vgv.address, vgv.capacity)
      }
    }
    console.info(groupCapacities)

    // Collect validator scores for each group
    const groupScores = new Map<string, BigNumber[]>()
    for (const valSigner of await election.electValidatorSigners()) {
      const val = await validators.getValidatorFromSigner(valSigner)
      const groupAddress = val.affiliation!
      if (groupScores.has(groupAddress)) {
        groupScores.get(groupAddress)!.push(val.score)
      } else {
        groupScores.set(groupAddress, [val.score])
      }
    }
    console.info(groupScores)

    // Calculate scores for the group by averaging the collected scores
    const groupAvgScores = new Map<string, BigNumber>()
    for (const group of groupScores.keys()) {
      const scores = groupScores.get(group)!
      // This shouldn't end up being 0, but handle the edge case and avoid division by 0
      if (scores.length > 0) {
        const avg = scores.reduce((a, b) => a.plus(b), new BigNumber(0)).div(scores.length)
        groupAvgScores.set(group, avg)
      } else {
        groupAvgScores.set(group, new BigNumber(0))
      }
    }

    console.info(groupAvgScores)

    const sortedGroups = [...groupAvgScores.keys()].sort((a, b) => {
      return groupAvgScores.get(b)!.comparedTo(groupAvgScores.get(a)!)
    })
    console.info(sortedGroups)

    // Get keys + accounts for the voting bot accounts (based on mnemonic, envvar count of bot accounts)
    const votingBotKeys: string[] = getPrivateKeysFor(
      AccountType.VOTING_BOT,
      mnemonic,
      numVotingBots
    ).map(ensure0x)

    // For each bot account/key...
    for (const key of votingBotKeys) {
      if (Math.random() < changeVoteProbability) {
        kit.addAccount(key)
        const account = privateKeyToAddress(key)
        console.info(`handling vote for ${account}`)

        // what groups did this account already vote for?
        // const currentVotes = await election.getGroupsVotedForByAccount(account)
      }
      //    select new group, based on weighted probability of the "state of the world"
      //    cast new vote
    }
  } catch (error) {
    console.error(error)
    // log this in a reasonable way
  }
}
