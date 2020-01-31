import { ContractKit } from '@celo/contractkit'
import { readFromSheet, dedup, put, normalizeAddress } from './util'

/*
function findCommon(a: string[], b: string[]) {
  return dedup(a.filter((el) => b.includes(el)).concat(b.filter((el) => a.includes(el))))
}
*/

readFromSheet(async function(kit: ContractKit, data: any) {
  // First, get all voters
  // Check that commission is correct
  let obj: any = {}
  let rev: any = {}
  data.forEach((a: any) => {
    obj[a.address] = a.claims
    a.claims.forEach((c: string) => put(rev, normalizeAddress(c), normalizeAddress(a.address)))
  })
  let election = await kit._web3Contracts.getElection()
  let accounts = await kit._web3Contracts.getAccounts()
  let validators = await kit._web3Contracts.getValidators()
  let evs = await election.getPastEvents('ValidatorGroupVoteCast', { fromBlock: 0 })
  console.log('Events', evs.length, evs[0])
  let voters = dedup(evs.map((a: any) => a.returnValues.account))
  console.log('Voters', voters.length)
  const lastBlock = await kit.web3.eth.getBlockNumber()
  const epochSize = parseInt(await election.methods.getEpochSize().call())
  let badgroups: any = {}
  for (let i = epochSize; i < lastBlock; i += epochSize) {
    // Get groups
    // @ts-ignore
    let lst = await election.methods.getEligibleValidatorGroups().call({}, i)
    console.log(i, lst.length)
    // For all voters,
    // Check group members, if it's mixed, check commission
    for (let group of lst) {
      // @ts-ignore
      let { 0: members, 1: commission } = await validators.methods
        .getValidatorGroup(group)
        .call({}, i)
      let unknown = members.map(normalizeAddress).filter((a: string) => {
        if (!rev[a]) {
          put(rev, a, a)
          return true
        }
        return false
      })
      unknown.map(async (a: string) =>
        console.log('Unknown account', await accounts.methods.getName(a).call())
      )
      // console.log(group)
      let competitors = dedup(members.map(normalizeAddress).map((a: string) => rev[a][0]))
      if (
        competitors.length > 1 &&
        commission !== '500000000000000000000000' &&
        !badgroups[group]
      ) {
        let comp_names = await Promise.all(
          competitors.map((a) => accounts.methods.getName(a).call())
        )
        console.log(
          "Mixed group where commission isn't 50%",
          group,
          await accounts.methods.getName(group).call(),
          competitors,
          comp_names,
          commission
        )
        badgroups[group] = true
      }
    }
    for (let group of Object.keys(badgroups)) {
      // @ts-ignore
      let { 1: commission } = await validators.methods.getValidatorGroup(group).call({}, i)
      if (commission === '500000000000000000000000') {
        console.log(
          'Mixed group changed to 50%',
          group,
          await accounts.methods.getName(group).call()
        )
        delete badgroups[group]
      }
    }
  }
})
