import { retryAsync } from '@celo/utils/lib/async'
import Web3 from 'web3'
import yargs from 'yargs'
import { CeloAdapter } from '../src/celo-adapter'

// tslint:disable-next-line: no-unused-expression
yargs
  .scriptName('yarn transfer-funds')
  .strict(true)
  .showHelpOnFail(true)
  .option('nodeUrl', {
    type: 'string',
    demandOption: true,
  })
  .option('goldAmount', {
    type: 'string',
  })
  .option('stableAmount', {
    type: 'string',
  })
  .option('dryrun', { type: 'boolean' })
  .usage(
    '$0 <pk> <recipientAddress>',
    'Transfer funds',
    (argv) =>
      argv
        .positional('pk', {
          type: 'string',
          description: 'Private Key. Format 0x...',
        })
        .positional('recipientAddress', {
          type: 'string',
          description: 'Address. Format 0x...',
        })
        .demandOption(['pk', 'recipientAddress']),

    async (argv) => {
      try {
        await transferFunds(argv)
      } catch (err) {
        console.error('Failed')
        console.error(err)
      }
    }
  ).argv

async function transferFunds(args: {
  nodeUrl: string
  pk: string
  recipientAddress: string
  dryrun?: boolean
  stableAmount?: string
  goldAmount?: string
}) {
  const pk = args.pk
  const to = args.recipientAddress
  const celo = new CeloAdapter({ pk, nodeUrl: args.nodeUrl })

  const printBalance = async (addr: string) => {
    console.log(`Account: ${addr}`)
    const balances = await celo.kit.celoTokens.balancesOf(addr)
    Object.entries(balances).map(([token, balance]) => {
      console.log(`${token}: ${balance}`)
    })
    console.log('-------------------------------------------')
  }

  console.log('Funder')
  await printBalance(celo.defaultAddress)
  console.log('Recipient')
  await printBalance(to)

  if (args.dryrun) {
    process.exit(0)
  }

  if (args.goldAmount) {
    const goldAmount = Web3.utils.toWei(args.goldAmount)
    const tx = await celo.transferGold(to, goldAmount)
    console.log('receipt', await tx.sendAndWaitForReceipt())
  }

  if (args.stableAmount) {
    const stableAmount = Web3.utils.toWei(args.stableAmount)
    const tokenTxs = await celo.transferStableTokens(to, stableAmount)
    await Promise.all(
      Object.entries(tokenTxs).map(async ([symbol, tx]) => {
        console.log(symbol)
        console.log(tx)
        const transferHelper = async () => {
          console.log('receipt', await tx?.sendAndWaitForReceipt())
        }
        await retryAsync(transferHelper, 3, [], 500)
      })
    )
  }

  console.log('Funder')
  await printBalance(celo.defaultAddress)
  console.log('Recipient')
  await printBalance(to)
}

// --nodeUrl http://35.247.98.50:8545 --stableAmount 10000000000000000000 add67e37fdf5c26743d295b1af6d9b50f2785a6b60bc83a8f05bd1dd4b385c6c  0x22937E2c505374Ce7AaE95993fe7580c526a62b4
