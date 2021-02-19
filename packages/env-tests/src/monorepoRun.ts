import { newKitFromWeb3 } from '@celo/contractkit'
import Web3 from 'web3'
import { loadFromEnvFile } from './env'
import { rootLogger } from './logger'
import { clearAllFundsToRoot, StableTokenToRegistryName } from './scaffold'
// import { runExchangeTest } from './tests/exchange'
import { runTransfersTest } from './tests/transfer'
// import { runReserveTest } from './tests/reserve'
// import { runAttestationTest } from './tests/attestation'
// import { runOracleTest } from './tests/oracle'

jest.setTimeout(120000)
function runTests() {
  const envName = loadFromEnvFile()

  if (!process.env.MNEMONIC) {
    throw new Error('No MNEMONIC was set, envName was parsed as ' + envName)
  }
  const kit = newKitFromWeb3(new Web3(process.env.CELO_PROVIDER || 'http://localhost:8545'))
  const mnemonic = process.env.MNEMONIC!
  const reserveSpenderMultiSigAddress = process.env.RESERVE_SPENDER_MULTISIG_ADDRESS

  const defaultTokensToTest = ['CUSD']
  let stableTokensToTest: string[]
  if (!process.env.STABLETOKENS) {
    stableTokensToTest = defaultTokensToTest
  } else {
    const tokens = process.env.STABLETOKENS.split(',').map((t) => t.toUpperCase())
    for (let token of tokens) {
      if (!StableTokenToRegistryName[token]) {
        throw new Error(`Invalid token: ${token}`)
      }
    }
    stableTokensToTest = tokens
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
    runTransfersTest(context)
    // runExchangeTest(context)
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
