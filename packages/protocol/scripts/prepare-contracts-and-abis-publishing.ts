import * as child_process from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { sync as rmrfSync } from 'rimraf'
import { MENTO_PACKAGE, SOLIDITY_08_PACKAGE } from '../contractPackages'
import {
  ABIS_BUILD_DIR,
  ABIS_DIST_DIR,
  ABIS_PACKAGE_SRC_DIR,
  BUILD_EXECUTABLE,
  BuildTarget,
  CONTRACTS_PACKAGE_SRC_DIR,
  PublishContracts,
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
  rmrfSync([ABIS_BUILD_DIR, ABIS_DIST_DIR])
  fs.mkdirSync(ABIS_BUILD_DIR, { recursive: true })
  fs.mkdirSync(ABIS_DIST_DIR, { recursive: true })

  // Generate all ABIs
  build(`--solidity ${path.join(ABIS_BUILD_DIR)}`)

  // Generate ethers typings
  build(`--ethersTypes ${path.join(ABIS_BUILD_DIR, 'ethers')}`)

  // Generate web3 typings
  build(`--web3Types ${path.join(ABIS_BUILD_DIR, 'web3')}`)

  // Merge contracts-0.8, contracts-mento, etc.. at the root of the build dir
  log('Merging files at the root of the build dir')
  mergeFromFolder(
    ['contracts', `contracts-${MENTO_PACKAGE.name}`, `contracts-${SOLIDITY_08_PACKAGE.name}`],
    path.join(ABIS_BUILD_DIR)
  )

  // Remove Mocks, tests, extraneous files
  log('Deleting extraneous files')
  const allFiles = lsRecursive(ABIS_BUILD_DIR)
  allFiles.forEach((filePath) => {
    const name = path.basename(filePath)
    const baseName = name.replace(/.(sol|d.ts|json)$/, '')

    if (baseName !== 'index' && !PublishContracts.includes(baseName)) {
      rmrfSync(path.join(ABIS_BUILD_DIR, `${baseName}.json`))
      rmrfSync(path.join(ABIS_BUILD_DIR, `${baseName}.ts`))
      rmrfSync(path.join(ABIS_BUILD_DIR, '**', `${baseName}.d.ts`))
      rmrfSync(path.join(ABIS_BUILD_DIR, '**', `${baseName}.ts`))
    }
  })

  let exports = processRawJsonsAndPrepareExports()

  // Generate wagmi friendly ts files
  log('Running yarn wagmi generate')
  child_process.execSync(`yarn wagmi generate`, { stdio: 'inherit' })

  log('Compiling esm')
  child_process.execSync(`yarn tsc -b ${path.join(ABIS_PACKAGE_SRC_DIR, 'tsconfig.json')}`, {
    stdio: 'inherit',
  })

  log('Compiling cjs')
  child_process.execSync(`yarn tsc -b ${path.join(ABIS_PACKAGE_SRC_DIR, 'tsconfig-cjs.json')}`, {
    stdio: 'inherit',
  })

  log('Compiling declarations')
  child_process.execSync(`yarn tsc -b ${path.join(ABIS_PACKAGE_SRC_DIR, 'tsconfig-types.json')}`, {
    stdio: 'inherit',
  })

  exports = {
    ...exports,
    ...prepareTargetTypesExports(),
  }

  // Change the packages version to what CI is providing from environment variables
  prepareAbisPackageJson(exports)
  prepareContractsPackageJson()
} finally {
  // Cleanup
  log('Cleaning up folders and checking out dirty git files')
  rmrfSync(`rm -rf ${ABIS_BUILD_DIR}/contracts*`)
  rmrfSync(`rm -rf ${ABIS_BUILD_DIR}/truffle*`)
  child_process.execSync(`git checkout ${TSCONFIG_PATH}`, { stdio: 'inherit' })
}

