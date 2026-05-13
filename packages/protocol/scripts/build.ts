/* tslint:disable no-console */

import Web3V1Celo from '@celo/typechain-target-web3-v1-celo'
import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import minimist, { ParsedArgs } from 'minimist'
import path from 'path'
import { tsGenerator } from 'ts-generator'
import { CoreContracts, ImplContracts, Interfaces, ROOT_DIR } from './consts'

const readJSON = (file: string) => JSON.parse(readFileSync(file, 'utf-8'))

const FOUNDRY_OUT_05 = 'out-truffle-compat'
const FOUNDRY_OUT_08 = 'out-truffle-compat-0.8'

function exec(cmd: string) {
  return execSync(cmd, { cwd: ROOT_DIR, stdio: 'inherit' })
}

function hasEmptyBytecode(contract: any) {
  const bytecode =
    typeof contract.bytecode === 'string' ? contract.bytecode : contract.bytecode?.object
  return !bytecode || bytecode === '0x'
}

function compile({ coreContractsOnly }: BuildTargets) {
  console.info(`protocol: Compiling solidity with foundry (truffle-compat profiles)`)

  exec(`FOUNDRY_PROFILE=truffle-compat forge build`)
  exec(`FOUNDRY_PROFILE=truffle-compat8 forge build`)

  const contracts = coreContractsOnly ? CoreContracts : ImplContracts
  for (const contractName of contracts) {
    try {
      const artifactPath05 = path.join(
        ROOT_DIR,
        FOUNDRY_OUT_05,
        `${contractName}.sol`,
        `${contractName}.json`
      )
      const artifactPath08 = path.join(
        ROOT_DIR,
        FOUNDRY_OUT_08,
        `${contractName}.sol`,
        `${contractName}.json`
      )
      const artifactPath = existsSync(artifactPath08) ? artifactPath08 : artifactPath05
      if (!existsSync(artifactPath)) {
        console.debug(
          `WARNING: ${contractName} artifact could not be fetched. Maybe it doesn't exist?`
        )
        continue
      }
      const artifact = readJSON(artifactPath)
      if (hasEmptyBytecode(artifact)) {
        console.error(
          `${contractName} has empty bytecode. Maybe you forgot to fully implement an interface?`
        )
        process.exit(1)
      }
    } catch (e) {
      console.info(e)
      console.debug(`WARNING: failed to inspect artifact for ${contractName}`)
    }
  }
}

function getContractList(coreContractsOnly: boolean) {
  return coreContractsOnly ? CoreContracts : [...CoreContracts, 'Proxy', ...Interfaces]
}

function foundryGlobs(contractList: string[]): string[] {
  const alternation = contractList.join('|')
  return [FOUNDRY_OUT_05, FOUNDRY_OUT_08].map(
    (dir) => `${dir}/@(${alternation}).sol/@(${alternation}).json`
  )
}

function generateFilesForEthers({ coreContractsOnly, ethersTypes: outdir }: BuildTargets) {
  console.info(`protocol: Generating Ethers Types to ${outdir}`)
  exec(`rm -rf "${outdir}"`)

  const globs = foundryGlobs(getContractList(coreContractsOnly))
    .map((g) => `"${g}"`)
    .join(' ')
  exec(`yarn run --silent typechain --target=ethers-v5 --outDir "${outdir}" ${globs}`)
}

async function generateFilesForContractKit({ coreContractsOnly, web3Types: outdir }: BuildTargets) {
  console.info(`protocol: Generating Web3 Types to ${outdir}`)
  exec(`rm -rf ${outdir}`)
  const relativePath = path.relative(ROOT_DIR, outdir)

  const cwd = process.cwd()

  for (const glob of foundryGlobs(getContractList(coreContractsOnly))) {
    await tsGenerator(
      { cwd, loggingLvl: 'info' },
      new Web3V1Celo({
        cwd,
        rawConfig: {
          files: glob,
          outDir: relativePath,
        },
      })
    )
  }

  exec(`yarn prettier --write "${outdir}/**/*.ts"`)
}

const _buildTargets: ParsedArgs = {
  _: [] as string[],
  solidity: undefined,
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
