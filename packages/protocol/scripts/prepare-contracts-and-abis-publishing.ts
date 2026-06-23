import { Exports, replacePackageVersionAndMakePublic } from '@celo/protocol/scripts/utils'
import * as child_process from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { sync as rmrfSync } from 'rimraf'
import { SOLIDITY_05_PACKAGE, SOLIDITY_08_PACKAGE } from '../contractPackages'
import {
  ABIS_BUILD_DIR,
  ABIS_DIST_DIR,
  ABIS_PACKAGE_SRC_DIR,
  AliasedContracts,
  BUILD_EXECUTABLE,
  BuildTarget,
  CONTRACTS_08_SOURCE_DIR,
  CONTRACTS_PACKAGE_SRC_DIR,
  CONTRACTS_PACKAGE_STAGING_DIR,
  PublishContracts,
  TSCONFIG_PATH,
} from './consts'

function log(...args: any[]) {
  // eslint-disable-next-line
  console.info('[prepare-contracts-and-abis]', ...args)
}

try {
  log('Setting package.json target to ES2020')
  const tsconfig = JSON.parse(fs.readFileSync(TSCONFIG_PATH, 'utf8'))
  tsconfig.compilerOptions.target = 'ES2020'
  fs.writeFileSync(TSCONFIG_PATH, JSON.stringify(tsconfig, null, 4))

  // Start from scratch
  rmrfSync([ABIS_BUILD_DIR, ABIS_DIST_DIR, CONTRACTS_PACKAGE_STAGING_DIR])
  fs.mkdirSync(ABIS_BUILD_DIR, { recursive: true })
  fs.mkdirSync(ABIS_DIST_DIR, { recursive: true })

  // Generate all ABIs
  build(`--solidity ${path.join(ABIS_BUILD_DIR)}`)

  // Generate web3 typings
  build(`--web3Types ${path.join(ABIS_BUILD_DIR, 'web3')}`)

  // Merge per-package subfolders at the root of the build dir
  log('Merging files at the root of the build dir')
  mergeFromFolder(
    [SOLIDITY_05_PACKAGE.destDir, SOLIDITY_08_PACKAGE.destDir],
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

  // Generate ts abi files
  log('Running yarn wagmi generate')
  child_process.execSync(`yarn wagmi generate`, { stdio: 'inherit' })

  // must be after wagmi gen but before compiling
  createIndex()

  log('Compiling esm')
  child_process.execSync(`yarn tsc -b ${path.join(ABIS_PACKAGE_SRC_DIR, 'tsconfig-esm.json')}`, {
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
    '.': {
      import: './dist/esm/index.js',
      require: './dist/cjs/index.js',
      types: './dist/types/index.d.ts',
    },
    ...exports,
    ...prepareTargetTypesExports(),
  }

  // Change the packages version to what CI is providing from environment variables
  prepareAbisPackageJson(exports)
  prepareContractsPackage()
} finally {
  // Cleanup
  log('Cleaning up folders and checking out dirty git files')
  rmrfSync(`rm -rf ${ABIS_BUILD_DIR}/contracts*`)
  child_process.execSync(`git checkout ${TSCONFIG_PATH}`, { stdio: 'inherit' })
}

function createIndex() {
  const reExports = PublishContracts.filter((contractName) => {
    return fs.existsSync(path.join(ABIS_BUILD_DIR, `${contractName}.ts`))
  }).map((contractName) => {
    console.info(`Re-exporting ${contractName}`)
    return `export * from './${contractName}.js'`
  })

  fs.writeFileSync(path.join(ABIS_BUILD_DIR, 'index.ts'), reExports.join('\n'))
}

// Helper functions
function prepareTargetTypesExports() {
  const exports: Exports = {}
  const targets = [BuildTarget.ESM, BuildTarget.CJS, BuildTarget.TYPES]

  targets.forEach((target) => {
    // We don't need package.json for type declarations
    if (target !== BuildTarget.TYPES) {
      fs.copyFileSync(
        path.join(ABIS_PACKAGE_SRC_DIR, `package-${target}.json`),
        path.join(ABIS_DIST_DIR, target, 'package.json')
      )
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
        const defaultExportKey = toExportKey(parsedPathName)

        const exportKeys = [defaultExportKey]

        // sometimes we want files to be exports via 2 keys like LockedGold and LockeCelo
        // so place it in the AliasedContracts object and will be exported like
        // "./LockedGold": { default: "./LockedGold.json", types: "./LockedGold.d.ts" }
        // "./LockedCelo": { default: "./LockedGold.json", types: "./LockedGold.d.ts" }
        if (typeof AliasedContracts[parsedPathName] === 'string') {
          const aliasKey = toExportKey(AliasedContracts[parsedPathName] as string)
          exportKeys.push(aliasKey)
        }
        for (const exportKey of exportKeys) {
          // eslint-disable-next-line no-prototype-builtins
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
      }

      function toExportKey(name: string) {
        return `./${path.join(
          path.relative(path.join(ABIS_DIST_DIR, target), parsedPath.dir),
          name
        )}`
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
  const exports: Exports = {}

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

      const getJsonKey = (name: string) => `./${name}.json`

      const makeDefaultExportValue = (value: string) => ({
        default: `./${value}`,
      })

      exports[getJsonKey(parsedPath.name)] = makeDefaultExportValue(defaultPath)

      if (AliasedContracts[parsedPath.name] !== undefined) {
        exports[getJsonKey(AliasedContracts[parsedPath.name] as string)] =
          makeDefaultExportValue(defaultPath)
      }
    }
  })

  return exports
}

function prepareAbisPackageJson(exports: Exports) {
  log('Preparing @celo/abis package.json')
  const packageJsonPath = path.join(ABIS_PACKAGE_SRC_DIR, 'package.json')

  // Always prepare the manifest; replacePackageVersionAndMakePublic sets the real
  // RELEASE_VERSION or a dry-run placeholder so `npm publish --dry-run` stays valid.
  replacePackageVersionAndMakePublic(packageJsonPath, (json) => {
    log('Setting @celo/abis exports')
    json.exports = exports
  })
}

function prepareContractsPackage() {
  // Assemble the staging dir from the source trees. We never mutate
  // CONTRACTS_PACKAGE_SRC_DIR or CONTRACTS_08_SOURCE_DIR — the published
  // tarball is built entirely under CONTRACTS_PACKAGE_STAGING_DIR.
  fs.mkdirSync(CONTRACTS_PACKAGE_STAGING_DIR, { recursive: true })
  const copies = [
    // 0.5 contents land at the staging root (matches existing npm layout)
    { src: `${CONTRACTS_PACKAGE_SRC_DIR}/.`, dest: `${CONTRACTS_PACKAGE_STAGING_DIR}/` },
    // 0.8 contracts land under staging/0.8/
    { src: CONTRACTS_08_SOURCE_DIR, dest: path.join(CONTRACTS_PACKAGE_STAGING_DIR, '0.8') },
  ]
  for (const { src, dest } of copies) {
    const cmd = `cp -R ${src} ${dest}`
    log(cmd)
    child_process.execSync(cmd)
  }

  // Always prepare the manifest; replacePackageVersionAndMakePublic sets the real
  // RELEASE_VERSION or a dry-run placeholder so `npm publish --dry-run` stays valid.
  const packageJsonPath = path.join(CONTRACTS_PACKAGE_STAGING_DIR, 'package.json')
  replacePackageVersionAndMakePublic(packageJsonPath)
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
  // --preferTsExts: stale compiled .js files live alongside .ts in scripts/.
  // Without this flag ts-node resolves `./consts` to the stale consts.js.
  child_process.execSync(`BUILD_DIR=./build ts-node --preferTsExts ${BUILD_EXECUTABLE} ${cmd}`, {
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
