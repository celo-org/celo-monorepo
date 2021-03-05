import { newKitFromWeb3 } from '@celo/contractkit'
import Web3 from 'web3'
import { loadFromEnvFile } from './env'
import { rootLogger } from './logger'
import { clearAllFundsToRoot, StableTokenToRegistryName } from './scaffold'
import { runAttestationTest } from './tests/attestation'
import { runExchangeTest } from './tests/exchange'
import { runOracleTest } from './tests/oracle'
import { runReserveTest } from './tests/reserve'
import { runTransfersTest } from './tests/transfer'

const DEFAULT_TOKENS_TO_TEST = ['cUSD']

jest.setTimeout(120000)

function runTests() {
  const envName = loadFromEnvFile()

  if (!process.env.MNEMONIC) {
    throw new Error('No MNEMONIC was set, envName was parsed as ' + envName)
  }
  const kit = newKitFromWeb3(new Web3(process.env.CELO_PROVIDER || 'http://localhost:8545'))
  const mnemonic = process.env.MNEMONIC!
  const reserveSpenderMultiSigAddress = process.env.RESERVE_SPENDER_MULTISIG_ADDRESS

  const stableTokensToTest = process.env.STABLETOKENS
    ? process.env.STABLETOKENS.split(',')
    : DEFAULT_TOKENS_TO_TEST
  if (stableTokensToTest.find((token) => !StableTokenToRegistryName[token])) {
    throw new Error('Invalid token')
  }
  describe('Run tests in context of monorepo', () => {
    const context = {
      kit,
      mnemonic,
      logger: rootLogger,
      reserveSpenderMultiSigAddress,
    }

    // TODO: Assert maximum loss after test
    runTransfersTest(context, stableTokensToTest)
    runExchangeTest(context, stableTokensToTest)
    runOracleTest(context)
    runReserveTest(context)
    runAttestationTest(context)

    // TODO: Governance Proposals
    // TODO: Validator election + Slashing

    afterAll(async () => {
      await clearAllFundsToRoot(context, stableTokensToTest)
    })
  })
}

runTests()
