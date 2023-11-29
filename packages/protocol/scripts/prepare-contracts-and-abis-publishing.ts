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
  Interfaces,
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
  build(`--ethersTypes ${path.join(ABIS_BUILD_DIR, 'types/ethers')}`)

  // Generate web3 typings
  // TODO web3 is generating nested dir structure
  build(`--web3Types ${path.join(ABIS_BUILD_DIR, 'types/web3')}`)

  // Merge contracts-0.8, contracts-mento, etc.. at the root of the build dir
  log('Merging files at the root of the build dir')
  mergeFromFolder(
    ['contracts', `contracts-${MENTO_PACKAGE.name}`, `contracts-${SOLIDITY_08_PACKAGE.name}`],
    path.join(ABIS_BUILD_DIR)
  )

  log('Merging files in web3 folder')
  mergeFromFolder(
    [`${MENTO_PACKAGE.name}`, `${SOLIDITY_08_PACKAGE.name}`],
    path.join(ABIS_BUILD_DIR, 'types/web3')
  )

  // Remove Mocks, tests, extraneous files
  log('Deleting extraneous files')
  const allFiles = lsRecursive(ABIS_BUILD_DIR)
  allFiles.forEach((filePath) => {
    const name = path.basename(filePath)
    const baseName = name.replace(/.(sol|d.ts|json)$/, '')

    if (
      baseName !== 'index' &&
      baseName !== 'Proxy' &&
      !CoreContracts.includes(baseName) &&
      !Interfaces.includes(baseName)
    ) {
      rmrfSync(path.join(ABIS_BUILD_DIR, `${baseName}.json`))
      rmrfSync(path.join(ABIS_BUILD_DIR, `${baseName}.ts`))
      rmrfSync(path.join(ABIS_BUILD_DIR, '**', `${baseName}.d.ts`))
      rmrfSync(path.join(ABIS_BUILD_DIR, '**', `${baseName}.ts`))
    }
  })

  // Generate wagmi friendly ts files
  log('Running yarn wagmi generate')
  child_process.execSync(`yarn wagmi generate`, { stdio: 'inherit' })

  fs.copyFileSync(
    path.join(ABIS_PACKAGE_SRC_DIR, 'README.md'),
    path.join(ABIS_BUILD_DIR, 'README.md')
  )

  // Change the packages version to what CI is providing from environment variables
  prepareAbisPackageJson()
  prepareContractsPackageJson()
} finally {
  // Cleanup
  log('Cleaning up folders and checking out dirty git files')
  rmrfSync(`rm -rf ${ABIS_BUILD_DIR}/contracts*`)
  rmrfSync(`rm -rf ${ABIS_BUILD_DIR}/truffle*`)
  child_process.execSync(`git checkout ${TSCONFIG_PATH}`, { stdio: 'inherit' })
}

// Helper functions
function prepareAbisPackageJson() {
  log('Preparing @celo/abis package.json')
  const sourcePackageJson = path.join(ABIS_PACKAGE_SRC_DIR, 'package.json.dist')
  const destinationPackageJson = path.join(ABIS_BUILD_DIR, 'package.json')
  let contents = fs.readFileSync(sourcePackageJson).toString()

  if (process.env.RELEASE_VERSION) {
    log('Replacing @celo/abis version with provided RELEASE_VERSION')

    contents = contents.replace('0.0.0-template.version', process.env.RELEASE_VERSION)
  } else {
    log('No RELEASE_VERSION provided')
  }

  fs.writeFileSync(destinationPackageJson, contents)
}

function prepareContractsPackageJson() {
  if (process.env.RELEASE_VERSION) {
    log('Replacing @celo/contracts version with RELEASE_VERSION)')
    const contractsPackageJsonPath = path.join(CONTRACTS_PACKAGE_SRC_DIR, 'package.json')
    const contents = fs.readFileSync(contractsPackageJsonPath).toString()

    fs.writeFileSync(
      contractsPackageJsonPath,
      contents.replace('0.0.0-template.version', process.env.RELEASE_VERSION)
    )

    return
  }

  log('Skipping @celo/contracts package.json preparation (no RELEASE_VERSION provided)')
}

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
  child_process.execSync(`BUILD_DIR=./build ts-node ${BUILD_EXECUTABLE} ${cmd}`, {
    stdio: 'inherit',
  })
}

function mergeFromFolder(folderNames: string[], rootFolderName: string) {
  for (const folderName of folderNames) {
    const mvCommand = `mv -f ${rootFolderName}/${folderName}/* ${rootFolderName}`
    const rmCommand = `rm -r ${rootFolderName}/${folderName}`

    log(mvCommand)
    child_process.execSync(mvCommand)

    // Once copied all the files, remove the folder
    log(rmCommand)
    child_process.execSync(rmCommand)
  }
}
