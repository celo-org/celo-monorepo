import { GethArgv } from '@celo/celotool/src/cmds/geth'
import BigNumber from 'bignumber.js'
import { checkGethStarted, getWeb3AndTokensContracts, transferERC20Token } from 'src/lib/geth'
import * as yargs from 'yargs'

export const command = 'transfer <senderAddress> <receiverAddress> <token> <amount>'

export const describe = 'command for transfering tokens between accounts'

const CELO_GOLD = 'cGLD'
const CELO_DOLLARS = 'cUSD'

interface TransferArgv extends GethArgv {
  senderAddress: string
  receiverAddress: string
  token: string
  amount: string
  password: string
}

export const builder = (argv: yargs.Argv) => {
  return argv
    .option('data-dir', {
      type: 'string',
      description: 'path to datadir',
      demand: 'Please, specify geth datadir',
    })
    .positional('senderAddress', {
      description: 'sender address',
    })
    .positional('receiverAddress', {
      description: 'recipient address',
    })
    .positional('token', {
      choices: [CELO_GOLD, CELO_DOLLARS],
    })
    .positional('amount', {
      description: 'amount to transfer',
    })
    .option('password', {
      type: 'string',
      description: 'sender account password',
      default: '',
    })
}

export const handler = async (argv: TransferArgv) => {
  const dataDir = argv.dataDir
  const senderAddress = argv.senderAddress
  const receiverAddress = argv.receiverAddress
  const tokenType = argv.token
  const amount = argv.amount
  const password = argv.password

  checkGethStarted(dataDir)

  const { web3, goldToken, stableToken } = await getWeb3AndTokensContracts()

  const transferrableToken = tokenType === CELO_GOLD ? goldToken : stableToken

  await transferERC20Token(
    web3,
    transferrableToken,
    senderAddress,
    receiverAddress,
    new BigNumber(amount),
    password
  )
}
