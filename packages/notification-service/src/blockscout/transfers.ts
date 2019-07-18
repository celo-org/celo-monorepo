import BigNumber from 'bignumber.js'
import fetch from 'node-fetch'
import { BLOCKSCOUT_API, Currencies, GOLD_TOKEN_ADDRESS, STABLE_TOKEN_ADDRESS } from '../config'
import { getLastBlockNotified, sendPaymentNotification, setLastBlockNotified } from '../firebase'
import { removeEmptyValuesFromObject } from '../util/utils'
import { Log, Response, Transfer } from './blockscout'
import { decodeLogs } from './decode'

export const WEI_PER_GOLD = 1000000000000000000.0

async function query(path: string) {
  try {
    console.debug('Querying Blockscout. Path:', path)
    const response = await fetch(BLOCKSCOUT_API + path)
    const json = await response.json()
    console.debug('Blockscout queried successfully. Path:', path)
    return json
  } catch (error) {
    console.error('Error querying blockscout', error)
  }
}

async function getLatestTokenTransfers(
  tokenAddress: string,
  lastBlockNotified: number,
  currency: Currencies
) {
  const response: Response<Log> = await query(
    `module=logs&action=getLogs&fromBlock=${lastBlockNotified + 1}&toBlock=latest` +
      `&address=${tokenAddress}`
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
  const { transfers, latestBlock } = decodeLogs(response.result)
  for (const transfer of transfers.values()) {
    transfer.currency = currency
  }
  return { transfers, latestBlock }
}

function filterAndJoinTransfers(
  goldTransfers: Map<string, Transfer> | null,
  stableTransfers: Map<string, Transfer> | null
): Transfer[] {
  if (!goldTransfers && !stableTransfers) {
    return []
  }
  if (!goldTransfers) {
    // @ts-ignore checked above
    return [...stableTransfers.values()]
  }
  if (!stableTransfers) {
    return [...goldTransfers.values()]
  }

  // Exclude transaction found in both maps as those are from exchanges
  const filteredGold = [...goldTransfers.values()].filter((t) => !stableTransfers.has(t.txHash))
  const filterdStable = [...stableTransfers.values()].filter((t) => !goldTransfers.has(t.txHash))
  return filteredGold.concat(filterdStable)
}

function notifyForNewTransfers(transfers: Transfer[], lastBlockNotified: number) {
  for (const t of transfers) {
    // Skip transactions for which we've already sent notifications
    if (!t || t.blockNumber <= lastBlockNotified) {
      continue
    }

    // notification data must be only string type
    const notificationData = {
      ...t,
      blockNumber: String(t.blockNumber),
      timestamp: String(t.timestamp),
    }
    sendPaymentNotification(
      t.recipient,
      convertWeiValue(t.value),
      t.currency,
      removeEmptyValuesFromObject(notificationData)
    )
  }
}

function convertWeiValue(value: string) {
  return new BigNumber(value)
    .div(WEI_PER_GOLD)
    .decimalPlaces(4)
    .valueOf()
}

export async function handleTransferNotifications() {
  const lastBlockNotified = getLastBlockNotified()
  if (lastBlockNotified < 0) {
    // Firebase not yet ready
    return
  }

  const {
    transfers: goldTransfers,
    latestBlock: goldTransfersLatestBlock,
  } = await getLatestTokenTransfers(GOLD_TOKEN_ADDRESS, lastBlockNotified, Currencies.GOLD)

  const {
    transfers: stableTransfers,
    latestBlock: stableTransfersLatestBlock,
  } = await getLatestTokenTransfers(STABLE_TOKEN_ADDRESS, lastBlockNotified, Currencies.DOLLAR)

  const allTransfers = filterAndJoinTransfers(goldTransfers, stableTransfers)

  notifyForNewTransfers(allTransfers, lastBlockNotified)
  setLastBlockNotified(Math.max(goldTransfersLatestBlock, stableTransfersLatestBlock))
}
