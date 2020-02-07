import { flags } from '@oclif/command'
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

export default class MembershipHistory extends BaseCommand {
  static description = 'Returns information about historical members of groups.'

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
    const res = this.parse(MembershipHistory)
    const kit = this.kit
    const election = await kit._web3Contracts.getElection()
    const accounts = await kit._web3Contracts.getAccounts()
    const validators = await kit._web3Contracts.getValidators()
    const filter = normalizeAddress(res.flags.group || '')
    let fromBlock = res.flags['from-block'] ?? (await this.web3.eth.getBlock('latest')).number
    let toBlock = res.flags['to-block'] ?? (await this.web3.eth.getBlock('latest')).number
    if (res.flags['at-block']) {
      fromBlock = res.flags['at-block']
      toBlock = res.flags['at-block']
    }
    const groups: any = {}
    for (let blockNumber = fromBlock; blockNumber <= toBlock; blockNumber += 720) {
      // @ts-ignore
      const lst = await election.methods.getEligibleValidatorGroups().call({}, blockNumber)
      for (const g of lst) {
        if (filter && normalizeAddress(g) !== filter) {
          continue
        }
        // @ts-ignore
        const group = await validators.methods.getValidatorGroup(g).call({}, blockNumber)
        group.members = group[0]
        if (!groups[normalizeAddress(g)]) {
          groups[normalizeAddress(g)] = { epochs: 0, members: {} }
        }
        const gInfo = groups[normalizeAddress(g)]
        gInfo.epochs++

        for (const member of group.members) {
          gInfo.members[normalizeAddress(member)] =
            (gInfo.members[normalizeAddress(member)] || 0) + 1
        }
      }
    }
    const entries: Array<[string, any]> = Object.entries(groups)
    for (const [g, info] of entries) {
      console.log(
        `Group ${await accounts.methods.getName(g).call()}@${g} eligible for ${info.epochs} epochs`
      )
      const entries2: Array<[string, number]> = Object.entries(info.members)
      for (const [v, epochs] of entries2) {
        console.log(
          `   ${await accounts.methods
            .getName(v)
            .call()}@${v} was member for ${epochs} epochs (${Math.round(
            (100 * epochs) / info.epochs
          )}%)`
        )
      }
    }
  }
}
