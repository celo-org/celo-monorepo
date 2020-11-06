import { newKit } from '@celo/contractkit'
import { describe } from '@jest/globals'
import { loadFromEnvFile } from './env'
import { rootLogger } from './logger'
import { clearAllFundsToRoot } from './scaffold'
import { runExchangeTest } from './tests/exchange'
import { runTransfercUSDTest } from './tests/transfer'

jest.setTimeout(120000)
function runTests() {
  const envName = loadFromEnvFile()

  if (!process.env.MNEMONIC) {
    throw new Error('No MNEMONIC was set, envName was parsed as ' + envName)
  }
  const kit = newKit(process.env.CELO_PROVIDER || 'http://localhost:8545')
  const mnemonic = process.env.MNEMONIC!

  describe('Run tests in context of monorepo', () => {
    // TODO: Assert maximum loss after test
    runTransfercUSDTest({ kit, mnemonic, logger: rootLogger })
    runExchangeTest({ kit, mnemonic, logger: rootLogger })

    afterAll(async () => {
      await clearAllFundsToRoot({ kit, mnemonic, logger: rootLogger })
    })
  })
}

runTests()
