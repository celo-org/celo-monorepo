import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { BaseCommand } from '../../base'
import { Flags } from '../../utils/command'

function normalizeAddress(a: string) {
  try {
    a = a.toLowerCase()
    if (a.substr(0, 2) === '0x') return a.substr(2)
    else return a
  } catch (_err) {
    return a
  }
}

function num(str: string) {
  return new BigNumber(str).shiftedBy(-18).toString(10)
}

function dedup(lst: string[]): string[] {
  return [...new Set(lst)]
}

function put(obj: any, key: string, elem: string) {
  const lst = obj[key] || []
  lst.push(elem)
  obj[key] = lst
}

async function elections(kit: ContractKit, blockNumber: number) {
  const election = await kit._web3Contracts.getElection()
  const validators = await kit._web3Contracts.getValidators()

  const groups: string[] = await election.methods
    .getEligibleValidatorGroups()
    // @ts-ignore
    .call({}, blockNumber)

  const elected = []

  for (const el of groups) {
    // @ts-ignore
    const group = await validators.methods.getValidatorGroup(el).call({}, blockNumber)
    group.members = group[0]
    // @ts-ignore
    const rawVotes = await election.methods.getTotalVotesForGroup(el).call({}, blockNumber)
    const votes = new BigNumber(rawVotes).shiftedBy(-18).toNumber()
    for (let i = 0; i < group.members.length; i++) {
      const member = group.members[i]
      elected.push({
        address: normalizeAddress(member),
        votes: Math.round(votes / (i + 1)),
        affiliation: el,
      })
    }
  }

  return elected.sort((a, b) => b.votes - a.votes)
}

export default class Voters extends BaseCommand {
  static description = 'Returns information about who has voted for groups.'

  static flags = {
    ...BaseCommand.flags,
    'from-block': flags.integer({
      description: 'first block for which to get info',
    }),
    'to-block': flags.integer({
      description: 'last block for which to get info',
    }),
    'at-block': flags.integer({
      description: 'block for which to get info',
    }),
    group: Flags.address({ description: 'Group to inspect' }),
    debug: flags.boolean({ description: 'Toggle verbose output' }),
  }

  async run() {
    const res = this.parse(Voters)
    const kit = this.kit
    const election = await kit._web3Contracts.getElection()
    const accounts = await kit._web3Contracts.getAccounts()
    const validators = await kit._web3Contracts.getValidators()
    const evs = await election.getPastEvents('ValidatorGroupVoteCast', { fromBlock: 0 })
    const voters = dedup(evs.map((a: any) => a.returnValues.account)).map(normalizeAddress)
    const filter = normalizeAddress(res.flags.group || '')
    if (res.flags.debug) {
      console.log('Events', evs.length)
      evs.forEach((a: any) => {
        const b = a.returnValues
        console.log('At', a.blockNumber, 'account', b.account, 'group', b.group, b.value)
      })
      console.log('Voters', voters.length)
    }
    let fromBlock = res.flags['from-block'] ?? (await this.web3.eth.getBlock('latest')).number
    let toBlock = res.flags['to-block'] ?? (await this.web3.eth.getBlock('latest')).number
    if (res.flags['at-block']) {
      fromBlock = res.flags['at-block']
      toBlock = res.flags['at-block']
    }
    for (let blockNumber = fromBlock; blockNumber <= toBlock; blockNumber += 720) {
      // @ts-ignore
      const lst = await election.methods.getEligibleValidatorGroups().call({}, blockNumber)
      console.log('At block', blockNumber, 'groups', lst.length)
      const groupVoters: any = {}
      for (const voter of voters) {
        const groups =
          // @ts-ignore
          (await election.methods.getGroupsVotedForByAccount(voter).call({}, blockNumber)).map(
            normalizeAddress
          )
        groups.forEach((g: string) => put(groupVoters, g, voter))
      }
      const entries: Array<[string, string[]]> = Object.entries(groupVoters)
      const eResults = await elections(this.kit, blockNumber)
      const nth = async (idx: number) => {
        if (idx >= eResults.length) return
        const member = eResults[idx].address
        const vName = await accounts.methods.getName(member).call()
        return `${idx}. Votes ${eResults[idx].votes} ${vName}@${member}`
      }
      for (const [g, gVoters] of entries) {
        if (filter && normalizeAddress(g) !== filter) {
          continue
        }
        // @ts-ignore
        const group = await validators.methods.getValidatorGroup(g).call({}, blockNumber)
        group.members = group[0]
        const gName = await accounts.methods.getName(g).call()
        console.log('Group', g, gName, 'at block', blockNumber, 'Voters:')
        for (const voter of gVoters) {
          const vName = await accounts.methods.getName(voter).call()
          const votes = await election.methods
            .getTotalVotesForGroupByAccount(g, voter)
            // @ts-ignore
            .call({}, blockNumber)
          console.log(`    ${num(votes)} from ${vName}@${voter}`)
        }
        console.log('Group', g, gName, 'at block', blockNumber, 'Members:')
        for (const member of group.members) {
          const idx = eResults.findIndex((a) => normalizeAddress(member) === a.address)
          const vName = await accounts.methods.getName(member).call()
          console.log(`   ${idx}. Votes ${eResults[idx].votes} ${vName}@${member}`)
        }
      }
      console.log(await nth(100))
      console.log(await nth(101))
    }
  }
}
