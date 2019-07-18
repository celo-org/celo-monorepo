import { TransactionsArgv } from '@celo/celotool/src/cmds/transactions'
import {
  constructFunctionABICache,
  getContracts,
  parseFunctionCall,
  parseLog,
} from '@celo/contractkit'
import { CONTRACTS_TO_COPY, copyContractArtifacts, downloadArtifacts } from 'src/lib/artifacts'
import { getWeb3Client } from 'src/lib/blockchain'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import * as yargs from 'yargs'

export const command = 'describe <transactionHash>'

export const describe = 'fetch a transaction, attempt parsing and print it out to STDOUT'

interface DescribeArgv extends TransactionsArgv {
  transactionHash: string
}

export const builder = (argv: yargs.Argv) => {
  return argv.positional('transactionHash', {
    description: 'The hash of the transaction',
  })
}

export const handler = async (argv: DescribeArgv) => {
  await switchToClusterFromEnv(false)
  await downloadArtifacts(argv.celoEnv)
  await copyContractArtifacts(
    argv.celoEnv,
    '../transaction-metrics-exporter/src/contracts',
    CONTRACTS_TO_COPY
  )

  const web3 = await getWeb3Client(argv.celoEnv)

  const contracts = await getContracts(web3)
  const functionABICache = constructFunctionABICache(Object.values(contracts), web3)
  const transaction = await web3.eth.getTransaction(argv.transactionHash)
  const receipt = await web3.eth.getTransactionReceipt(argv.transactionHash)

  if (process.env.CELOTOOL_VERBOSE === 'true') {
    console.info('Raw Transaction Data:')
    console.info(transaction)

    console.info('Raw Transaction Receipt')
    console.info(receipt)
  }

  const res = parseFunctionCall(transaction, functionABICache, web3)

  if (res === null) {
    return
  }

  const [parsedTransaction, transactionContract] = res

  if (parsedTransaction === null) {
    return
  }

  console.info('Parsed Transaction Data')
  console.info(parsedTransaction)

  if (receipt.logs) {
    receipt.logs.forEach((log) => {
      const parsedLog = parseLog(parsedTransaction, log, transactionContract, web3)

      if (parsedLog === null) {
        return
      }

      console.info('Parsed Transaction Log')
      console.info(parsedLog)
    })
  }
}
