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
      for (const [g, gVoters] of entries) {
        if (filter && normalizeAddress(g) !== filter) {
          continue
        }
        const gName = await accounts.methods.getName(g).call()
        console.log('Group', g, gName, 'at block', blockNumber)
        for (const voter of gVoters) {
          const vName = await accounts.methods.getName(voter).call()
          const votes = await election.methods
            .getTotalVotesForGroupByAccount(g, voter)
            // @ts-ignore
            .call({}, blockNumber)
          console.log(`   ${num(votes)} from `, voter, vName)
        }
      }
    }
  }
}
