/* tslint:disable no-console */
import fetch from 'node-fetch'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { getBlockscoutUrl } from 'src/lib/endpoints'
import { Argv } from 'yargs'
import { AccountArgv } from '../account'

export const command = 'list'
export const describe = 'Command for listing users'

type ListArgv = AccountArgv

// Known accounts for argentinaproduction
const knownAccounts = new Map([
  ['0xd4662aed4aa8719cd7dd9bc01034627951184a64', "Will's Phone number +5491126196048"],
  ['0x5feb9f304d8309f4802dda947eac50558a7e0c62', "Anca's Phone number +5491126033185 "],
  ['0x2e7e480e7d6a2577a72a869788dc2acd7b069e9d', "Nicolas's Phone number +5491150466926"],
  ['0x3cb712ff0114ca421d2aefb9e4fdbe8e78be0936', "Vanessa's Phone number +5491157641239"],
  ['0x1f2b673387a470c9b45397f7cd9f81eeff37af3a', "Jason's Phone number +5491136815320"],
])

export const builder = (yargs: Argv) => {
  return yargs
}

export const handler = async (argv: ListArgv) => {
  const domain = getBlockscoutUrl(argv.celoEnv)
  const listUsersUrl = `${domain}/api?module=account&action=tokentx&address=0x0000000000000000000000000000000000000abe`

  await switchToClusterFromEnv(argv.celoEnv, false, true)

  console.info(`Getting list of users for "${argv.celoEnv}" environment`)
  const resp = await fetch(listUsersUrl)
  const jsonResp = await resp.json()
  await handleListOfUsers(domain, jsonResp, process.env.CELOTOOL_VERBOSE === 'true')
}

async function handleListOfUsers(domain: string, json: any, verboseMode: boolean) {
  if (verboseMode) {
    console.info('verbose mode enabled')
  }
  const transactionUrlPrefix = `${domain}/api?module=account&action=tokentx&address=`
  const users = new Set<string>()
  for (const object of json.result) {
    users.add(object.from)
  }

  console.info(`Num of users: ${users.size}`)
  const usersArray = Array.from(users.values())
  const usersAndTransactions = new Array(usersArray.length)

  console.debug('Getting transactions for all the users, this will take time...')

  const transactions = await Promise.all(
    usersArray.map((address: string) =>
      getNonverificationTransactions(transactionUrlPrefix + address)
    )
  )
  for (let i = 0; i < usersArray.length; i++) {
    const address = usersArray[i]
    const numRealTransactions = transactions[i].length
    const latestTransactionTimestamp = getLatestTransactionTimestamp(transactions[i])
    usersAndTransactions[i] = { address, numRealTransactions, latestTransactionTimestamp }
    if (verboseMode) {
      console.debug(
        `Address ${i + 1}/${
          usersArray.length
        }: ${address}, non-verification transactions: ${numRealTransactions}`
      )
      const transactionUrl = transactionUrlPrefix + address
      console.debug(`Transaction address: ${transactionUrl}`)
    }
  }

  console.debug('Sorting users in the decreasing order of transactions...')
  // Sort in decreasing order of the number of transactions. For users with same number
  // of transactions, put the user who made the latest transaction first.
  usersAndTransactions
    .sort((a: any, b: any) => {
      if (a.numRealTransactions !== b.numRealTransactions) {
        return a.numRealTransactions - b.numRealTransactions
      }
      return a.latestTransactionTimestamp - b.latestTransactionTimestamp
    })
    .reverse()

  for (const entry of usersAndTransactions) {
    const address = entry.address
    const numRealTransactions = entry.numRealTransactions
    const latestTransactionTimestampInSeconds = entry.latestTransactionTimestamp
    const lastTransactionHumanReadableTime =
      latestTransactionTimestampInSeconds > 0
        ? new Date(latestTransactionTimestampInSeconds * 1000).toLocaleString()
        : 'Not applicable'
    let infoString =
      `Address: ${address}\t` +
      `non-verification transactions: ${numRealTransactions}\t` +
      `last transaction on:  ${lastTransactionHumanReadableTime}`

    if (knownAccounts.has(address)) {
      infoString = `${infoString} (${knownAccounts.get(address)}`
    }
    console.info(infoString)
  }
}

async function getNonverificationTransactions(transactionUrl: string) {
  let jsonResp: any

  // Try thrice before giving up.
  for (let i = 0; i < 3; i++) {
    try {
      const resp = await fetch(transactionUrl)
      jsonResp = await resp.json()
    } catch (e) {
      await sleep(Math.random() * 5000)
    }
  }

  if (jsonResp === null) {
    console.error(`Failed to get valid response for ${transactionUrl}`)
    return []
  }

  if (jsonResp == null || jsonResp.result == null) {
    return []
  }
  return jsonResp.result.filter(
    (transaction: any) => transaction.to !== '0x0000000000000000000000000000000000000abe'
  )
}

const getLatestTransactionTimestamp = (transactions: any[]): number => {
  let maxValue = -1
  for (const transaction of transactions) {
    if (parseInt(transaction.timeStamp, 10) > maxValue) {
      maxValue = transaction.timeStamp
    }
  }
  return maxValue
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