// Helper functions
function prepareTargetTypesExports() {
  const exports = {}
  const targets = [BuildTarget.ESM, BuildTarget.CJS, BuildTarget.TYPES]

  targets.forEach((target) => {
    // We don't need package.json for type declarations
    if (target != BuildTarget.TYPES) {
      // fs.copyFileSync(
      //   path.join(ABIS_PACKAGE_SRC_DIR, `package-${target}.json`),
      //   path.join(ABIS_DIST_DIR, target, 'package.json')
      // )
    }

    const filePaths = lsRecursive(path.join(ABIS_DIST_DIR, target))
    filePaths.forEach((filePath) => {
      const parsedPath = path.parse(filePath)

      // Remove the .d from the name -- only for types types no harm otherwise
      const parsedPathName = parsedPath.name.replace('.d', '')
      if (PublishContracts.includes(parsedPathName)) {
        const relativePath = path.join(
          path.relative(ABIS_PACKAGE_SRC_DIR, parsedPath.dir),
          parsedPathName
        )
        const exportKey = `./${path.join(
          path.relative(path.join(ABIS_DIST_DIR, target), parsedPath.dir),
          parsedPathName
        )}`

        if (!exports.hasOwnProperty(exportKey)) {
          exports[exportKey] = {}
        }

        if (target === BuildTarget.ESM) {
          const importPath = `./${relativePath}.js`

          expectFileExists(importPath)

          exports[exportKey] = {
            ...exports[exportKey],
            import: importPath,
          }
        } else if (target === BuildTarget.CJS) {
          const requirePath = `./${relativePath}.js`

          expectFileExists(requirePath)

          exports[exportKey] = {
            ...exports[exportKey],
            require: requirePath,
          }
        } else {
          // types
          const typesPath = `./${relativePath}.d.ts`

          expectFileExists(typesPath)

          exports[exportKey] = {
            ...exports[exportKey],
            types: typesPath,
          }
        }
      }
    })
  })

  return exports
}

function expectFileExists(relativePath: string) {
  if (!fs.existsSync(path.join(ABIS_PACKAGE_SRC_DIR, relativePath))) {
    throw new Error(`Expected file ${relativePath} to exist`)
  }
}

function processRawJsonsAndPrepareExports() {
  const exports = {}

  log('Removing extraneous fields from generated json files')
  const fileNames = fs.readdirSync(ABIS_BUILD_DIR)

  fileNames.forEach((fileName) => {
    const filePath = path.join(ABIS_BUILD_DIR, fileName)
    const parsedPath = path.parse(filePath)

    if (PublishContracts.includes(parsedPath.name)) {
      const json = JSON.parse(fs.readFileSync(filePath).toString())
      const defaultPath = path.join(
        path.relative(ABIS_PACKAGE_SRC_DIR, ABIS_DIST_DIR),
        `${parsedPath.name}.json`
      )

      fs.writeFileSync(
        path.join(ABIS_DIST_DIR, fileName),
        JSON.stringify(
          {
            contractName: json.contractName,
            abi: json.abi,
          },
          null,
          2
        )
      )

      expectFileExists(defaultPath)

      exports[`./${parsedPath.name}.json`] = {
        default: `./${defaultPath}`,
      }
    }
  })

  return exports
}

function prepareAbisPackageJson(exports) {
  log('Preparing @celo/abis package.json')
  const packageJsonPath = path.join(ABIS_PACKAGE_SRC_DIR, 'package.json')
  const json = JSON.parse(fs.readFileSync(packageJsonPath).toString())

  if (process.env.RELEASE_VERSION) {
    log('Replacing @celo/abis version with provided RELEASE_VERSION')

    json.version = process.env.RELEASE_VERSION
  } else {
    log('No RELEASE_VERSION provided')
  }

  log('Setting @celo/abis exports')
  json.exports = exports

  fs.writeFileSync(packageJsonPath, JSON.stringify(json, null, 2))
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
