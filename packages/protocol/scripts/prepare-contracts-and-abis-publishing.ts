import * as child_process from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { sync as rmrfSync } from 'rimraf'
import { CoreContracts } from './build'

const ROOT_DIR = path.join(__dirname, '../')
const SRC_DIR = path.join(__dirname, '../contracts')
const PACKAGE_SRC_DIR = path.join(__dirname, '../abis')
const PACKAGE_DIR = path.join(__dirname, '../build/abis')
const BUILD_DIR = path.join(PACKAGE_DIR, 'src')
const BUILD_08_DIR = path.join(__dirname, '../build/contracts-0.8')
const BUILD_EXECUTABLE = path.join(__dirname, 'build.ts')
const TSCONFIG_PATH = path.join(ROOT_DIR, 'tsconfig.json')

const tsconfig = JSON.parse(fs.readFileSync(TSCONFIG_PATH, 'utf8'))
tsconfig.compilerOptions.target = 'ES2020'
fs.writeFileSync(TSCONFIG_PATH, JSON.stringify(tsconfig, null, 4))

// Start from scratch
rmrfSync(path.join(BUILD_DIR, 'package.json'))
rmrfSync(path.join(BUILD_DIR, 'README.md'))
fs.mkdirSync(BUILD_DIR, { recursive: true })

// Generate all ABIs
child_process.execSync(
  `BUILD_DIR=./build/abis/src ts-node ${BUILD_EXECUTABLE} --coreContractsOnly --solidity ${path.join(
    BUILD_DIR
  )}`,
  { stdio: 'inherit' }
)

// Generate ethers typings
child_process.execSync(
  `BUILD_DIR=./build/abis/src ts-node ${BUILD_EXECUTABLE} --coreContractsOnly --ethersTypes ${path.join(
    BUILD_DIR,
    'ethers'
  )}`
)

// Generate web3 typings
child_process.execSync(
  `BUILD_DIR=./build/abis/src ts-node ${BUILD_EXECUTABLE} --coreContractsOnly --web3Types ${path.join(
    BUILD_DIR,
    'web3'
  )}`,
  {
    stdio: 'inherit',
  }
)

// Merge contracts-0.8, contracts-mento, etc.. at the root of the build dir
child_process.execSync(`cp ${BUILD_DIR}/contracts*/* ${BUILD_DIR}`)

// Remove Mocks, tests, extraenous files
const allFiles = lsRecursive(BUILD_DIR)
allFiles.forEach((filePath) => {
  const name = path.basename(filePath)
  const baseName = name.replace(/.(sol|d.ts|json)$/, '')

  if (baseName !== 'index' && !CoreContracts.includes(baseName)) {
    rmrfSync(path.join(BUILD_DIR, `${baseName}.json`))
    rmrfSync(path.join(BUILD_DIR, `${baseName}.ts`))
    rmrfSync(path.join(BUILD_DIR, '**', `${baseName}.d.ts`))
    rmrfSync(path.join(BUILD_DIR, '**', `${baseName}.ts`))
  }
})

// Generate wagmi friendly ts files
child_process.execSync(`yarn wagmi generate`, { stdio: 'inherit' })

// Generate an index.ts to be esm friendly
fs.writeFileSync(
  path.join(BUILD_DIR, 'index.ts'),
  [...new Set(CoreContracts)]
    .map((contract) => {
      return `export * as ${contract} from './${contract}';`
    })
    .join('\n')
)

// Generate the js folder to be published from ts files
child_process.execSync(`yarn tsc -b ${path.join(PACKAGE_SRC_DIR, 'tsconfig.json')}`, {
  stdio: 'inherit',
})
child_process.execSync(`yarn tsc -b ${path.join(PACKAGE_SRC_DIR, 'tsconfig-cjs.json')}`, {
  stdio: 'inherit',
})

// Change the packages version to what CI is providing from environment variables
const packageJsons = [
  path.join(SRC_DIR, 'package.json'),
  path.join(PACKAGE_SRC_DIR, 'package.json'),
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

// Copy over the package.json and README into the build
fs.copyFileSync(path.join(PACKAGE_SRC_DIR, 'package.json'), path.join(PACKAGE_DIR, 'package.json'))
fs.copyFileSync(path.join(PACKAGE_SRC_DIR, 'README.md'), path.join(PACKAGE_DIR, 'README.md'))

// Cleanup
rmrfSync(`rm -rf ${BUILD_DIR}/contracts*`)
rmrfSync(`rm -rf ${BUILD_DIR}/truffle*`)
child_process.execSync(`git checkout ${TSCONFIG_PATH}`, { stdio: 'inherit' })

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
