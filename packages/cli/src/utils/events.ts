import { BigNumber } from 'bignumber.js'
import { EventLog } from 'web3-core'

export function mergeEvents(arr1: EventLog[], arr2: EventLog[]) {
  const merged = []
  let index1 = 0
  let index2 = 0
  let current = 0

  while (current < arr1.length + arr2.length) {
    const isArr1Depleted = index1 >= arr1.length
    const isArr2Depleted = index2 >= arr2.length

    if (!isArr1Depleted && (isArr2Depleted || isPrecedingEvent(arr1[index1], arr2[index2]))) {
      merged[current] = arr1[index1]
      index1++
    } else {
      merged[current] = arr2[index2]
      index2++
    }

    current++
  }

  return merged
}

export function isPrecedingEvent(event1: EventLog, event2: EventLog) {
  if (event1.blockNumber < event2.blockNumber) {
    return true
  } else if (event2.blockNumber < event1.blockNumber) {
    return false
  } else {
    return event1.transactionIndex < event2.transactionIndex ? true : false
  }
}

export function initializeBalancesByBlock(state: RewardsCalculationState) {
  Object.keys(state.balances).forEach((acct) => {
    if (state.attestationCompletions[acct] < 3) {
      return
    }
    state.balancesByBlock[acct] = {
      balances: [state.balances[acct]],
      blocks: [state.blockNumberToStartTracking],
    }
  })
}
export function attestedAccounts(events: EventLog[], minimum: number): string[] {
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

export function accountBalances(
  events: EventLog[],
  addressFilter: string[] | undefined
): { [address: string]: BigNumber } {
  let balances: { [address: string]: BigNumber } = {}

  events.forEach(function(eventlog: EventLog) {
    checkEventType(eventlog, 'Transfer')
    updateBalance(balances, eventlog)
  })
  return addressFilter ? filterObject(balances, addressFilter) : balances
}

function updateBalance(balances: Balances, eventLog: EventLog) {
  const amount = eventLog.returnValues.value
  const to = eventLog.returnValues.to
  const from = eventLog.returnValues.from
  balances[to] ? (balances[to] = balances[to].plus(amount)) : (balances[to] = new BigNumber(amount))
  balances[from]
    ? (balances[from] = balances[from].minus(amount))
    : (balances[from] = new BigNumber(0)) // just for address 0x0
  return { to, from }
}

export interface RewardsCalculationState {
  attestationCompletions: AttestationCompletions
  balances: Balances
  balancesByBlock: BalancesByBlockState
  startedBlockBalanceTracking: boolean
  blockNumberToStartTracking: number
  blockNumberToFinishTracking: number
}

export interface AttestationIssuers {
  [account: string]: string[]
}
export interface AttestationCompletions {
  [account: string]: number
}
export interface Balances {
  [account: string]: BigNumber
}
export interface BalancesByBlockState {
  [account: string]: BalancesByBlock
}
export interface BalancesByBlock {
  balances: BigNumber[]
  blocks: number[]
}

export function processAttestationCompletion(
  state: RewardsCalculationState,
  issuers: AttestationIssuers,
  event: EventLog
) {
  const account = event.returnValues.account
  const issuer = event.returnValues.issuer

  if (!issuers[account]) {
    issuers[account] = [issuer]
    state.attestationCompletions[account] = 1
  } else if (issuers[account].indexOf(issuer) === -1) {
    issuers[account].push(issuer)
    state.attestationCompletions[account] += 1
  }

  if (state.startedBlockBalanceTracking && state.attestationCompletions[account] === 3) {
    // Just completed
    state.balancesByBlock[account] = {
      balances: [state.balances[account] || new BigNumber(0)],
      blocks: [event.blockNumber],
    }
  }
}

export function processTransfer(state: RewardsCalculationState, event: EventLog) {
  const { to, from } = updateBalance(state.balances, event)

  if (state.startedBlockBalanceTracking) {
    updateBalanceByBlock(state, from, event.blockNumber)
    updateBalanceByBlock(state, to, event.blockNumber)
  }
}

function updateBalanceByBlock(
  state: RewardsCalculationState,
  account: string,
  blockNumber: number
) {
  if (state.attestationCompletions[account] >= 3) {
    const balancesByBlock = state.balancesByBlock[account]
    if (balancesByBlock.balances.length > 0) {
      balancesByBlock.balances.push(state.balances[account])
      balancesByBlock.blocks.push(blockNumber)
    } else {
      state.balancesByBlock[account] = {
        balances: [state.balances[account]],
        blocks: [blockNumber],
      }
    }
  }
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
      blocks: [fromBlock],
    }
  })

  events.forEach(function(eventlog: EventLog) {
    checkEventType(eventlog, 'Transfer')
    let amount = eventlog.returnValues.value
    let to = eventlog.returnValues.to
    let from = eventlog.returnValues.from
    let block = eventlog.blockNumber
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

export function calculateTimeWeightedAverage(
  balancesTWA: { [address: string]: BalancesByBlock },
  fromBlock: number,
  toBlock: number
): { [address: string]: BigNumber } {
  let averagedBalances: { [key: string]: BigNumber } = {}
  Object.keys(balancesTWA).forEach((address) => {
    const balances = balancesTWA[address].balances
    const blocks = balancesTWA[address].blocks
    const weightedSum = balances.reduce((prevWeightedBalance, balance, i) => {
      const currentBlock = blocks[i]
      const nextBlock = blocks[i + 1] || toBlock
      const weightedBalance = balance.times(nextBlock - currentBlock)
      return prevWeightedBalance.plus(weightedBalance)
    }, new BigNumber(0))
    const weightedAverage = weightedSum.dividedBy(new BigNumber(toBlock - fromBlock))
    averagedBalances[address] = weightedAverage
  })
  return averagedBalances
}
