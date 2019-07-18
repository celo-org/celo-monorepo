import { TransactionsArgv } from '@celo/celotool/src/cmds/transactions'
import {
  constructFunctionABICache,
  FunctionABICache,
  getContracts,
  parseFunctionCall,
  parseLog,
} from '@celo/contractkit'
import moment from 'moment'
import fetch from 'node-fetch'
import { CONTRACTS_TO_COPY, copyContractArtifacts, downloadArtifacts } from 'src/lib/artifacts'
import { getWeb3Client } from 'src/lib/blockchain'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { getBlockscoutUrl } from 'src/lib/endpoints'
import Web3 from 'web3'
import * as yargs from 'yargs'

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
  await switchToClusterFromEnv(false)

  await downloadArtifacts(argv.celoEnv)
  await copyContractArtifacts(
    argv.celoEnv,
    '../transaction-metrics-exporter/src/contracts',
    CONTRACTS_TO_COPY
  )

  const web3 = await getWeb3Client(argv.celoEnv)
  const blockscoutURL = getBlockscoutUrl(argv)
  const resp = await fetch(
    `${blockscoutURL}/api?module=account&action=txlist&address=${argv.address}&sort=desc`
  )
  const jsonResp = await resp.json()
  const contracts = await getContracts(web3)
  const functionABICache = constructFunctionABICache(Object.values(contracts), web3)

  if (jsonResp.result === undefined) {
    return
  }

  for (const blockscoutTx of jsonResp.result) {
    await fetchTx(web3, functionABICache, blockscoutTx)
  }
  process.exit(0)
}

async function fetchTx(
  web3: Web3,
  functionABICache: FunctionABICache,
  blockscoutTx: { hash: string; timeStamp: string }
) {
  const transaction = await web3.eth.getTransaction(blockscoutTx.hash)
  const receipt = await web3.eth.getTransactionReceipt(blockscoutTx.hash)

  const res = parseFunctionCall(transaction, functionABICache, web3)

  if (res === null) {
    return
  }

  const [parsedTransaction, transactionContract] = res

  console.info('\n' + moment.unix(parseInt(blockscoutTx.timeStamp, 10)).fromNow())
  if (parsedTransaction === null) {
    console.info(`Unparsable Transaction: ${transaction.hash}`)
    return
  }

  console.info(
    `${parsedTransaction.contractName}#${parsedTransaction.functionName}(${JSON.stringify(
      parsedTransaction.parameters
    )}) ${parsedTransaction.transactionHash}`
  )

  if (receipt.logs) {
    receipt.logs.forEach((log) => {
      try {
        const parsedLog = parseLog(parsedTransaction, log, transactionContract, web3)

        if (parsedLog === null) {
          console.info(`\tParsed log is null for log "${log.address}"`)
          return
        }

        console.info(`\t${parsedLog.logName}(${JSON.stringify(parsedLog.parameters)})`)
      } catch (e) {
        console.error(`Error while parsing log ${log}`)
      }
    })
  }
}
