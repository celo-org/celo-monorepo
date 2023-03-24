/* tslint:disable no-console */
import Web3V1Celo from '@celo/typechain-target-web3-v1-celo'
import { execSync } from 'child_process'
import { readJSONSync } from 'fs-extra'
import path from 'path'
import { tsGenerator } from 'ts-generator'

const ROOT_DIR = path.normalize(path.join(__dirname, '../'))
const BUILD_DIR = path.join(ROOT_DIR, process.env.BUILD_DIR ?? './build')

export const ProxyContracts = [
  'AccountsProxy',
  'AttestationsProxy',
  'BlockchainParametersProxy',
  'DoubleSigningSlasherProxy',
  'DowntimeSlasherProxy',
  'ElectionProxy',
  'EpochRewardsProxy',
  'EscrowProxy',
  // 'ExchangeBRLProxy',
  // 'ExchangeEURProxy',
  // 'ExchangeProxy',
  'FederatedAttestationsProxy',
  'FeeBurnerProxy',
  'FeeCurrencyWhitelistProxy',
  'GasPriceMinimumProxy',
  'GoldTokenProxy',
  'GovernanceApproverMultiSigProxy',
  'GovernanceProxy',
  // 'GrandaMentoProxy',
  'LockedGoldProxy',
  'MetaTransactionWalletProxy',
  'MetaTransactionWalletDeployerProxy',
  'OdisPaymentsProxy',
  'RegistryProxy',
  // 'ReserveProxy',
  // 'ReserveSpenderMultiSigProxy',
  // 'StableTokenBRLProxy',
  // 'StableTokenEURProxy',
  // 'StableTokenProxy',
  'SortedOraclesProxy',
]
export const CoreContracts = [
  // common
  'Accounts',
  'GasPriceMinimum',
  'FeeBurner',
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
  'FederatedAttestations',
  'Random',
  'OdisPayments',

  'SortedOracles',
  // stability - Mento
  // 'Exchange',
  // 'ExchangeEUR',
  // 'ExchangeBRL',
  // 'Reserve',
  // 'ReserveSpenderMultiSig',
  // 'StableToken',
  // 'StableTokenEUR',
  // 'StableTokenBRL',

  // liquidity
  // 'GrandaMento',
]

const OtherContracts = [
  'Proxy',
  'Migrations',
  // abstract
  'Initializable',
  'UsingRegistry',

  // only used for testing
  'MockUniswapV2Router02',
  'MockUniswapV2Factory',
]

const externalContracts = ['mento']

const Interfaces = ['ICeloToken', 'IERC20', 'ICeloVersionedContract']

export const ImplContracts = OtherContracts.concat(ProxyContracts).concat(CoreContracts)

function exec(cmd: string) {
  return execSync(cmd, { cwd: ROOT_DIR, stdio: 'inherit' })
}

function hasEmptyBytecode(contract: any) {
  return contract.bytecode === '0x'
}

function compile(outdir: string) {
  console.log(`protocol: Compiling solidity to ${outdir}`)

  // Build dependencies first
  // TODO change paths
  // the reason to generate a different folder is to avoid paths for coliding, which could be very dangerous

  exec(
    `yarn run truffle compile --contracts_directory=./lib/mento-core/contracts --contracts_build_directory=./build/contracts-mento`
  )

  exec(`yarn run --silent truffle compile --build_directory=${outdir}`)

  for (const contractName of ImplContracts) {
    try {
      const fileStr = readJSONSync(`${outdir}/contracts/${contractName}.json`)
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

function generateFilesForTruffle(outdir: string) {
  // tslint:disable-next-line
  for (let externalContract of externalContracts) {
    const outdirExternal = outdir + '-' + externalContract
    console.log(
      `protocol: Generating Truffle Types for external dependency ${externalContract} to ${outdirExternal}`
    )
    const artifactPath = `${BUILD_DIR}/contracts-${externalContract}/*.json`
    exec(
      `yarn run --silent typechain --target=truffle --outDir "${outdirExternal}" "${artifactPath}" `
    )
  }

  console.log(`protocol: Generating Truffle Types to ${outdir}`)
  exec(`rm -rf "${outdir}"`)
  const globPattern = `${BUILD_DIR}/contracts/*.json`
  exec(`yarn run --silent typechain --target=truffle --outDir "${outdir}" "${globPattern}" `)
}

async function generateFilesForContractKit(outdir: string) {
  console.log(`protocol: Generating Web3 Types to ${outdir}`)
  exec(`rm -rf ${outdir}`)
  const relativePath = path.relative(ROOT_DIR, outdir)

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
  // tslint:disable-next-line
  for (let externalContract of externalContracts) {
    await tsGenerator(
      { cwd, loggingLvl: 'info' },
      new Web3V1Celo({
        cwd,
        rawConfig: {
          files: `${BUILD_DIR}/contracts-${externalContract}/@(${contractKitContracts.join(
            '|'
          )}).json`,
          outDir: relativePath, // TODO change web3 path
        },
      })
    )
  }

  exec(`yarn prettier --write "${outdir}/**/*.ts"`)
}

const _buildTargets = {
  solidity: undefined,
  truffleTypes: undefined,
  web3Types: undefined,
}

async function main(buildTargets: typeof _buildTargets) {
  if (buildTargets.solidity) {
    compile(buildTargets.solidity)
  }
  if (buildTargets.truffleTypes) {
    generateFilesForTruffle(buildTargets.truffleTypes)
  }
  if (buildTargets.web3Types) {
    await generateFilesForContractKit(buildTargets.web3Types)
  }
}

const minimist = require('minimist')
const argv = minimist(process.argv.slice(2), {
  string: Object.keys(_buildTargets),
})

main(argv).catch((err) => {
  console.error(err)
  process.exit(1)
})
