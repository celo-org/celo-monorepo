import { newKitFromWeb3 } from '@celo/contractkit'
import { describe } from '@jest/globals'
import Web3 from 'web3'
import { loadFromEnvFile } from './env'
import { rootLogger } from './logger'
import { clearAllFundsToRoot } from './scaffold'
import { runAttestationTest } from './tests/attestation'
import { runExchangeTest } from './tests/exchange'
import { runOracleTest } from './tests/oracle'
import { runReserveTest } from './tests/reserve'
import { runTransfercUSDTest } from './tests/transfer'

jest.setTimeout(120000)
function runTests() {
  const envName = loadFromEnvFile()

  if (!process.env.MNEMONIC) {
    throw new Error('No MNEMONIC was set, envName was parsed as ' + envName)
  }
  const kit = newKitFromWeb3(new Web3(process.env.CELO_PROVIDER || 'http://localhost:8545'))
  const mnemonic = process.env.MNEMONIC!

  describe('Run tests in context of monorepo', () => {
    const context = { kit, mnemonic, logger: rootLogger }
    // TODO: Assert maximum loss after test
    runTransfercUSDTest(context)
    runExchangeTest(context)
    runOracleTest(context)
    runReserveTest(context)
    runAttestationTest(context)

    // TODO: Governance Proposals
    // TODO: Validator election + Slashing

    afterAll(async () => {
      await clearAllFundsToRoot({ kit, mnemonic, logger: rootLogger })
    })
  })
}

runTests()
