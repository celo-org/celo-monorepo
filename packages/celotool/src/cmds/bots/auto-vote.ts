// The purpose of the Voting bot in a testnet is to add incentives for good
// behavior by validators. This introduces some non-validator stakers into the
// network that will judge the validator groups, and vote accordingly.
import { Address, ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import {
  ensureLeading0x,
  eqAddress,
  normalizeAddressWith0x,
  NULL_ADDRESS,
  privateKeyToAddress,
} from '@celo/utils/lib/address'
import { concurrentMap } from '@celo/utils/lib/async'
import BigNumber from 'bignumber.js'
import { groupBy, mapValues } from 'lodash'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import { AccountType, getPrivateKeysFor } from 'src/lib/generate_utils'
import Web3 from 'web3'
import { Argv } from 'yargs'

export const command = 'auto-vote'

export const describe = 'for each of the voting bot accounts, vote for the best groups available'

interface SimulateVotingArgv {
  celoProvider: string
  excludedGroups?: string[]
}

export const builder = (yargs: Argv) => {
  return yargs
    .option('celoProvider', {
      type: 'string',
      description: 'The node to use',
      default: 'http://localhost:8545',
    })
    .option('excludedGroups', {
      type: 'string',
      description: 'A comma separated list of groups to exclude from voting eligibility',
      coerce: (addresses: string) => {
        return addresses
          .split(',')
          .filter((a) => a.length > 0)
          .map(normalizeAddressWith0x)
      },
    })
}

export const handler = async function simulateVoting(argv: SimulateVotingArgv) {
  try {
    const mnemonic = fetchEnv(envVar.MNEMONIC)
    const numBotAccounts = parseInt(fetchEnv(envVar.VOTING_BOTS), 10)

    const excludedGroups: string[] = argv.excludedGroups || []

    const kit = newKitFromWeb3(new Web3(argv.celoProvider))
    const election = await kit.contracts.getElection()

    const wakeProbability = new BigNumber(fetchEnv(envVar.VOTING_BOT_WAKE_PROBABILITY))
    const baseChangeProbability = new BigNumber(fetchEnv(envVar.VOTING_BOT_CHANGE_BASELINE))
    const exploreProbability = new BigNumber(fetchEnv(envVar.VOTING_BOT_EXPLORE_PROBABILITY))
    const scoreSensitivity = new BigNumber(fetchEnv(envVar.VOTING_BOT_SCORE_SENSITIVITY))

    const allBotKeys = getPrivateKeysFor(AccountType.VOTING_BOT, mnemonic, numBotAccounts)
    await activatePendingVotes(kit, allBotKeys)

    const botKeysVotingThisRound = allBotKeys.filter((_) =>
      wakeProbability.isGreaterThan(Math.random())
    )
    console.info(`Participating this time: ${botKeysVotingThisRound.length} of ${numBotAccounts}`)

    // If no bots are participating, return early
    if (botKeysVotingThisRound.length === 0) {
      return
    }

    const groupCapacities = await calculateInitialGroupCapacities(kit)
    const groupScores = await calculateGroupScores(kit)
    const groupWeights = calculateGroupWeights(groupScores, scoreSensitivity)

    const unelectedGroups = Object.keys(groupCapacities).filter((k) => !groupScores.has(k))

    for (const key of botKeysVotingThisRound) {
      const botAccount = ensureLeading0x(privateKeyToAddress(key))

      kit.connection.addAccount(key)
      kit.connection.defaultAccount = botAccount

      console.info(`Voting as: ${botAccount}.`)
      try {
        // Get current vote for this bot.
        // Note: though this returns an array, the bot process only ever chooses one group,
        // so this takes a shortcut and only looks at the first in the response
        const currentVote = (await election.getVoter(botAccount)).votes[0]
        const currentGroup = currentVote ? normalizeAddressWith0x(currentVote.group) : undefined

        // Handle the case where the group the bot is currently voting for does not have a score
        if (
          !currentGroup ||
          shouldChangeVote(
            groupScores.get(currentGroup) || new BigNumber(0),
            scoreSensitivity,
            baseChangeProbability
          )
        ) {
          // Decide which method of picking a new group, and pick one if there are unelected
          // groups with capacity
          let randomlySelectedGroup: string = NULL_ADDRESS
          if (exploreProbability.isGreaterThan(Math.random())) {
            console.info('Vote Method: unweighted random choice of unelected')
            randomlySelectedGroup = getUnweightedRandomChoice(
              unelectedGroups.filter((k) =>
                shouldBeConsidered(k, currentGroup, excludedGroups, groupCapacities)
              )
            )
            if (randomlySelectedGroup === NULL_ADDRESS) {
              console.info('No unelected groups available, falling back to weighted-by-score')
            }
          }

          // This catches 2 cases in which randomlySelectedGroup is undefined:
          // 1. it tried to pick an unelected group, but none were available
          // 2. it is not using the "explore" strategy
          if (randomlySelectedGroup === NULL_ADDRESS) {
            console.info('Vote Method: weighted random choice among those with scores')
            randomlySelectedGroup = getWeightedRandomChoice(
              groupWeights,
              [...groupCapacities.keys()].filter((k) =>
                shouldBeConsidered(k, currentGroup, excludedGroups, groupCapacities)
              )
            )
          }

          if (randomlySelectedGroup === NULL_ADDRESS) {
            console.info('Was unable to find an available group to vote for. Skipping this time.')
          } else {
            await castVote(kit, botAccount, randomlySelectedGroup, groupCapacities)
          }
        } else {
          console.info(`${botAccount} has decided to keep their existing vote`)
        }
      } catch (error) {
        console.error(`Failed to vote as ${botAccount}`)
        console.info(error)
      }
    }
  } catch (error) {
    console.error(error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

async function castVote(
  kit: ContractKit,
  botAccount: string,
  voteForGroup: Address,
  groupCapacities: Map<string, BigNumber>
) {
  const lockedGold = await kit.contracts.getLockedGold()
  const election = await kit.contracts.getElection()

  const lockedGoldAmount = await lockedGold.getAccountTotalLockedGold(botAccount)
  if (lockedGoldAmount.isZero()) {
    console.info(`No locked gold exists for ${botAccount}, skipping...`)
    return
  }

  const currentVotes = (await election.getVoter(botAccount)).votes

  // Revoke existing vote(s) if any and update capacity of the group
  for (const vote of currentVotes) {
    const revokeTxs = await election.revoke(botAccount, vote.group, vote.pending.plus(vote.active))
    await concurrentMap(10, revokeTxs, (tx) => {
      return tx.sendAndWaitForReceipt({ from: botAccount })
    })
    const group = normalizeAddressWith0x(vote.group)
    const oldCapacity = groupCapacities.get(group)
    groupCapacities.set(group, oldCapacity.plus(vote.pending.plus(vote.active)))
  }

  const groupCapacity = groupCapacities.get(voteForGroup)
  const voteAmount = BigNumber.minimum(lockedGoldAmount, groupCapacity)
  const voteTx = await election.vote(voteForGroup, BigNumber.minimum(voteAmount))
  await voteTx.sendAndWaitForReceipt({ from: botAccount })
  console.info(`Completed voting as ${botAccount}`)

  groupCapacities.set(voteForGroup, groupCapacity.minus(voteAmount))
}

async function calculateInitialGroupCapacities(kit: ContractKit): Promise<Map<string, BigNumber>> {
  console.info('Determining which groups have capacity for more votes')

  const validators = await kit.contracts.getValidators()
  const election = await kit.contracts.getElection()

  const groupCapacities = new Map<string, BigNumber>()
  for (const groupAddress of await validators.getRegisteredValidatorGroupsAddresses()) {
    const vgv = await election.getValidatorGroupVotes(groupAddress)
    if (vgv.eligible) {
      groupCapacities.set(normalizeAddressWith0x(groupAddress), vgv.capacity)
    }
  }

  return groupCapacities
}

async function calculateGroupScores(kit: ContractKit): Promise<Map<string, BigNumber>> {
  console.info('Calculating weights of groups based on the scores of elected validators')
  const election = await kit.contracts.getElection()
  const validators = await kit.contracts.getValidators()

  const validatorSigners = await election.getCurrentValidatorSigners()
  const validatorAccounts = (
    await concurrentMap(10, validatorSigners, (acc) => {
      return validators.getValidatorFromSigner(acc)
    })
  ).filter((v) => !!v.affiliation) // Skip unaffiliated

  const validatorsByGroup = groupBy(validatorAccounts, (validator) =>
    normalizeAddressWith0x(validator.affiliation)
  )

  const validatorGroupScores = mapValues(validatorsByGroup, (vals) => {
    const scoreSum = vals.reduce((a, b) => a.plus(b.score), new BigNumber(0))
    return scoreSum.dividedBy(vals.length)
  })

  return new Map(Object.entries(validatorGroupScores))
}

function calculateGroupWeights(
  groupScores: Map<string, BigNumber>,
  scoreSensitivity: BigNumber
): Map<string, BigNumber> {
  const groupWeights = new Map<string, BigNumber>()
  for (const group of groupScores.keys()) {
    const score = groupScores.get(group)
    if (score && score.isGreaterThan(0)) {
      groupWeights.set(group, score.pow(scoreSensitivity))
    } else {
      groupWeights.set(group, new BigNumber(0))
    }
  }
  return groupWeights
}

function getUnweightedRandomChoice(groupsToConsider: string[]): string {
  const randomIndex = Math.floor(groupsToConsider.length * Math.random())
  return groupsToConsider[randomIndex] || NULL_ADDRESS
}

function getWeightedRandomChoice(
  groupWeights: Map<string, BigNumber>,
  groupsToConsider: string[]
): string {
  // Filter to groups open to consideration, and sort from highest probability to lowest
  const sortedGroupKeys = [...groupWeights.keys()]
    .filter((k) => groupsToConsider.includes(k))
    .sort((a, b) => {
      return groupWeights.get(b).comparedTo(groupWeights.get(a))
    })

  let weightTotal = new BigNumber(0)
  for (const key of sortedGroupKeys) {
    weightTotal = weightTotal.plus(groupWeights.get(key) || 0)
  }

  const choice = weightTotal.multipliedBy(Math.random())
  let totalSoFar = new BigNumber(0)

  for (const key of sortedGroupKeys) {
    totalSoFar = totalSoFar.plus(groupWeights.get(key))
    if (totalSoFar.isGreaterThanOrEqualTo(choice)) {
      return key
    }
  }

  // If this happens, it means no groups were available
  return NULL_ADDRESS
}

async function activatePendingVotes(kit: ContractKit, botKeys: string[]): Promise<void> {
  const election = await kit.contracts.getElection()

  await concurrentMap(10, botKeys, async (key) => {
    kit.connection.addAccount(key)
    const account = ensureLeading0x(privateKeyToAddress(key))
    if (!(await election.hasActivatablePendingVotes(account))) {
      try {
        const activateTxs = await election.activate(account)
        await concurrentMap(10, activateTxs, (tx) => tx.sendAndWaitForReceipt({ from: account }))
      } catch (error) {
        console.error(`Failed to activate pending votes for ${account}`)
      }
    }
  })
}

function shouldChangeVote(
  score: BigNumber,
  scoreSensitivity: BigNumber,
  baseChangeProbability: BigNumber
): boolean {
  const scoreBasedProbability = score.pow(scoreSensitivity).negated().plus(1)
  const scaledProbability = scoreBasedProbability.times(baseChangeProbability.negated().plus(1))
  const totalProbability = scaledProbability.plus(baseChangeProbability)

  return totalProbability.isGreaterThan(Math.random())
}

function shouldBeConsidered(
  groupAddress: string,
  currentGroup: string | undefined,
  excludedGroups: string[],
  groupCapacities: Map<string, BigNumber>
): boolean {
  const normalizedGroupAddress = normalizeAddressWith0x(groupAddress)
  const capacity = groupCapacities.get(normalizedGroupAddress)
  return !!(
    !excludedGroups.includes(normalizedGroupAddress) &&
    capacity &&
    capacity.isGreaterThan(0) &&
    (!currentGroup || !eqAddress(currentGroup, normalizedGroupAddress))
  )
}
