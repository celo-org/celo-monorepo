import Web3 from 'web3'
import yargs from 'yargs'
import { CeloAdapter } from '../src/celo-adapter'

// tslint:disable-next-line: no-unused-expression
yargs
  .scriptName('yarn transfer-funds')
  .strict(true)
  .showHelpOnFail(true)
  // .option('net', {
  //   type: 'string',
  //   description: 'Name of network',
  //   demandOption: true,
  // })
  .option('nodeUrl', {
    type: 'string',
    demandOption: true,
  })

  .option('gold', {
    type: 'string',
  })
  .option('dollar', {
    type: 'string',
  })
  .option('stableTokenAddress', {
    type: 'string',
    description: 'Address for stable token contract',
    demand: true,
  })
  .option('goldTokenAddress', {
    type: 'string',
    description: 'Address for the gold token contract',
    demand: true,
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
  stableTokenAddress: string
  goldTokenAddress: string
  pk: string
  recipientAddress: string
  dryrun?: boolean
  gold?: string
  dollar?: string
}) {
  const pk = args.pk
  const to = args.recipientAddress
  // Escrow address is an empty string, because we don't need that contract in this function
  const celo = new CeloAdapter({ pk, nodeUrl: args.nodeUrl })

  const printBalance = async (addr: string) => {
    console.log(`Account: ${addr}`)
    console.log(`USD: ${await celo.getDollarsBalance(addr)}`)
    console.log(`Gold: ${await celo.getGoldBalance(addr)}`)
    console.log('-------------------------------------------')
  }

  console.log('Funder')
  await printBalance(celo.defaultAddress)
  console.log('Recipient')
  await printBalance(to)

  if (args.dryrun) {
    process.exit(0)
  }

  if (args.gold) {
    const goldAmount = Web3.utils.toBN(args.gold)
    const tx = await celo.transferGold(to, goldAmount.toString())
    console.log('receipt', await tx.sendAndWaitForReceipt())
  }

  if (args.dollar) {
    const dollarAmount = Web3.utils.toBN(args.dollar)
    const tx2 = await celo.transferDollars(to, dollarAmount.toString())
    console.log('receipt', await tx2.sendAndWaitForReceipt())
  }

  console.log('Funder')
  await printBalance(celo.defaultAddress)
  console.log('Recipient')
  await printBalance(to)
}

// --nodeUrl http://35.247.98.50:8545 --gold 10000000000000000000 --dollar 10000000000000000000 --stableTokenAddress 0x7DFAA4B53E7d06E9e30C4426d9692453d94A8437 --goldTokenAddress 0x4813BFD311E132ade22c70dFf7e5DB045d26D070 add67e37fdf5c26743d295b1af6d9b50f2785a6b60bc83a8f05bd1dd4b385c6c  0x22937E2c505374Ce7AaE95993fe7580c526a62b4
