/* tslint:disable no-console */

import Web3V1Celo from '@celo/typechain-target-web3-v1-celo'
import { execSync } from 'child_process'
import { readJSONSync } from 'fs-extra'
import path from 'path'
import { tsGenerator } from 'ts-generator'
import { MENTO_PACKAGE } from '../contractPackages'

const fs = require('fs')
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
  'GasPriceMinimumProxy',
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
  'UniswapFeeHandlerSellerProxy',
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

const externalContractPackages = [MENTO_PACKAGE]

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
  for (const externalContractPackage of externalContractPackages) {
    console.log(`Building external contracts for ${externalContractPackage.name}`)
    exec(
      `yarn run truffle compile --silent --contracts_directory=./lib/${externalContractPackage.path}/contracts --contracts_build_directory=./build/contracts-${externalContractPackage.name}` // todo change to outdir
    )
  }

  // compile 0.8 contracts
  const contracts08 = `./contracts-0.8`
  console.log(contracts08)
  if (fs.existsSync(contracts08)) {
    // fs.mkdirSync(contracts08)

    console.log(`Building contracts using 0.8`)
    exec(
      `yarn run truffle compile  --contracts_directory="./contracts-0.8" --contracts_build_directory=${outdir}/contracts-0.8 --config truffle-config0.8.js`
    )
  } else {
    console.log("0.8 folder doesn't exist")
  }

  // compile everything else
  exec(`yarn run --silent truffle compile --build_directory=${outdir}`)

  for (const contractName of ImplContracts) {
    try {
      // TODO FIX warning Error: ./build/contracts/GasPriceMinimum.json: ENOENT: no such file or directory, open './build/contracts/GasPriceMinimum.json'
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
  for (let externalContractPackage of externalContractPackages) {
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

  const outdir08 = `./types/typechain-0.8`
  // const artifactPath08 = 'contracts-0.8'
  const artifactPath08 = `${BUILD_DIR}/contracts-0.8/*.json`
  console.log(`protocol: Generating Truffle Types using Solidity 0.8 to ${outdir08}`)
  exec(`yarn run --silent typechain --target=truffle --outDir "${outdir08}" "${artifactPath08}"`)
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

  for (const externalContractPackage of externalContractPackages) {
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
