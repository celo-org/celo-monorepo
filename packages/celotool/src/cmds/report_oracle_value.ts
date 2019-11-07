import { CeloContract, CeloToken, newKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { addCeloEnvMiddleware, CeloEnvArgv, envVar, fetchEnv } from 'src/lib/env-utils'
import { AccountType, generatePrivateKey, privateKeyToAddress } from 'src/lib/generate_utils'
import { portForwardAnd } from 'src/lib/port_forward'
import * as yargs from 'yargs'

export const command = 'report-oracle-value'

interface ReportOracleValueArgv extends CeloEnvArgv {
  token: string
  price: number
  // oracleAccount: string
}

export const builder = (argv: yargs.Argv) => {
  return addCeloEnvMiddleware(argv)
    .option('token', {
      type: 'string',
      description: 'Celo Token in which to report the price of 1 Celo Gold',
      default: 'StableToken',
    })
    .option('price', {
      type: 'number',
      description: 'The price of 1 Celo Gold in the specified token (float values allowed)',
      demand: 'Please specify the price of 1 Celo Gold',
    })
}

export const handler = async (argv: ReportOracleValueArgv) => {
  await switchToClusterFromEnv(false)

  try {
    await portForwardAnd(argv.celoEnv, reportCmd.bind(null, argv))
    console.info('finished with the portforwarding???')
  } catch (error) {
    console.error(`Unable to report value of ${argv.token}`)
    console.error(error.error)
    process.exit(1)
  }
  process.exit()
}

async function reportCmd(argv: ReportOracleValueArgv) {
  let token: CeloToken
  if (argv.token === CeloContract.StableToken) {
    token = CeloContract.StableToken
  } else {
    console.error(`${argv.token} is not a valid token to report upon`)
    process.exit(1)
    return
  }

  let numerator = new BigNumber(argv.price)
  let denominator = new BigNumber(1)

  if (numerator.decimalPlaces() > 0) {
    denominator = new BigNumber(10).pow(numerator.decimalPlaces())
    numerator = numerator.multipliedBy(denominator)
  }

  const kit = newKit('http://localhost:8545')
  const mnemonic = fetchEnv(envVar.MNEMONIC)
  // TODO: switch this to the right account type after deploying testnet
  // Or, don't hardcode this at all.
  const oracleKey = generatePrivateKey(mnemonic, AccountType.ATTESTATION, 0)
  kit.addAccount(oracleKey)
  const oracleAddress = privateKeyToAddress(oracleKey)

  const sortedOracles = await kit.contracts.getSortedOracles()
  const tx = await sortedOracles.report(
    token,
    numerator.toNumber(),
    denominator.toNumber(),
    oracleAddress
    // '0xF4314cb9046bECe6AA54bb9533155434d0c76909'
  )

  await tx.sendAndWaitForReceipt()
  console.info(`Reported the price of ${argv.price} ${argv.token} for 1 Celo Gold`)
}
