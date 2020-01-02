// The purpose of the Voting bot in a testnet is to add incentives for good
// behavior by validators. This introduces some non-validator stakers into the
// network that will judge the validator groups, and vote accordingly.
import { ContractKit, newKit } from '@celo/contractkit'
import { getAccountAddressFromPrivateKey } from '@celo/walletkit'
import BigNumber from 'bignumber.js'
import { BotsArgv } from 'src/cmds/bots'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import { AccountType, getPrivateKeysFor } from 'src/lib/generate_utils'
import { ensure0x } from 'src/lib/utils'
import { Argv } from 'yargs'

export const command = 'auto-vote'

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
  try {
    const mnemonic = fetchEnv(envVar.MNEMONIC)
    const numBotAccounts = parseInt(fetchEnv(envVar.VOTING_BOTS), 10)

    const kit: ContractKit = newKit(argv.celoProvider)
    const election = await kit.contracts.getElection()
    const validators = await kit.contracts.getValidators()

    const changeVoteProbability = new BigNumber(fetchEnv(envVar.VOTING_BOT_CHANGE_PROBABILITY))

    const allBotKeys = getPrivateKeysFor(AccountType.VOTING_BOT, mnemonic, numBotAccounts)
    for (const key of allBotKeys) {
      kit.addAccount(key)
      const account = ensure0x(getAccountAddressFromPrivateKey(key))
      try {
        console.info(`activating votes for ${account}`)
        const activateTxs = await election.activate(account)
        for (const tx of activateTxs) {
          await tx.sendAndWaitForReceipt()
        }
      } catch (error) {
        console.error(`Failed to activate pending votes for ${account}`)
      }
    }

    const botKeysVotingThisRound = allBotKeys.filter((_) =>
      changeVoteProbability.isGreaterThan(Math.random())
    )
    console.info(`Voting this time: ${botKeysVotingThisRound.length} of ${numBotAccounts}`)

    if (botKeysVotingThisRound.length > 0) {
      const lockedGold = await kit.contracts.getLockedGold()

      console.info('Determining which groups have capacity for more votes')
      const groupCapacities = new Map<string, BigNumber>()
      for (const groupAddress of await validators.getRegisteredValidatorGroupsAddresses()) {
        const vgv = await election.getValidatorGroupVotes(groupAddress)
        if (vgv.eligible) {
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
          console.info(`could not get info for ${valSigner}, skipping...`)
        }
      }

      const groupWeights = calculateGroupWeightsFromScores(groupScores)

      for (const key of botKeysVotingThisRound) {
        const botAccount = ensure0x(getAccountAddressFromPrivateKey(key))
        console.info(`Voting as: ${botAccount}.`)

        kit.defaultAccount = botAccount

        try {
          // Get this account's amount of locked gold
          const lockedGoldAmount = await lockedGold.getAccountTotalLockedGold(botAccount)
          console.info(`locked gold for ${botAccount}: ${lockedGoldAmount.toString()}`)

          if (lockedGoldAmount.isGreaterThan(0)) {
            // Get group(s) currently voted for
            const currentVotes = (await election.getVoter(botAccount)).votes
            const currentGroups = currentVotes.map((v) => v.group)

            const randomlySelectedGroup = getWeightedRandomChoice(
              groupWeights,
              [...groupCapacities.keys()].filter((k) => {
                const capacity = groupCapacities.get(k)
                return capacity && capacity.isGreaterThan(0) && !currentGroups.includes(k)
              })
            )
            console.info(`Selected this group: ${randomlySelectedGroup}`)

            // Revoke existing vote(s) if necessary
            for (const vote of currentVotes) {
              const revokeTxs = await election.revoke(
                botAccount,
                vote.group,
                vote.pending.plus(vote.active)
              )
              for (const tx of revokeTxs) {
                await tx.sendAndWaitForReceipt()
              }
            }

            const groupCapacity = groupCapacities.get(randomlySelectedGroup)!
            const voteAmount = BigNumber.minimum(lockedGoldAmount, groupCapacity)
            const voteTx = await election.vote(randomlySelectedGroup, BigNumber.minimum(voteAmount))
            await voteTx.sendAndWaitForReceipt()
            console.info(`Completed vote as ${botAccount}`)

            groupCapacities.set(randomlySelectedGroup, groupCapacity.minus(voteAmount))
          } else {
            console.info(`No locked gold exists for ${botAccount}`)
          }
        } catch (error) {
          console.error(`Failed to vote as ${botAccount}`)
          console.info(error)
        }
      }
    }
  } catch (error) {
    console.error(error)
  } finally {
    process.exit(0)
  }
}

function calculateGroupWeightsFromScores(
  groupScores: Map<string, BigNumber[]>
): Map<string, BigNumber> {
  const groupWeights = new Map<string, BigNumber>()

  // Add up the scores for each group's validators and calculate weights
  for (const group of groupScores.keys()) {
    const scores = groupScores.get(group)!
    // This shouldn't end up being 0, but handle the edge case and avoid division by 0
    if (scores.length > 0) {
      const avg = scores.reduce((a, b) => a.plus(b), new BigNumber(0)).div(scores.length)
      groupWeights.set(group, avg.pow(20))
    } else {
      groupWeights.set(group, new BigNumber(0))
    }
  }

  return groupWeights
}

function getWeightedRandomChoice(
  groupWeights: Map<string, BigNumber>,
  groupsToConsider: string[]
): string {
  // Filter to groups open to consideration, and sort from highest probability to lowest
  const sortedGroupKeys = [...groupWeights.keys()]
    .filter((k) => groupsToConsider.includes(k))
    .sort((a, b) => {
      return groupWeights.get(b)!.comparedTo(groupWeights.get(a)!)
    })

  let weightTotal = new BigNumber(0)
  for (const key of sortedGroupKeys) {
    weightTotal = weightTotal.plus(groupWeights.get(key) || 0)
  }

  const choice = weightTotal.multipliedBy(Math.random())
  let totalSoFar = new BigNumber(0)

  for (const key of sortedGroupKeys) {
    totalSoFar = totalSoFar.plus(groupWeights.get(key)!)
    if (totalSoFar.isGreaterThanOrEqualTo(choice)) {
      return key
    }
  }
  // This shouldn't happen, since the accumulated total at the last key of the
  // sorted groups is always going to be higher than the value for `choice`.
  // This is here to handle unknown edge-cases and to make Typescript happy
  throw Error('An unexpected error occured when choosing a group via weighted random choice')
}
