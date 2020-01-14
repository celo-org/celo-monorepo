// The purpose of the Voting bot in a testnet is to add incentives for good
// behavior by validators. This introduces some non-validator stakers into the
// network that will judge the validator groups, and vote accordingly.
import { ContractKit, newKit } from '@celo/contractkit'
import { Address, NULL_ADDRESS } from '@celo/contractkit/lib/base'
import { Validator } from '@celo/contractkit/lib/wrappers/Validators'
import { concurrentMap } from '@celo/utils/lib/async'
import { getAccountAddressFromPrivateKey } from '@celo/walletkit'
import BigNumber from 'bignumber.js'
import { groupBy, mapValues } from 'lodash'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import { AccountType, getPrivateKeysFor } from 'src/lib/generate_utils'
import { ensure0x } from 'src/lib/utils'
import { Argv } from 'yargs'

export const command = 'auto-vote'

export const describe = 'for each of the voting bot accounts, vote for the best groups available'

interface SimulateVotingArgv {
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

    const kit = newKit(argv.celoProvider)
    const election = await kit.contracts.getElection()
    const validators = await kit.contracts.getValidators()

    const changeVoteProbability = new BigNumber(fetchEnv(envVar.VOTING_BOT_CHANGE_PROBABILITY))

    const allBotKeys = getPrivateKeysFor(AccountType.VOTING_BOT, mnemonic, numBotAccounts)
    await activatePendingVotes(kit, allBotKeys)

    const botKeysVotingThisRound = allBotKeys.filter((_) =>
      changeVoteProbability.isGreaterThan(Math.random())
    )
    console.info(`Voting this time: ${botKeysVotingThisRound.length} of ${numBotAccounts}`)

    if (botKeysVotingThisRound.length > 0) {
      console.info('Determining which groups have capacity for more votes')
      const groupCapacities = new Map<string, BigNumber>()
      for (const groupAddress of await validators.getRegisteredValidatorGroupsAddresses()) {
        const vgv = await election.getValidatorGroupVotes(groupAddress)
        if (vgv.eligible) {
          groupCapacities.set(groupAddress, vgv.capacity)
        }
      }

      console.info('Calculating weights of groups based on the scores of elected validators')
      const groupWeights = await calculateGroupWeights(kit)

      for (const key of botKeysVotingThisRound) {
        const botAccount = ensure0x(getAccountAddressFromPrivateKey(key))

        kit.addAccount(key)
        kit.defaultAccount = botAccount

        console.info(`Voting as: ${botAccount}.`)
        try {
          const currentVotes = (await election.getVoter(botAccount)).votes
          const currentGroups = currentVotes.map((v) => v.group)
          const randomlySelectedGroup = getWeightedRandomChoice(
            groupWeights,
            [...groupCapacities.keys()].filter((k) => {
              const capacity = groupCapacities.get(k)
              return capacity && capacity.isGreaterThan(0) && !currentGroups.includes(k)
            })
          )
          await castVote(kit, botAccount, randomlySelectedGroup, groupCapacities)
        } catch (error) {
          console.error(`Failed to vote as ${botAccount}`)
          console.info(error)
        }
      }
    }
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
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
    const oldCapacity = groupCapacities.get(vote.group)!
    groupCapacities.set(vote.group, oldCapacity.plus(vote.pending.plus(vote.active)))
  }

  const groupCapacity = groupCapacities.get(voteForGroup)!
  const voteAmount = BigNumber.minimum(lockedGoldAmount, groupCapacity)
  const voteTx = await election.vote(voteForGroup, BigNumber.minimum(voteAmount))
  await voteTx.sendAndWaitForReceipt({ from: botAccount })
  console.info(`Completed voting as ${botAccount}`)

  groupCapacities.set(voteForGroup, groupCapacity.minus(voteAmount))
}

// After saturation, explore never-elected-Validator-Groups in FIFO order.
// @ts-ignore: declared but its value is never read.
async function getNextNeverElectedValidatorGroup(kit: ContractKit): Promise<Address> {
  const validators = await kit.contracts.getValidators()
  const groups = await validators.getRegisteredValidatorGroups()
  // Sort Validator Groups by max(ValidatorGroup.sizeHistory), e.g. last Validator.member update timestamp.
  groups.sort((a, b) => a.membersUpdated - b.membersUpdated)
  for (const group of groups) {
    const groupValidators: Validator[] = await concurrentMap(10, group.members, (member) =>
      validators.getValidator(member)
    )
    // If no member validator has a score then this group hasn't been elected since group.membersUpdated
    if (0 === groupValidators.reduce((a, b) => a.plus(b.score), new BigNumber(0)).toNumber()) {
      return group.address
    }
  }
  return NULL_ADDRESS
}

async function calculateGroupWeights(kit: ContractKit): Promise<Map<string, BigNumber>> {
  const election = await kit.contracts.getElection()
  const validators = await kit.contracts.getValidators()

  const validatorSigners = await election.getCurrentValidatorSigners()
  const validatorAccounts = await concurrentMap(10, validatorSigners, (acc) => {
    return validators.getValidatorFromSigner(acc)
  })

  const validatorsByGroup = groupBy(validatorAccounts, (validator) => validator.affiliation!)
  const validatorGroupWeights = mapValues(validatorsByGroup, (vals) => {
    const scoreSum = vals.reduce((a, b) => a.plus(b.score), new BigNumber(0))
    const avg = scoreSum.dividedBy(vals.length)
    return avg.pow(20)
  })

  return new Map(Object.entries(validatorGroupWeights))
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

async function activatePendingVotes(kit: ContractKit, botKeys: string[]): Promise<void> {
  const election = await kit.contracts.getElection()

  await concurrentMap(10, botKeys, async (key) => {
    kit.addAccount(key)
    const account = ensure0x(getAccountAddressFromPrivateKey(key))
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
