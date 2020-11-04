import { newKit } from '@celo/contractkit'
import { describe } from '@jest/globals'
import { clearAllFundsToRoot, loadFromEnvFile } from './scaffold'
import { runExchangeTest } from './tests/exchange'
import { runTransfercUSDTest } from './tests/transfer'

jest.setTimeout(30000)
function runTests() {
  const envName = loadFromEnvFile()

  if (!process.env.MNEMONIC) {
    throw new Error('No MNEMONIC was set, envName was parsed as ' + envName)
  }
  const kit = newKit(process.env.CELO_PROVIDER || 'http://localhost:8545')
  const mnemonic = process.env.MNEMONIC!

  describe('Run tests in context of monorepo', () => {
    runTransfercUSDTest(kit, mnemonic)
    runExchangeTest(kit, mnemonic)

    afterAll(async () => {
      await clearAllFundsToRoot(kit, mnemonic)
    })
  })
}

runTests()
