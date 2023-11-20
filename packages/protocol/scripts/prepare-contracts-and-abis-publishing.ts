import * as child_process from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { sync as rmrfSync } from 'rimraf'
import { MENTO_PACKAGE, SOLIDITY_08_PACKAGE } from '../contractPackages'
import {
  ABIS_BUILD_DIR,
  ABIS_PACKAGE_SRC_DIR,
  BUILD_EXECUTABLE,
  CONTRACTS_PACKAGE_SRC_DIR,
  CoreContracts,
  TSCONFIG_PATH,
} from './consts'

function log(...args: any[]) {
  // tslint:disable-next-line
  console.log('[prepare-contracts-and-abis]', ...args)
}

try {
  log('Setting package.json target to ES2020')
  const tsconfig = JSON.parse(fs.readFileSync(TSCONFIG_PATH, 'utf8'))
  tsconfig.compilerOptions.target = 'ES2020'
  fs.writeFileSync(TSCONFIG_PATH, JSON.stringify(tsconfig, null, 4))

  // Start from scratch
  rmrfSync([ABIS_BUILD_DIR, path.join(ABIS_PACKAGE_SRC_DIR, 'lib')])
  fs.mkdirSync(ABIS_BUILD_DIR, { recursive: true })

  // Generate all ABIs
  build(`--solidity ${path.join(ABIS_BUILD_DIR)}`)

  // Generate ethers typings
  build(`--ethersTypes ${path.join(ABIS_BUILD_DIR, 'ethers')}`)

  // Generate web3 typings
  build(`--web3Types ${path.join(ABIS_BUILD_DIR, 'web3')}`)

  // Merge contracts-0.8, contracts-mento, etc.. at the root of the build dir
  log('Merging files at the root of the build dir')
  for (const folder of [
    'contracts',
    `contracts-${MENTO_PACKAGE.name}`,
    `contracts-${SOLIDITY_08_PACKAGE.name}`,
  ]) {
    const mvCommand = `mv -f ${ABIS_BUILD_DIR}/${folder}/* ${ABIS_BUILD_DIR}`
    log(mvCommand)
    child_process.execSync(mvCommand)
  }

  // Remove Mocks, tests, extraneous files
  log('Deleting extraneous files')
  const allFiles = lsRecursive(ABIS_BUILD_DIR)
  allFiles.forEach((filePath) => {
    const name = path.basename(filePath)
    const baseName = name.replace(/.(sol|d.ts|json)$/, '')

    if (baseName !== 'index' && !CoreContracts.includes(baseName)) {
      rmrfSync(path.join(ABIS_BUILD_DIR, `${baseName}.json`))
      rmrfSync(path.join(ABIS_BUILD_DIR, `${baseName}.ts`))
      rmrfSync(path.join(ABIS_BUILD_DIR, '**', `${baseName}.d.ts`))
      rmrfSync(path.join(ABIS_BUILD_DIR, '**', `${baseName}.ts`))
    }
  })

  // Generate wagmi friendly ts files
  log('Running yarn wagmi generate')
  child_process.execSync(`yarn wagmi generate`, { stdio: 'inherit' })

  // Generate an index.ts to be esm friendly
  log('Generate index.ts from `CoreContracts`')
  fs.writeFileSync(
    path.join(ABIS_BUILD_DIR, 'index.ts'),
    '// This is a generated file, do not modify\n' +
      [...new Set(CoreContracts)]
        .map((contract) => {
          return `export * as ${contract} from './${contract}';`
        })
        .join('\n')
  )

  // Generate the js folder to be published from ts files
  log('Running tsc -b ')
  child_process.execSync(`yarn tsc -b ${path.join(ABIS_PACKAGE_SRC_DIR, 'tsconfig.json')}`, {
    stdio: 'inherit',
  })
  child_process.execSync(`yarn tsc -b ${path.join(ABIS_PACKAGE_SRC_DIR, 'tsconfig-cjs.json')}`, {
    stdio: 'inherit',
  })

  // Change the packages version to what CI is providing from environment variables
  const packageJsons = [
    path.join(CONTRACTS_PACKAGE_SRC_DIR, 'package.json'),
    path.join(ABIS_PACKAGE_SRC_DIR, 'package.json'),
  ]
  packageJsons.forEach((packageJsonPath) => {
    const file = fs.readFileSync(packageJsonPath).toString()

    if (process.env.RELEASE_VERSION) {
      fs.writeFileSync(
        packageJsonPath,
        file.replace('0.0.0-template.version', process.env.RELEASE_VERSION)
      )
    }
  })
} finally {
  // Cleanup
  log('Cleaning up folders and checking out dirty git files')
  rmrfSync(`rm -rf ${ABIS_BUILD_DIR}/contracts*`)
  rmrfSync(`rm -rf ${ABIS_BUILD_DIR}/truffle*`)
  child_process.execSync(`git checkout ${TSCONFIG_PATH}`, { stdio: 'inherit' })
}

// Helper functions
function lsRecursive(dir: string): string[] {
  const filesAndDirectories = fs.readdirSync(dir, { withFileTypes: true })
  return filesAndDirectories.reduce((fileNames, fileOrDir) => {
    const filePath = path.join(dir, fileOrDir.name)
    if (fileOrDir.isDirectory()) {
      return fileNames.concat(lsRecursive(filePath))
    }
    return fileNames.concat(...[filePath])
  }, [] as string[])
}

function build(cmd: string) {
  log(`Running build for ${cmd}`)
  child_process.execSync(
    `BUILD_DIR=./build/abis/src ts-node ${BUILD_EXECUTABLE} --coreContractsOnly ${cmd}`,
    { stdio: 'inherit' }
  )
}
