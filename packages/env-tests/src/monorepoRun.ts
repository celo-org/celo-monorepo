import { newKitFromWeb3 } from '@celo/contractkit'
import Web3 from 'web3'
import { loadFromEnvFile } from './env'
import { rootLogger } from './logger'
import { clearAllFundsToRoot } from './scaffold'
import { runExchangeTest } from './tests/exchange'

jest.setTimeout(120000)
function runTests() {
  const envName = loadFromEnvFile()

  if (!process.env.MNEMONIC) {
    throw new Error('No MNEMONIC was set, envName was parsed as ' + envName)
  }
  const kit = newKitFromWeb3(new Web3(process.env.CELO_PROVIDER || 'http://localhost:8545'))
  const mnemonic = process.env.MNEMONIC!
  const reserveSpenderMultiSigAddress = process.env.RESERVE_SPENDER_MULTISIG_ADDRESS
  let stableTokensToTest: [String, String][]
  if (process.env.SECOND_STABLETOKEN) {
    stableTokensToTest = [
      ['cUSD', 'StableToken'],
      ['cEUR', 'StableTokenEUR'],
    ]
  } else {
    stableTokensToTest = [['cUSD', 'StableToken']]
  }

  describe('Run tests in context of monorepo', () => {
    const context = {
      kit,
      mnemonic,
      logger: rootLogger,
      reserveSpenderMultiSigAddress,
      stableTokensToTest,
    }

    // TODO: Assert maximum loss after test
    //runTransfercUSDTest(context)
    runExchangeTest(context)
    // runOracleTest(context)
    // runReserveTest(context)
    // runAttestationTest(context)

    // TODO: Governance Proposals
    // TODO: Validator election + Slashing

    afterAll(async () => {
      await clearAllFundsToRoot(context)
    })
  })
}

runTests()
