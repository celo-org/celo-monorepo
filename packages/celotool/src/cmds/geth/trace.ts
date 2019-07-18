import { GethArgv } from '@celo/celotool/src/cmds/geth'
import { addCeloEnvMiddleware, CeloEnvArgv } from '@celo/celotool/src/lib/utils'
import { getBlockscoutUrl } from 'src/lib/endpoints'
import { checkGethStarted, getWeb3AndTokensContracts, traceTransactions } from 'src/lib/geth'
import * as yargs from 'yargs'

export const command = 'trace <address1> <address2>'

export const describe = 'command for tracing tokens transfers between accounts'

interface TraceArgv extends GethArgv, CeloEnvArgv {
  address1: string
  address2: string
}

export const builder = (argv: yargs.Argv) => {
  return addCeloEnvMiddleware(argv)
    .option('data-dir', {
      type: 'string',
      description: 'path to datadir',
      demand: 'Please, specify geth datadir',
    })
    .positional('address1', {
      description: 'sender address',
    })
    .positional('address2', {
      description: 'recipient address',
    })
}

const sleep = (ms: number) => {
  return new Promise((resolve: any) => setTimeout(resolve, ms))
}

export const handler = async (argv: TraceArgv) => {
  const dataDir = argv.dataDir
  const address1 = argv.address1
  const address2 = argv.address2

  checkGethStarted(dataDir)

  let iterations = 70
  let web3AndContracts = null
  outerwhile: while (iterations-- > 0) {
    try {
      web3AndContracts = await getWeb3AndTokensContracts()
      // tslint:disable-next-line: no-shadowed-variable
      const { web3 } = web3AndContracts!
      const latestBlock = await web3.eth.getBlock('latest')
      if (latestBlock.number === 0) {
        throw new Error('Latest block is zero')
      } else {
        break outerwhile
      }
    } catch (ignored) {
      console.warn(ignored.toString())
      if (iterations === 0) {
        console.error('Geth start error')
      }
      await sleep(1000)
    }
  }

  if (iterations <= 0) {
    console.warn('Can not wait for geth to sync')
    console.error('bad start')
    process.exit(1)
  }

  const { web3, goldToken, stableToken } = web3AndContracts!

  // This is needed to turn off debug logging which is made in `sendTransaction`
  // and needed only for mobile client.
  console.debug = () => {
    // empty
  }

  await traceTransactions(
    web3,
    goldToken,
    stableToken,
    [address1, address2],
    getBlockscoutUrl(argv)
  )
}
