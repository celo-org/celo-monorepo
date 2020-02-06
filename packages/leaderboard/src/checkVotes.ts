import { ContractKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { readFromSheet, dedup, put, normalizeAddress } from './util'

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
  async function fetchName(a: string) {
    let addr = normalizeAddress(a)
    let name = await accounts.methods.getName(addr).call()
    return name + (orig[addr] ? '' : '???') + ' @ ' + addr
  }
  let evs = await election.getPastEvents('ValidatorGroupVoteCast', { fromBlock: 0 })
  console.log('Events', evs.length, evs[0])
  let voters = dedup(evs.map((a: any) => a.returnValues.account)).map(normalizeAddress)
  console.log('Voters', voters.length)
  // @ts-ignore
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
    // for (let i = 100000; i < 110000; i += epochSize) {
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
      groups.forEach((g: string) => put(groupVoters, g, voter))
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
          return !competitors.includes(rev[a][0])
        })
        if (unknown.length > 0) {
          let print: string[] = await Promise.all(
            unknown.map(async (a: string) => {
              let account = rev[a][0]
              let amount = await election.methods
                .getTotalVotesForGroupByAccount(group, a)
                // @ts-ignore
                .call({}, i)
              let orig = badvoters[normalizeAddress(group) + '-' + account] || new BigNumber(0)
              // console.log("Amount", amount, "orig", orig, group, a)
              let res = orig.plus(amount)
              badvoters[normalizeAddress(group) + '-' + account] = res
              if (!orig.gt(new BigNumber(0)) && res.gt(new BigNumber(0))) return account
              else return ''
            })
          )
          print = print.filter((a) => !!a)
          if (print.length > 0) {
            let names = await Promise.all(print.map((a: string) => fetchName(a)))
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
  console.log('Voting Summary')
  let entries: [string, BigNumber][] = Object.entries(badvoters)
  let lst = await Promise.all(
    entries
      .sort(([_1, a], [_2, b]) => a.comparedTo(b))
      .map(async ([str, am]) => {
        let [group, address] = str.split('-')
        return `${await fetchName(address)} voting for ${await fetchName(group)}: ${am.shiftedBy(
          -18
        )}`
      })
  )
  lst.forEach((a) => console.log(a))
})
