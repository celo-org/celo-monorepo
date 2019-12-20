// The purpose of the Voting bot in a testnet is to add incentives for good
// behavior by validators. This introduces some non-validator stakers into the
// network that will judge the validator groups, and vote accordingly.
import { ContractKit, newKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { BotsArgv } from 'src/cmds/bots'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import { AccountType, generatePrivateKey, privateKeyToAddress } from 'src/lib/generate_utils'
import { ensure0x } from 'src/lib/utils'
import { Argv } from 'yargs'

export const command = 'voting'

export const describe = 'for each of the voting bot accounts, vote for the best groups available'

interface SimulateVotingArgv extends BotsArgv {
  celoProvider: string
  index: number
}

export const builder = (yargs: Argv) => {
  return yargs
    .option('celoProvider', {
      type: 'string',
      description: 'The node to use',
      default: 'http://localhost:8545',
    })
    .option('index', {
      type: 'number',
      description: 'The index of the voting bot account to use',
      default: 0,
    })
}

export const handler = async function simulateVoting(argv: SimulateVotingArgv) {
  console.info('starting voting command')
  try {
    // Set up contract kit instance and instances of all the contracts we'll need
    // to interact with
    const mnemonic = fetchEnv(envVar.MNEMONIC)
    const botKey = ensure0x(generatePrivateKey(mnemonic, AccountType.VOTING_BOT, argv.index))
    const botAccount = privateKeyToAddress(botKey)
    console.info(botKey)
    console.info(botAccount)

    // TODO: this should not be 1. Pick a real value, maybe have it be an envvar
    const changeVoteProbability = 1

    console.info(`Deciding whether ${botAccount} will change their vote...`)
    if (Math.random() < changeVoteProbability) {
      console.info(`Yes, ${botAccount} will vote.`)

      const kit: ContractKit = newKit(argv.celoProvider)
      kit.addAccount(botKey)
      kit.defaultAccount = botAccount
      const election = await kit.contracts.getElection()
      const validators = await kit.contracts.getValidators()

      console.info('Determining which groups have capacity for more votes')
      const groupCapacities = new Map<string, BigNumber>()
      for (const groupAddress of await validators.getRegisteredValidatorGroupsAddresses()) {
        const vgv = await election.getValidatorGroupVotes(groupAddress)
        if (vgv.eligible && vgv.capacity.isGreaterThan(0)) {
          groupCapacities.set(groupAddress, vgv.capacity)
        }
      }

      console.info('Collecting the scores of elected validators to determine group scores')
      const groupScores = new Map<string, BigNumber[]>()
      for (const valSigner of await election.getCurrentValidatorSigners()) {
        try {
          const val = await validators.getValidatorFromSigner(valSigner)
          const groupAddress = val.affiliation!
          if (groupScores.has(groupAddress)) {
            groupScores.get(groupAddress)!.push(val.score)
          } else {
            groupScores.set(groupAddress, [val.score])
          }
        } catch (error) {
          console.info(`failed on this: validators.getValidatorFromSigner(${valSigner})`)
        }
      }

      const randomlySelectedGroup = getWeightedRandomChoice(groupScores)
      console.info(`Selected this group: ${randomlySelectedGroup}`)

      const voteTx = await election.vote(
        randomlySelectedGroup,
        BigNumber.minimum(
          new BigNumber(75000000000000000000),
          groupCapacities.get(randomlySelectedGroup)!
        )
      )

      await voteTx.sendAndWaitForReceipt()
      console.info(`voted!`)
    } else {
      console.info(`${botAccount} will skip voting this time.`)
    }
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

function getWeightedRandomChoice(groupScores: Map<string, BigNumber[]>): string {
  const groupWeights = new Map<string, BigNumber>()
  let sumOfWeights = new BigNumber(0)

  // Add up the scores for each group's validators and calculate weights
  for (const group of groupScores.keys()) {
    const scores = groupScores.get(group)!
    // This shouldn't end up being 0, but handle the edge case and avoid division by 0
    if (scores.length > 0) {
      const avg = scores.reduce((a, b) => a.plus(b), new BigNumber(0)).div(scores.length)
      const prob = avg.pow(20)
      sumOfWeights = sumOfWeights.plus(prob)
      groupWeights.set(group, avg.pow(20))
    } else {
      groupWeights.set(group, new BigNumber(0))
    }
  }

  // Sort from highest probability to lowest
  const sortedGroupKeys = [...groupWeights.keys()].sort((a, b) => {
    return groupWeights.get(b)!.comparedTo(groupWeights.get(a)!)
  })

  const choice = sumOfWeights.times(Math.random())
  let totalSoFar = new BigNumber(0)

  for (const key of sortedGroupKeys) {
    totalSoFar = totalSoFar.plus(groupWeights.get(key)!)
    if (choice.isLessThan(totalSoFar)) {
      return key
    }
  }
  // This shouldn't happen, since the accumulated total at the last key of the
  // sorted groups is always going to be higher than the value for `choice`.
  // This is here to handle unknown edge-cases and to make Typescript happy
  throw Error('An unexpected error occured when choosing a group via weighted random choice')
}
