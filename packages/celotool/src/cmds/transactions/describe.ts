import { newKitFromWeb3 } from '@celo/contractkit'
import { newBlockExplorer } from '@celo/contractkit/lib/explorer/block-explorer'
import { newLogExplorer } from '@celo/contractkit/lib/explorer/log-explorer'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { getFornoUrl } from 'src/lib/endpoints'
import Web3 from 'web3'
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

  const web3 = new Web3(getFornoUrl(argv.celoEnv))
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

  if (!receipt.status) {
    console.info('Transaction reverted, attempting to recover revert reason ...')

    const called = await web3.eth.call(
      {
        data: transaction.input,
        to: transaction.to ? transaction.to : undefined,
        from: transaction.from,
      },
      transaction.blockNumber!
    )

    if (called.startsWith('0x08c379a')) {
      console.info('Revert reason is:')
      console.info(web3.eth.abi.decodeParameter('string', '0x' + called.substring(10)))
    } else {
      console.info('Could not retrieve revert reason')
    }
  }
}
