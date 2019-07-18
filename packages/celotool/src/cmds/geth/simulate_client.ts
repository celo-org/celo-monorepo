import { GethArgv } from '@celo/celotool/src/cmds/geth'
import fs from 'fs'
import { getBlockscoutClusterInternalUrl } from 'src/lib/endpoints'
import { generateAccountAddressFromPrivateKey } from 'src/lib/generate_utils'
import { checkGethStarted, getWeb3AndTokensContracts, simulateClient, sleep } from 'src/lib/geth'
import { addCeloEnvMiddleware, CeloEnvArgv } from 'src/lib/utils'
import * as yargs from 'yargs'

export const command = 'simulate-client'

export const describe = 'command for simulating client behavior'

const TRANSACTION_RECIPIENT = '0x4da58d267cd465b9313fdb19b120ec591d957ad2'

interface SimulateClientArgv extends CeloEnvArgv, GethArgv {
  delay: number
  privateKey: string
  blockscout: number
  loadTestId: string
}

export const builder = (argv: yargs.Argv) => {
  return addCeloEnvMiddleware(argv)
    .option('data-dir', {
      type: 'string',
      description: 'path to datadir',
      demand: 'Please, specify geth datadir',
    })
    .option('private-key', {
      type: 'string',
      description: 'path to file with private key',
      demand: 'Please, provide a path to file with account private key',
      coerce: (path: string) => {
        if (!fs.existsSync(path)) {
          throw new Error(`File not found at: ${path}`)
        }
        return fs
          .readFileSync(path)
          .toString()
          .trim()
      },
    })
    .option('blockscout', {
      type: 'number',
      description: 'how often to measure blockscout time from on scale from 0 to 100',
      default: 100,
    })
    .option('delay', {
      type: 'number',
      description: 'Deplay between sending transactions in seconds',
      default: 10,
    })
    .option('load-test-id', {
      type: 'string',
      description: 'Unique identifier used to distinguish between ran load-tests',
      demand: 'Please, specify the load test unique identifier',
    })
}

export const handler = async (argv: SimulateClientArgv) => {
  const dataDir = argv.dataDir
  const delay = argv.delay
  const privateKey = argv.privateKey
  const blockscoutProbability = argv.blockscout
  const loadTestID = argv.loadTestId

  const address = generateAccountAddressFromPrivateKey(privateKey).toLowerCase()

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
        console.info(
          JSON.stringify({
            loadTestID,
            sender: address.toLowerCase(),
            receipient: TRANSACTION_RECIPIENT.toLowerCase(),
            tag: 'geth_start_error',
            error: ignored.toString(),
          })
        )
      }
      await sleep(1000)
    }
  }

  if (iterations <= 0) {
    console.warn('Can not wait for geth to sync')
    console.info(
      JSON.stringify({
        loadTestID,
        sender: address.toLowerCase(),
        receipient: TRANSACTION_RECIPIENT.toLowerCase(),
        tag: 'geth_start_unsuccessful',
      })
    )
    process.exit(1)
  }

  const { web3, goldToken, stableToken } = web3AndContracts!

  // Needs to be called only once per private key
  // to create a file in keystore containing all the needed to geth info
  try {
    await web3.eth.personal.importRawKey(privateKey, '')
  } catch (ignored) {
    // ignore
  }

  // This is needed to turn off debug logging which is made in `sendTransaction`
  // and needed only for mobile client.
  console.debug = () => {
    // empty
  }

  await simulateClient(
    web3,
    goldToken,
    stableToken,
    address.toLowerCase(),
    TRANSACTION_RECIPIENT.toLowerCase(),
    getBlockscoutClusterInternalUrl(argv),
    delay,
    blockscoutProbability,
    loadTestID
  )
}
