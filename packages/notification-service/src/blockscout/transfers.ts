import BigNumber from 'bignumber.js'
import fetch from 'node-fetch'
import { BLOCKSCOUT_API } from '../config'
import { getLastBlockNotified, sendPaymentNotification, setLastBlockNotified } from '../firebase'
import { flat, getTokenAddresses, removeEmptyValuesFromObject } from '../util/utils'
import { Log, Response, TokenTransfer, Transfer } from './blockscout'
import { decodeLogs } from './decode'
import { formatNativeTransfers } from './nativeTransfersFormatter'

export const WEI_PER_GOLD = 1000000000000000000.0
export const MAX_BLOCKS_TO_WAIT = 120

export enum Currencies {
  GOLD = 'gold',
  DOLLAR = 'dollar',
}

let processedBlocks: number[] = []

export async function query(path: string) {
  try {
    console.debug('Querying Blockscout. Path:', path)
    const response = await fetch(BLOCKSCOUT_API + path)
    const json = await response.json()
    console.debug('Blockscout queried successfully. Path:', path)
    return json
  } catch (error) {
    console.error('Error querying blockscout', error)
    throw error
  }
}

async function getLatestTokenTransfers(
  tokenAddress: string,
  lastBlockNotified: number,
  currency: Currencies,
  useLogs: boolean = true
) {
  const moduleAndAction = useLogs ? 'module=logs&action=getLogs' : 'module=token&action=tokentx'
  const response: Response<Log> | Response<TokenTransfer> = await query(
    `${moduleAndAction}&fromBlock=${lastBlockNotified + 1}&toBlock=latest` +
      `&${useLogs ? '' : 'contract'}address=${tokenAddress}`
  )

  if (!response || !response.result) {
    console.error('Invalid query response format')
    return { transfers: null, latestBlock: lastBlockNotified }
  }

  if (!response.result.length) {
    console.debug('No new logs found for token:', tokenAddress)
    return { transfers: null, latestBlock: lastBlockNotified }
  }

  console.debug('New logs found for token:', tokenAddress, response.result.length)
  const { transfers, latestBlock } = useLogs
    ? decodeLogs(response.result as Log[])
    : formatNativeTransfers(response.result as TokenTransfer[])
  for (const txTransfers of transfers.values()) {
    txTransfers.forEach((t) => (t.currency = currency))
  }
  return { transfers, latestBlock }
}

export function filterAndJoinTransfers(
  goldTransfers: Map<string, Transfer[]> | null,
  nativeGoldTransfers: Map<string, Transfer[]> | null,
  stableTransfers: Map<string, Transfer[]> | null
): Transfer[] {
  if (!goldTransfers && !stableTransfers && !nativeGoldTransfers) {
    return []
  }
  const nativeGoldFlattenedTransfers = [...(nativeGoldTransfers?.values() ?? [])]
  if (!goldTransfers && !stableTransfers) {
    return flat(nativeGoldFlattenedTransfers)
  }
  if (!goldTransfers) {
    // @ts-ignore checked above
    return flat([...stableTransfers.values(), ...nativeGoldFlattenedTransfers])
  }
  if (!stableTransfers) {
    return flat([...goldTransfers.values(), ...nativeGoldFlattenedTransfers])
  }

  // Exclude transaction found in both maps as those are from exchanges
  const filteredGold = flat([...goldTransfers.values()]).filter(
    (t) => !stableTransfers.has(t.txHash)
  )
  const filteredStable = flat([...stableTransfers.values()]).filter(
    (t) => !goldTransfers.has(t.txHash)
  )
  return filteredGold.concat(filteredStable).concat(flat(nativeGoldFlattenedTransfers))
}

export function notifyForNewTransfers(transfers: Transfer[]): Promise<void[]> {
  const results = new Array<Promise<void>>(transfers.length)
  for (let i = 0; i < transfers.length; i++) {
    const t = transfers[i]

    // Skip transactions for which we've already sent notifications
    if (!t || processedBlocks.find((blockNumber) => blockNumber === t.blockNumber)) {
      continue
    }

    // notification data must be only string type
    const notificationData = {
      ...t,
      blockNumber: String(t.blockNumber),
      timestamp: String(t.timestamp),
    }
    const result: Promise<void> = sendPaymentNotification(
      t.recipient,
      convertWeiValue(t.value),
      t.currency,
      removeEmptyValuesFromObject(notificationData)
    )
    results[i] = result
  }
  const filtered = results.filter((el) => {
    return el !== undefined
  })
  return Promise.all(filtered)
}

export function convertWeiValue(value: string) {
  return new BigNumber(value)
    .div(WEI_PER_GOLD)
    .decimalPlaces(4)
    .valueOf()
}

export function updateProcessedBlocks(transfers: Transfer[], lastBlock: number) {
  transfers.forEach((transfer) => {
    if (transfer && processedBlocks.indexOf(transfer.blockNumber) < 0) {
      processedBlocks.push(transfer?.blockNumber)
    }
  })
  processedBlocks = processedBlocks.filter(
    (blockNumber) => blockNumber >= lastBlock - MAX_BLOCKS_TO_WAIT
  )
}

export async function handleTransferNotifications(): Promise<void> {
  const lastBlockNotified = getLastBlockNotified()
  if (lastBlockNotified < 0) {
    // Firebase not yet ready
    return
  }
  // Blockscout is eventually consistent, it doesn't resolve all blocks in order.
  // To account for this, we save a cache of all blocks already handled in the last |MAX_BLOCKS_TO_WAIT| blocks (|processedBlocks|),
  // so a transaction has that number of blocks to show up on Blockscout before we miss sending the notification for it.
  const blockToQuery = lastBlockNotified - MAX_BLOCKS_TO_WAIT

  const { goldTokenAddress, stableTokenAddress } = await getTokenAddresses()
  const {
    transfers: goldTransfers,
    latestBlock: goldTransfersLatestBlock,
  } = await getLatestTokenTransfers(goldTokenAddress, blockToQuery, Currencies.GOLD)

  // Native CELO transfers are not returned when fetching with logs, so we need to make an
  // extra request using a different endpoint to fetch them.
  const {
    transfers: nativeCeloTransfers,
    latestBlock: nativeCeloTransfersLatestBlock,
  } = await getLatestTokenTransfers(goldTokenAddress, blockToQuery, Currencies.GOLD, false)

  const {
    transfers: stableTransfers,
    latestBlock: stableTransfersLatestBlock,
  } = await getLatestTokenTransfers(stableTokenAddress, blockToQuery, Currencies.DOLLAR)
  const lastBlock = Math.max(
    stableTransfersLatestBlock,
    goldTransfersLatestBlock,
    nativeCeloTransfersLatestBlock
  )
  const allTransfers = filterAndJoinTransfers(goldTransfers, nativeCeloTransfers, stableTransfers)

  await notifyForNewTransfers(allTransfers)
  updateProcessedBlocks(allTransfers, lastBlock)
  return setLastBlockNotified(lastBlock)
}
