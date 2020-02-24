import { ContractKit } from '@celo/contractkit'
import { readFromSheet, put, putNoDup, normalizeAddress } from './util'

readFromSheet(async function(kit: ContractKit, data: any[]) {
  // associate addresses to competitors
  let competitor: any = {}
  data.forEach((a: any) => {
    a.claims.forEach((c: string) =>
      put(competitor, normalizeAddress(c), normalizeAddress(a.address))
    )
  })
  function getCompetitor(addr: string) {
    if (!competitor[normalizeAddress(addr)]) {
      return 'unknown'
    }
    return competitor[normalizeAddress(addr)][0]
  }
  console.log(competitor)
  // associate competitors if they are members in the same group
  let assoc: any = {}
  function assocAll(lst: string[]) {
    for (let i = 0; i < lst.length; i++) {
      for (let j = 0; j < lst.length; j++) {
        putNoDup(assoc, getCompetitor(lst[i]), getCompetitor(lst[j]))
      }
    }
  }
  let groupMember: any = {}
  const election = await kit._web3Contracts.getElection()
  const validators = await kit._web3Contracts.getValidators()
  let fromBlock = 500000
  let toBlock = 600000
  for (let blockNumber = fromBlock; blockNumber <= toBlock; blockNumber += 720) {
    console.log('block', blockNumber)
    // @ts-ignore
    const lst = await election.methods.getEligibleValidatorGroups().call({}, blockNumber)
    for (const g of lst) {
      // @ts-ignore
      const group = await validators.methods.getValidatorGroup(g).call({}, blockNumber)
      const members = group[0]
      members.forEach((m: string) => putNoDup(groupMember, normalizeAddress(g), getCompetitor(m)))
      members.push(g)
      assocAll(members)
    }
  }
  const entries: Array<[string, string[]]> = Object.entries(assoc)
  for (const [g, info] of entries) {
    console.log(g, 'has associates', info)
  }
  const entries2: Array<[string, string[]]> = Object.entries(groupMember)
  for (const [g, info] of entries2) {
    console.log('Group', g, 'has competitors', info)
  }
})
