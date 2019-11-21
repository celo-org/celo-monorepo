/* tslint:disable no-console */
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const ROOT_DIR = path.normalize(path.join(__dirname, '../'))
const BUILD_DIR = path.join(ROOT_DIR, 'build')
const CONTRACTKIT_GEN_DIR = path.normalize(path.join(ROOT_DIR, '../contractkit/src/generated'))

export const ProxyContracts = [
  'AccountsProxy',
  'AttestationsProxy',
  'ElectionProxy',
  'EpochRewardsProxy',
  'EscrowProxy',
  'ExchangeProxy',
  'FeeCurrencyWhitelistProxy',
  'GasPriceMinimumProxy',
  'GoldTokenProxy',
  'LockedGoldProxy',
  'MultiSigProxy',
  'ReserveProxy',
  'StableTokenProxy',
  'SortedOraclesProxy',
  'GovernanceProxy',
  'RegistryProxy',
  'BlockchainParametersProxy',
]
export const CoreContracts = [
  // common
  'Accounts',
  'GasPriceMinimum',
  'FeeCurrencyWhitelist',
  'GoldToken',
  'MultiSig',
  'Registry',

  // governance
  'Election',
  'EpochRewards',
  'Governance',
  'BlockchainParameters',
  'LockedGold',
  'Validators',

  // identity
  'Attestations',
  'Escrow',
  'Random',

  // stability
  'Exchange',
  'Reserve',
  'StableToken',
  'SortedOracles',
]

const OtherContracts = [
  'Proxy',
  'Migrations',
  // abstract
  'Initializable',
  'UsingRegistry',
]
export const ImplContracts = OtherContracts.concat(ProxyContracts).concat(CoreContracts)

// const TruffleTestContracts = ['Ownable'].concat(OtherContracts).concat(CoreContracts)

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
    const fileStr = getArtifact(contractName)
    if (hasEmptyBytecode(fileStr)) {
      console.error(
        `${contractName} has empty bytecode. Maybe you forgot to fully implement an interface?`
      )
      process.exit(1)
    }
  }
}

function generateFilesForTruffle() {
  console.log('protocol: Generating Truffle Types')
  exec(`rm -rf "${ROOT_DIR}/typechain"`)

  // const globPattern = `${BUILD_DIR}/contracts/@(${TruffleTestContracts.join('|')}).json`
  const globPattern = `${BUILD_DIR}/contracts/*.json`
  exec(
    `yarn run --silent typechain --target=truffle --outDir "./types/typechain" "${globPattern}" `
  )
}

function generateFilesForContractKit() {
  console.log('contractkit: Generating Types')
  exec(`rm -rf ${CONTRACTKIT_GEN_DIR}`)
  const relativePath = path.relative(ROOT_DIR, CONTRACTKIT_GEN_DIR)

  const globPattern = `${BUILD_DIR}/contracts/@(${CoreContracts.join('|')}).json`
  exec(
    `yarn run --silent typechain --target="web3-1.0.0" --outDir "${relativePath}/types" "${globPattern}" `
  )

  console.log('contractkit: Generating Contract Factories')
  for (const contractName of CoreContracts) {
    const contract = getArtifact(contractName)
    writeContractFactoryFile(relativePath, contractName, contract.abi)
  }

  exec(`yarn --cwd "${ROOT_DIR}/../.." prettier --write "${CONTRACTKIT_GEN_DIR}/**/*.ts"`)
}

function writeContractFactoryFile(outputDir: string, contractName: string, abi: any[]) {
  const contents = [
    "import Web3 from 'web3'",
    `import { ${contractName} } from './types/${contractName}'`,
    `export const ABI = ${JSON.stringify(abi)}`,
    ``,
    `export function new${contractName}(web3: Web3, address: string): ${contractName} {`,
    ' return new web3.eth.Contract(ABI, address) as any',
    '}',
  ].join('\n')
  fs.writeFileSync(path.join(outputDir, `${contractName}.ts`), contents)
}

async function main() {
  compile()
  generateFilesForTruffle()
  generateFilesForContractKit()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
