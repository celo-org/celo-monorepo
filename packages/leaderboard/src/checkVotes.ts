import { ContractKit } from '@celo/contractkit'
import { readFromSheet, dedup, put, normalizeAddress } from './util'

/*
function findCommon(a: string[], b: string[]) {
  return dedup(a.filter((el) => b.includes(el)).concat(b.filter((el) => a.includes(el))))
}
*/

readFromSheet(async function(kit: ContractKit, data: any) {
  console.log('========= CUT HERE')
  // First, get all voters
  // Check that commission is correct
  let orig: any = {}
  let obj: any = {}
  let rev: any = {}
  data.forEach((a: any) => {
    obj[a.address] = a.claims
    a.claims.forEach((c: string) => put(rev, normalizeAddress(c), normalizeAddress(a.address)))
    a.claims.forEach((c: string) => put(orig, normalizeAddress(c), normalizeAddress(a.address)))
  })
  let election = await kit._web3Contracts.getElection()
  let accounts = await kit._web3Contracts.getAccounts()
  let validators = await kit._web3Contracts.getValidators()
  async function fetchName(addr: string) {
    let name = await accounts.methods.getName(addr).call()
    return name + (orig[addr] ? '' : '???') + ' @ ' + addr
  }
  let evs = await election.getPastEvents('ValidatorGroupVoteCast', { fromBlock: 0 })
  console.log('Events', evs.length, evs[0])
  let voters = dedup(evs.map((a: any) => a.returnValues.account)).map(normalizeAddress)
  console.log('Voters', voters.length)
  const lastBlock = await kit.web3.eth.getBlockNumber()
  const epochSize = parseInt(await election.methods.getEpochSize().call())
  let badgroups: any = {}
  let badvoters: any = {}
  for (let a of voters) {
    if (!rev[a]) {
      put(rev, a, a)
      console.log('Unknown account', await fetchName(a))
    }
  }
  for (let i = epochSize; i < lastBlock; i += epochSize) {
    // Get groups
    // @ts-ignore
    let lst = await election.methods.getEligibleValidatorGroups().call({}, i)
    console.log('At block', i, 'groups', lst.length)
    let groupVoters: any = {}
    for (let voter of voters) {
      // @ts-ignore
      let groups = (await election.methods.getGroupsVotedForByAccount(voter).call({}, i)).map(
        normalizeAddress
      )
      groups.forEach((g: string) => put(groupVoters, g, rev[voter][0]))
    }
    // Check group members, if it's mixed, check commission
    for (let group of lst) {
      let { 0: members, 1: commission } = await validators.methods
        .getValidatorGroup(group)
        // @ts-ignore
        .call({}, i)
      members.push(group)
      let unknown = members.map(normalizeAddress).filter((a: string) => {
        if (!rev[a]) {
          put(rev, a, a)
          return true
        }
        return false
      })
      unknown.map(async (a: string) => console.log('Unknown account', await fetchName(a)))
      let competitors = dedup(members.map(normalizeAddress).map((a: string) => rev[a][0])).sort()
      let votes = groupVoters[normalizeAddress(group)]
      if (votes) {
        let unknown = votes.filter((a: string) => {
          if (badvoters[normalizeAddress(group) + '-' + a]) return false
          badvoters[normalizeAddress(group) + '-' + a] = true
          return !competitors.includes(a)
        })
        if (unknown.length > 0) {
          let names = await Promise.all(unknown.map((a: string) => fetchName(a)))
          let comp_names = await Promise.all(competitors.map((a) => fetchName(a)))
          console.log(
            'Unknown voter for group',
            await fetchName(group),
            'Voters',
            names,
            'should have been',
            comp_names
          )
        }
      }
      if (
        competitors.length > 1 &&
        commission !== '500000000000000000000000' &&
        !badgroups[group]
      ) {
        let comp_names = await Promise.all(competitors.map((a) => fetchName(a)))
        console.log(
          "Mixed group where commission isn't 50%",
          await fetchName(group),
          'members',
          comp_names,
          'Commission',
          commission
        )
        badgroups[group] = true
      }
    }
    for (let group of Object.keys(badgroups)) {
      // @ts-ignore
      let { 1: commission } = await validators.methods.getValidatorGroup(group).call({}, i)
      if (commission === '500000000000000000000000') {
        console.log('Mixed group changed to 50%', await fetchName(group))
        delete badgroups[group]
      }
    }
  }
})
