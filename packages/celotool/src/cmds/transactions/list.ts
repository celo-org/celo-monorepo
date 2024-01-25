import { newKitFromWeb3 } from '@celo/contractkit'
import { BlockExplorer, newBlockExplorer } from '@celo/explorer/lib/block-explorer'
import { LogExplorer, newLogExplorer } from '@celo/explorer/lib/log-explorer'
import fetch from 'node-fetch'
import { CONTRACTS_TO_COPY, copyContractArtifacts, downloadArtifacts } from 'src/lib/artifacts'
import { getWeb3Client } from 'src/lib/blockchain'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { getBlockscoutUrl } from 'src/lib/endpoints'
import Web3 from 'web3'
import yargs from 'yargs'
import { TransactionsArgv } from '../transactions'

export const command = 'list <address>'

export const describe = 'lists transactions to this address'

interface ListArgv extends TransactionsArgv {
  address: string
}

export const builder = (argv: yargs.Argv) => {
  return argv.positional('address', {
    description: 'the address to search for',
  })
}

export const handler = async (argv: ListArgv) => {
  await switchToClusterFromEnv(argv.celoEnv, false)

  await downloadArtifacts(argv.celoEnv)
  await copyContractArtifacts(
    argv.celoEnv,
    '../transaction-metrics-exporter/src/contracts',
    CONTRACTS_TO_COPY
  )

  const web3 = await getWeb3Client(argv.celoEnv)
  const blockscoutURL = getBlockscoutUrl(argv.celoEnv)
  const kit = newKitFromWeb3(web3)
  const blockExplorer = await newBlockExplorer(kit)
  const logExplorer = await newLogExplorer(kit)
  const resp = await fetch(
    `${blockscoutURL}/api?module=account&action=txlist&address=${argv.address}&sort=desc`
  )
  const jsonResp = await resp.json()

  if (jsonResp.result === undefined) {
    return
  }

  for (const blockscoutTx of jsonResp.result) {
    await fetchTx(web3, blockExplorer, logExplorer, blockscoutTx)
  }
  process.exit(0)
}

async function fetchTx(
  web3: Web3,
  blockExplorer: BlockExplorer,
  logExplorer: LogExplorer,
  blockscoutTx: { hash: string; timeStamp: string }
) {
  const transaction = await web3.eth.getTransaction(blockscoutTx.hash)
  const receipt = await web3.eth.getTransactionReceipt(blockscoutTx.hash)

  const parsedTransaction = await blockExplorer.tryParseTx(transaction)

  if (parsedTransaction === null) {
    console.info(`Unparsable Transaction: ${transaction.hash}`)
    return
  }

  console.info(
    `${parsedTransaction.callDetails.contract}#${
      parsedTransaction.callDetails.function
    }(${JSON.stringify(parsedTransaction.callDetails.paramMap)}) ${parsedTransaction.tx.hash}`
  )

  if (receipt.logs) {
    receipt.logs.forEach((log) => {
      try {
        const parsedLog = logExplorer.tryParseLog(log)

        if (parsedLog === null) {
          console.info(`\tParsed log is null for log "${log.address}"`)
          return
        }

        console.info(`\t${parsedLog.event}(${JSON.stringify(parsedLog.returnValues)})`)
      } catch (e) {
        console.error(`Error while parsing log ${JSON.stringify(log)}`)
      }
    })
  }
}
