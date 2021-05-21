/* tslint:disable no-console */
import Web3V1Celo from '@celo/typechain-target-web3-v1-celo'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { tsGenerator } from 'ts-generator'

const ROOT_DIR = path.normalize(path.join(__dirname, '../'))
const BUILD_DIR = path.join(ROOT_DIR, 'build')
const CONTRACTKIT_GEN_DIR = path.normalize(path.join(ROOT_DIR, '../sdk/contractkit/src/generated'))

export const ProxyContracts = [
  'AccountsProxy',
  'AttestationsProxy',
  'BlockchainParametersProxy',
  'DoubleSigningSlasherProxy',
  'DowntimeSlasherProxy',
  'ElectionProxy',
  'EpochRewardsProxy',
  'EscrowProxy',
  'ExchangeEURProxy',
  'ExchangeProxy',
  'FeeCurrencyWhitelistProxy',
  'GasPriceMinimumProxy',
  'GoldTokenProxy',
  'GovernanceApproverMultiSigProxy',
  'GovernanceProxy',
  'LockedGoldProxy',
  'MetaTransactionWalletProxy',
  'MetaTransactionWalletDeployerProxy',
  'RegistryProxy',
  'ReserveProxy',
  'ReserveSpenderMultiSigProxy',
  'StableTokenEURProxy',
  'StableTokenProxy',
  'SortedOraclesProxy',
]
export const CoreContracts = [
  // common
  'Accounts',
  'GasPriceMinimum',
  'FeeCurrencyWhitelist',
  'GoldToken',
  'MetaTransactionWallet',
  'MetaTransactionWalletDeployer',
  'MultiSig',
  'Registry',
  'Freezer',
  'MetaTransactionWallet',
  'TransferWhitelist',

  // governance
  'Election',
  'EpochRewards',
  'Governance',
  'GovernanceApproverMultiSig',
  'BlockchainParameters',
  'DoubleSigningSlasher',
  'DowntimeSlasher',
  'LockedGold',
  'Validators',
  'ReleaseGold',

  // identity
  'Attestations',
  'Escrow',
  'Random',

  // stability
  'Exchange',
  'ExchangeEUR',
  'Reserve',
  'ReserveSpenderMultiSig',
  'StableToken',
  'StableTokenEUR',
  'SortedOracles',
]

const OtherContracts = [
  'Proxy',
  'Migrations',
  // abstract
  'Initializable',
  'UsingRegistry',
]

const Interfaces = ['ICeloToken', 'IERC20', 'ICeloVersionedContract']

export const ImplContracts = OtherContracts.concat(ProxyContracts).concat(CoreContracts)

function getArtifact(contractName: string) {
  const file = fs.readFileSync(`${BUILD_DIR}/contracts/${contractName}.json`).toString()
  return JSON.parse(file)
}

function exec(cmd: string) {
  return execSync(cmd, { cwd: ROOT_DIR, stdio: 'inherit' })
}

function hasEmptyBytecode(contract: any) {
  return contract.bytecode === '0x'
}

function compile() {
  console.log('Compiling')

  exec(`yarn run --silent truffle compile --build_directory=${BUILD_DIR}`)

  for (const contractName of ImplContracts) {
    try {
      const fileStr = getArtifact(contractName)
      if (hasEmptyBytecode(fileStr)) {
        console.error(
          `${contractName} has empty bytecode. Maybe you forgot to fully implement an interface?`
        )
        process.exit(1)
      }
    } catch (e) {
      console.debug(
        `WARNING: ${contractName} artifact could not be fetched. Maybe it doesn't exist?`
      )
    }
  }
}

function generateFilesForTruffle() {
  console.log('protocol: Generating Truffle Types')
  exec(`rm -rf "${ROOT_DIR}/typechain"`)

  const globPattern = `${BUILD_DIR}/contracts/*.json`
  exec(
    `yarn run --silent typechain --target=truffle --outDir "./types/typechain" "${globPattern}" `
  )
}

async function generateFilesForContractKit() {
  console.log('contractkit: Generating Types')
  exec(`rm -rf ${CONTRACTKIT_GEN_DIR}`)
  const relativePath = path.relative(ROOT_DIR, CONTRACTKIT_GEN_DIR)

  const contractKitContracts = CoreContracts.concat('Proxy').concat(Interfaces)

  const globPattern = `${BUILD_DIR}/contracts/@(${contractKitContracts.join('|')}).json`

  const cwd = process.cwd()

  const web3Generator = new Web3V1Celo({
    cwd,
    rawConfig: {
      files: globPattern,
      outDir: relativePath,
    },
  })

  await tsGenerator({ cwd, loggingLvl: 'info' }, web3Generator)

  exec(`yarn --cwd "${ROOT_DIR}/../.." prettier --write "${CONTRACTKIT_GEN_DIR}/**/*.ts"`)
}

async function main() {
  compile()
  generateFilesForTruffle()
  await generateFilesForContractKit()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
