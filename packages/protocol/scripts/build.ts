/* tslint:disable no-console */

import Web3V1Celo from '@celo/typechain-target-web3-v1-celo'
import { execSync } from 'child_process'
import fsExtraPkg from 'fs-extra'
import minimist, { ParsedArgs } from 'minimist'
import path from 'path'
import { tsGenerator } from 'ts-generator'
import { contractPackages, CoreContracts, ImplContracts, Interfaces, ROOT_DIR } from './consts'

const { existsSync, readJSONSync } = fsExtraPkg

const BUILD_DIR = path.join(ROOT_DIR, process.env.BUILD_DIR ?? './build')

function exec(cmd: string) {
  return execSync(cmd, { cwd: ROOT_DIR, stdio: 'inherit' })
}

function hasEmptyBytecode(contract: any) {
  return contract.bytecode === '0x'
}

function compile({ coreContractsOnly, solidity: outdir }: BuildTargets) {
  console.info(`protocol: Compiling solidity to ${outdir}`)

  // the reason to generate a different folder is to avoid path collisions, which could be very dangerous
  for (const contractPackage of contractPackages) {
    console.info(`Building Contracts for package ${contractPackage.name}`)

    const contractPath = path.join(
      './',
      contractPackage.folderPath,
      contractPackage.path,
      contractPackage.contractsFolder
    )
    if (!existsSync(contractPath)) {
      console.info(`Contract package named ${contractPackage.name} doesn't exist`)
      continue
    }

    exec(
      `yarn run truffle compile --silent --contracts_directory=${contractPath} --contracts_build_directory=${outdir}/contracts-${contractPackage.name} --config ${contractPackage.truffleConfig}` // todo change to outdir
    )
  }

  // compile everything else
  try {
    exec(
      `yarn run --silent truffle compile --contracts_directory="./contracts/" --build_directory=${outdir}`
    )
  } catch (e) {
    console.error(e)
    console.info(
      `

    If error is something like "using solc 0.5.13, but  specify "pragma solidity >=0.8.7 <0.8.20".
    Then try to delete the 0.8 folder inside of contracts folder (not the contracts-0.8 folder)

    `
    )
    process.exit(1)
  }

  const contracts = coreContractsOnly ? CoreContracts : ImplContracts
  // check that there were no errors
  for (const contractName of contracts) {
    try {
      const artifactPath = `${outdir}/contracts/${contractName}.json`
      const artifactPath8 = `${outdir}/contracts-0.8/${contractName}.json`
      let is08 = false
      // This is issuing a warning: https://github.com/celo-org/celo-monorepo/issues/10564
      if (existsSync(artifactPath8)) {
        is08 = true
      }
      const fileStr = readJSONSync(is08 ? artifactPath8 : artifactPath)
      if (hasEmptyBytecode(fileStr)) {
        console.error(
          `${contractName} has empty bytecode. Maybe you forgot to fully implement an interface?`
        )
        process.exit(1)
      }
    } catch (e) {
      console.info(e)
      console.debug(
        `WARNING: ${contractName} artifact could not be fetched. Maybe it doesn't exist?`
      )
    }
  }
}

function generateFilesForTruffle({ coreContractsOnly, truffleTypes: outdir }: BuildTargets) {
  // eslint-disable-next-line
  for (let externalContractPackage of contractPackages) {
    const outdirExternal = outdir + '-' + externalContractPackage.name
    console.info(
      `protocol: Generating Truffle Types for external dependency ${externalContractPackage.name} to ${outdirExternal}`
    )

    const artifactPath = `${BUILD_DIR}/contracts-${externalContractPackage.name}/*.json`
    exec(
      `yarn run --silent typechain --target=truffle --outDir "${outdirExternal}" "${artifactPath}"`
    )
  }

  console.info(`protocol: Generating Truffle Types to ${outdir}`)
  exec(`rm -rf "${outdir}"`)

  const globPattern = coreContractsOnly
    ? `${BUILD_DIR}/contracts/@(${CoreContracts.join('|')}).json`
    : `${BUILD_DIR}/contracts/*.json`

  exec(`yarn run --silent typechain --target=truffle --outDir "${outdir}" "${globPattern}"`)
}

function generateFilesForEthers({ coreContractsOnly, ethersTypes: outdir }: BuildTargets) {
  console.info(`protocol: Generating Ethers Types to ${outdir}`)
  exec(`rm -rf "${outdir}"`)

  const contractKitContracts = coreContractsOnly
    ? CoreContracts
    : CoreContracts.concat('Proxy').concat(Interfaces)
  const globPattern = `${BUILD_DIR}/contracts/@(${contractKitContracts.join('|')}).json`

  exec(`yarn run --silent typechain --target=ethers-v5 --outDir "${outdir}" "${globPattern}"`)
}

async function generateFilesForContractKit({ coreContractsOnly, web3Types: outdir }: BuildTargets) {
  console.info(`protocol: Generating Web3 Types to ${outdir}`)
  exec(`rm -rf ${outdir}`)
  const relativePath = path.relative(ROOT_DIR, outdir)

  const contractKitContracts = coreContractsOnly
    ? CoreContracts
    : CoreContracts.concat('Proxy').concat(Interfaces)

  const globPattern = `${BUILD_DIR}/contracts*/@(${contractKitContracts.join('|')}).json`

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
  _: [] as string[],
  solidity: undefined,
  truffleTypes: undefined,
  web3Types: undefined,
  ethersTypes: undefined,
} as const
type BuildTargets = Record<keyof typeof _buildTargets, string> & {
  coreContractsOnly: boolean
}

async function main(buildTargets: BuildTargets) {
  if (buildTargets.solidity) {
    compile(buildTargets)
  }
  if (buildTargets.truffleTypes) {
    generateFilesForTruffle(buildTargets)
  }
  if (buildTargets.ethersTypes) {
    generateFilesForEthers(buildTargets)
  }
  if (buildTargets.web3Types) {
    await generateFilesForContractKit(buildTargets)
  }
}

const argv = minimist(process.argv.slice(2), {
  string: Object.keys(_buildTargets),
  boolean: ['coreContractsOnly'],
}) as unknown as BuildTargets

main(argv).catch((err) => {
  console.error(err)
  process.exit(1)
})
