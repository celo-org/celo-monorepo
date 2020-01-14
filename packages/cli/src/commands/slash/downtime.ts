import { ContractKit } from '@celo/contractkit/lib'
import { linkedListChangesRel, zip } from '@celo/utils/lib/collections'
import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { Args, Flags } from '../../utils/command'

async function getGroups(kit: ContractKit) {
  const election = await kit._web3Contracts.getElection()
  const { groups, values } = await election.methods.getTotalVotesForEligibleValidatorGroups().call()
  return zip(
    (address, value) => {
      return { address, value: new BigNumber(value) }
    },
    groups,
    values
  )
}

// Returns how much voting gold will be decremented from the groups voted by an account
async function slashingOfGroups(kit: ContractKit, account: string, penalty: BigNumber) {
  const election = await kit._web3Contracts.getElection()
  const lockedGold = await kit._web3Contracts.getLockedGold()
  // first check how much voting gold has to be slashed
  const nonVoting = new BigNumber(
    await lockedGold.methods.getAccountNonvotingLockedGold(account).call()
  )
  if (penalty.isLessThan(nonVoting)) {
    return []
  }
  let difference = penalty.minus(nonVoting)
  // find voted groups
  const groups = await election.methods.getGroupsVotedForByAccount(account).call()
  const res = []
  //
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i]
    console.log('checking group', group)
    const totalVotes = new BigNumber(await election.methods.getTotalVotesForGroup(group).call())
    const votes = new BigNumber(
      await election.methods.getTotalVotesForGroupByAccount(group, account).call()
    )
    const slashedVotes = votes.lt(difference) ? votes : difference
    console.log('group votes', totalVotes)
    console.log('group votes by account', votes)
    console.log('group votes to slash', slashedVotes)
    res.push({ address: group, value: slashedVotes, index: i })
    difference = difference.minus(slashedVotes)
    if (difference.eq(new BigNumber(0))) {
      break
    }
  }
  return res
}

async function findLessersAndGreaters(kit: ContractKit, account: string, penalty: BigNumber) {
  const validators = await kit._web3Contracts.getValidators()

  const groups = await getGroups(kit)
  // console.log('original state --------------------')
  // printList(groups)
  const group = (await validators.methods.getValidator(account).call()).affiliation
  const changed = await slashingOfGroups(kit, account, penalty)
  const changedGroup = await slashingOfGroups(kit, group, penalty)
  const afterValidator = linkedListChangesRel(groups, changed)
  // console.log('after slashing validator -------------')
  // printList(afterValidator.list)
  const afterGroup = linkedListChangesRel(afterValidator.list, changedGroup)
  // console.log('after slashing group --------------------')
  // printList(afterGroup.list)
  return {
    afterValidator,
    afterGroup,
    indicesValidator: changed.map((a) => a.index),
    indicesGroup: changedGroup.map((a) => a.index),
  }
}

async function findIndex(kit: ContractKit, address: string, block: number) {
  const election = await kit._web3Contracts.getElection()
  const accounts = await kit._web3Contracts.getAccounts()

  // @ts-ignore
  const signers = await election.methods.getCurrentValidatorSigners().call({}, block)

  let acc = 0
  for (const it of signers) {
    const addr = await accounts.methods.signerToAccount(it).call()
    // console.log(it, '->', addr)
    if (addr === address) return acc
    acc++
  }

  return -1
}

function printList(lst: any[]) {
  lst.forEach((element) => {
    console.log(element.address, ':', element.value.toString(10))
  })
}

export default class Downtime extends BaseCommand {
  static description = 'Slash for downtime'

  static flags = {
    ...BaseCommand.flags,
    block: flags.integer({ ...Flags.block, required: true }),
  }

  static args = [Args.address('address')]

  static examples = ['downtime 0x5409ed021d9299bf6814279a6a1411a7e866a631 12300']

  async run() {
    const res = this.parse(Downtime)
    const kit = this.kit

    const block = res.flags.block

    const slasher = await kit._web3Contracts.getDowntimeSlasher()
    // const election = await kit._web3Contracts.getElection()

    const period = parseInt(await slasher.methods.slashableDowntime().call(), 10)

    const endBlock = block + period

    console.log('Slashable downtime', period)

    const startEpoch = await slasher.methods.getEpochNumberOfBlock(block).call()
    const endEpoch = await slasher.methods.getEpochNumberOfBlock(endBlock).call()

    console.log(
      `starting at block ${block} (epoch ${startEpoch}), ending at ${endBlock} (epoch ${endEpoch})`
    )

    const address = res.args.address

    const startIndex = await findIndex(kit, address, block)
    const endIndex = await findIndex(kit, address, endBlock)

    console.log('start index', startIndex, 'end index', endIndex)

    const validators = await kit._web3Contracts.getValidators()

    const history = await validators.methods.getMembershipHistory(address).call()
    const historyIndex = history[0].length - 1

    console.log('history', history, 'guessing history index', historyIndex)

    const incentives = await slasher.methods.slashingIncentives().call()

    console.log('incentives', incentives)

    const penalty = new BigNumber(incentives.penalty)
    const data = await findLessersAndGreaters(kit, address, penalty)

    console.log(data.afterValidator.lessers, data.afterValidator.greaters, data.indicesValidator)
    console.log(data.afterGroup.lessers, data.afterGroup.greaters, data.indicesGroup)

    const test = await slasher.methods
      .isDown(block, startIndex, endIndex)
      // @ts-ignore
      .call({ gas: 10000000 }, endBlock + 100)
    console.log('is down: ', test)

    console.log('dry run of slashing')
    const dry = await slasher.methods
      .slash(
        block,
        startIndex,
        endIndex,
        historyIndex,
        data.afterValidator.lessers,
        data.afterValidator.greaters,
        data.indicesValidator,
        data.afterGroup.lessers,
        data.afterGroup.greaters,
        data.indicesGroup
      )
      // @ts-ignore
      .call({ gas: 10000000 })
    console.log('got', dry)
  }
}
