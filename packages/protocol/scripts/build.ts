/* tslint:disable no-console */

import Web3V1Celo from '@celo/typechain-target-web3-v1-celo'
import { execSync } from 'child_process'
import { existsSync, readJSONSync } from 'fs-extra'
import minimist, { ParsedArgs } from 'minimist'
import path from 'path'
import { tsGenerator } from 'ts-generator'
import { MENTO_PACKAGE, SOLIDITY_08_PACKAGE } from '../contractPackages'

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
  'FederatedAttestationsProxy',
  'FeeHandlerProxy',
  'MentoFeeHandlerSellerProxy',
  'FeeCurrencyWhitelistProxy',
  'GoldTokenProxy',
  'GovernanceApproverMultiSigProxy',
  'GovernanceProxy',
  'LockedGoldProxy',
  'MetaTransactionWalletProxy',
  'MetaTransactionWalletDeployerProxy',
  'OdisPaymentsProxy',
  'RegistryProxy',
  'SortedOraclesProxy',
  'UniswapFeeHandlerSellerProxy',
]

export const CoreContracts = [
  // common
  'Accounts',
  'GasPriceMinimum',
  'FeeHandler',
  'MentoFeeHandlerSeller',
  'UniswapFeeHandlerSeller',
  'FeeCurrencyWhitelist',
  'GoldToken',
  'MetaTransactionWallet',
  'MetaTransactionWalletDeployer',
  'MultiSig',
  'Registry',
  'Freezer',
  'MetaTransactionWallet',

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

  // stability
  'SortedOracles',
]

const OtherContracts = [
  'Proxy',
  'Migrations',
  // abstract
  'Initializable',
  'UsingRegistry',
]

const contractPackages = [MENTO_PACKAGE, SOLIDITY_08_PACKAGE]

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

  // the reason to generate a different folder is to avoid path collisions, which could be very dangerous
  for (const contractPackage of contractPackages) {
    console.log(`Building Contracts for package ${contractPackage.name}`)

    const contractPath = path.join(
      './',
      contractPackage.folderPath,
      contractPackage.path,
      contractPackage.contracstFolder
    )
    if (!existsSync(contractPath)) {
      console.log(`Contract package named ${contractPackage.name} doesn't exist`)
      continue
    }

    exec(
      `yarn run truffle compile --silent --contracts_directory=${contractPath} --contracts_build_directory=${outdir}/contracts-${contractPackage.name} --config ${contractPackage.truffleConfig}` // todo change to outdir
    )
  }

  // compile everything else
  exec(
    `yarn run --silent truffle compile --contracts_directory="./contracts/" --build_directory=${outdir}`
  )

  // check that there were no errors
  for (const contractName of ImplContracts) {
    try {
      // This is issuing a warning: https://github.com/celo-org/celo-monorepo/issues/10564
      const fileStr = readJSONSync(`${outdir}/contracts/${contractName}.json`)
      if (hasEmptyBytecode(fileStr)) {
        console.error(
          `${contractName} has empty bytecode. Maybe you forgot to fully implement an interface?`
        )
        process.exit(1)
      }
    } catch (e) {
      console.log(e)
      console.debug(
        `WARNING: ${contractName} artifact could not be fetched. Maybe it doesn't exist?`
      )
    }
  }
}

function generateFilesForTruffle(outdir: string) {
  // tslint:disable-next-line
  for (let externalContractPackage of contractPackages) {
    const outdirExternal = outdir + '-' + externalContractPackage.name
    console.log(
      `protocol: Generating Truffle Types for external dependency ${externalContractPackage.name} to ${outdirExternal}`
    )

    const artifactPath = `${BUILD_DIR}/contracts-${externalContractPackage.name}/*.json`
    exec(
      `yarn run --silent typechain --target=truffle --outDir "${outdirExternal}" "${artifactPath}"`
    )
  }

  console.log(`protocol: Generating Truffle Types to ${outdir}`)
  exec(`rm -rf "${outdir}"`)
  const globPattern = `${BUILD_DIR}/contracts/*.json`
  exec(`yarn run --silent typechain --target=truffle --outDir "${outdir}" "${globPattern}"`)
}

async function generateFilesForContractKit(outdir: string) {
  console.log(`protocol: Generating Web3 Types to ${outdir}`)
  exec(`rm -rf ${outdir}`)
  const relativePath = path.relative(ROOT_DIR, outdir)

  const contractKitContracts = CoreContracts.concat('Proxy').concat(Interfaces)

  const globPattern = `${BUILD_DIR}/contracts/@(${contractKitContracts.join('|')}).json`

  const cwd = process.cwd()

  await tsGenerator(
    { cwd, loggingLvl: 'info' },
    new Web3V1Celo({
      cwd,
      rawConfig: {
        files: globPattern,
        outDir: relativePath,
      },
    })
  )

  for (const externalContractPackage of contractPackages) {
    await tsGenerator(
      { cwd, loggingLvl: 'info' },
      new Web3V1Celo({
        cwd,
        rawConfig: {
          files: `${BUILD_DIR}/contracts-${
            externalContractPackage.name
          }/@(${externalContractPackage.contracts.join('|')}).json`,
          outDir: path.join(relativePath, externalContractPackage.name),
        },
      })
    )
  }

  exec(`yarn prettier --write "${outdir}/**/*.ts"`)
}

const _buildTargets: ParsedArgs = {
  _: [],
  solidity: undefined,
  truffleTypes: undefined,
  web3Types: undefined,
}

async function main(buildTargets: ParsedArgs) {
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

const argv = minimist(process.argv.slice(2), {
  string: Object.keys(_buildTargets),
})

main(argv).catch((err) => {
  console.error(err)
  process.exit(1)
})
