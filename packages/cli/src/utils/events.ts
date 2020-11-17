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
      : (balances[from] = new BigNumber(0)) // just for address 0x0
  })
  return addressFilter ? filterObject(balances, addressFilter) : balances
}

interface BalancesByBlock {
  balances: BigNumber[]
  blocks: BigNumber[]
}

export async function accountBalancesTWA(
  events: EventLog[],
  initialBalances: { [acct: string]: BigNumber },
  fromBlock: number,
  toBlock: number
): Promise<{ [address: string]: BigNumber }> {
  let balancesByBlock: { [address: string]: BalancesByBlock } = {}
  Object.keys(initialBalances).forEach((acct) => {
    balancesByBlock[acct] = {
      balances: [initialBalances[acct]],
      blocks: [new BigNumber(fromBlock)],
    }
  })

  events.forEach(function(eventlog: EventLog) {
    checkEventType(eventlog, 'Transfer')
    let amount = eventlog.returnValues.value
    let to = eventlog.returnValues.to
    let from = eventlog.returnValues.from
    let block = new BigNumber(eventlog.blockNumber)
    if (balancesByBlock[to]) {
      let balances = balancesByBlock[to]
      let prevBalance = balances.balances[balances.balances.length - 1]
      let newBalance = prevBalance.plus(amount)
      balancesByBlock[to].balances.push(newBalance)
      balancesByBlock[to].blocks.push(block)
    }
    if (balancesByBlock[from]) {
      let balances = balancesByBlock[from]
      let prevBalance = balances.balances[balances.balances.length - 1]
      let newBalance = prevBalance.minus(amount)
      balancesByBlock[from].balances.push(newBalance)
      balancesByBlock[from].blocks.push(block)
    }
  })
  return calculateTimeWeightedAverage(balancesByBlock, fromBlock, toBlock)
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
  // filter repeat accounts (which would have had multiple attatestioncompleted from the final issuer)
  return verifiedAccounts.filter((acct, index) => verifiedAccounts.indexOf(acct) == index)
}

function checkEventType(event: EventLog, eventType: string) {
  if (event.event !== eventType) {
    const err = `Event mismatch: expected ${eventType} but received ${event.event}`
    console.error(err)
    throw err
  }
}

function filterObject(
  unfilteredObj: { [key: string]: any },
  filter: string[]
): { [key: string]: any } {
  let obj: { [key: string]: any } = {}
  return filter.reduce((filteredObj, key) => {
    filteredObj[key] = unfilteredObj[key]
    return filteredObj
  }, obj)
}

function calculateTimeWeightedAverage(
  balancesTWA: { [address: string]: BalancesByBlock },
  fromBlock: number,
  toBlock: number
): { [address: string]: BigNumber } {
  let averagedBalances: { [key: string]: any } = {}
  Object.keys(balancesTWA).forEach((address) => {
    const balances = balancesTWA[address].balances
    const blocks = balancesTWA[address].blocks
    const weightedSum = balances.reduce((prevWeightedBalance, balance, i) => {
      const currentBlock = blocks[i]
      const nextBlock = blocks[i + 1] || new BigNumber(toBlock)
      const weightedBalance = balance.times(nextBlock.minus(currentBlock))
      return prevWeightedBalance.plus(weightedBalance)
    }, new BigNumber(0))
    const weightedAverage = weightedSum.dividedBy(new BigNumber(toBlock - fromBlock))
    averagedBalances[address] = weightedAverage
  })
  return averagedBalances
}
