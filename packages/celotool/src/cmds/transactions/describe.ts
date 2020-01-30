import { newKitFromWeb3 } from '@celo/contractkit'
import { newBlockExplorer } from '@celo/contractkit/lib/explorer/block-explorer'
import { newLogExplorer } from '@celo/contractkit/lib/explorer/log-explorer'
import { getWeb3Client } from 'src/lib/blockchain'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import yargs from 'yargs'
import { TransactionsArgv } from '../transactions'
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

  const web3 = await getWeb3Client(argv.celoEnv)
  const kit = await newKitFromWeb3(web3)
  const blockExplorer = await newBlockExplorer(kit)
  const logExplorer = await newLogExplorer(kit)
  const transaction = await web3.eth.getTransaction(argv.transactionHash)
  const receipt = await web3.eth.getTransactionReceipt(argv.transactionHash)

  if (process.env.CELOTOOL_VERBOSE === 'true') {
    console.info('Raw Transaction Data:')
    console.info(transaction)

    console.info('Raw Transaction Receipt')
    console.info(receipt)
  }

  const parsedTransaction = blockExplorer.tryParseTx(transaction)

  if (parsedTransaction === null) {
    return
  }

  console.info('Parsed Transaction Data')
  console.info(parsedTransaction)

  if (receipt.logs) {
    receipt.logs.forEach((log) => {
      const parsedLog = logExplorer.tryParseLog(log)

      if (parsedLog === null) {
        return
      }

      console.info('Parsed Transaction Log')
      console.info(parsedLog)
    })
  }
}
