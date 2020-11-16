import { BigNumber } from 'bignumber.js'
import { EventLog } from 'web3-core'

export async function accountBalances(
  events: EventLog[],
  addressFilter: string[] | undefined
): Promise<{ [address: string]: BigNumber }> {
  let balances: { [address: string]: BigNumber } = {}

  events.forEach(function(eventlog: EventLog) {
    checkEventType(eventlog, 'Transfer')
    let amount = eventlog.returnValues.value
    let to = eventlog.returnValues.to
    let from = eventlog.returnValues.from
    balances[to]
      ? (balances[to] = balances[to].plus(amount))
      : (balances[to] = new BigNumber(amount))
    balances[from]
      ? (balances[from] = balances[from].minus(amount))
      : (balances[from] = new BigNumber(0))
  })
  console.log('ADDRESS FILTER', addressFilter)
  return addressFilter ? filterObject(balances, addressFilter) : balances
}

export async function attestedAccounts(events: EventLog[], minimum: number): Promise<string[]> {
  let verifiedAccounts: string[] = []
  let issuers: { [account: string]: string[] } = {}

  events.forEach(function(eventlog: EventLog) {
    checkEventType(eventlog, 'AttestationCompleted')
    const account: string = eventlog.returnValues.account
    const issuer: string = eventlog.returnValues.issuer
    if (!issuers[account]) {
      issuers[account] = [issuer]
    } else if (issuers[account].indexOf(issuer) === -1) {
      issuers[account].push(issuer)
    }
    if (issuers[account].length === minimum) {
      verifiedAccounts.push(account)
    }
  })
  // filter repeat accounts (which would have had multiple attatestioncompleted from same issuer)
  return verifiedAccounts.filter((acct, index) => verifiedAccounts.indexOf(acct) == index)
}

function checkEventType(event: EventLog, eventType: string) {
  if (event.event !== eventType) {
    const err = `Event mismatch: expected ${eventType} but received ${event.event}`
    console.error(err)
    throw err
  }
}

function filterObject(object: { [key: string]: any }, filter: string[]): { [key: string]: any } {
  let newObj: { [key: string]: any } = {}
  const filtered = filter.reduce((obj, key) => {
    obj[key] = object[key]
    return obj
  }, newObj)
  return filtered
}
