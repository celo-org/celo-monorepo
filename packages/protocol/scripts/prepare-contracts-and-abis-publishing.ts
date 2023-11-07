import * as child_process from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { sync as rmrfSync } from 'rimraf'

const ROOT_DIR = path.join(__dirname, '../')
const SRC_DIR = path.join(__dirname, '../contracts')
const BUILD_DIR = path.join(__dirname, '../build/contracts')
const TYPES_DIR = path.join(BUILD_DIR, 'types')
const BUILD_EXECUTABLE = path.join(__dirname, 'build.ts')
const TSCONFIG_PATH = path.join(ROOT_DIR, 'tsconfig.json')

const tsconfig = JSON.parse(fs.readFileSync(TSCONFIG_PATH, 'utf8'))
tsconfig.compilerOptions.target = 'ES2020'
fs.writeFileSync(TSCONFIG_PATH, JSON.stringify(tsconfig, null, 4))

rmrfSync(TYPES_DIR)
rmrfSync(path.join(BUILD_DIR, 'package.json'))
rmrfSync(path.join(BUILD_DIR, 'README.md'))
fs.mkdirSync(TYPES_DIR, { recursive: true })

const allFiles = lsRecursive(SRC_DIR)

child_process.execSync(
  `ts-node ${BUILD_EXECUTABLE} --ethersTypes ${path.join(TYPES_DIR, 'ethers')}`,
  { stdio: 'inherit' }
)
child_process.execSync(`ts-node ${BUILD_EXECUTABLE} --web3Types ${path.join(TYPES_DIR, 'web3')}`, {
  stdio: 'inherit',
})
child_process.execSync(
  `ts-node ${BUILD_EXECUTABLE} --truffleTypes ${path.join(TYPES_DIR, 'truffle')}`,
  { stdio: 'inherit' }
)

allFiles.forEach((filePath) => {
  const name = path.basename(filePath)
  if (filePath.includes('/test/') || name.startsWith('Mock')) {
    rmrfSync(path.join(BUILD_DIR, name.replace('sol', 'json')))
    rmrfSync(path.join(TYPES_DIR, 'ethers', name.replace('sol', '.d.ts')))
    rmrfSync(path.join(TYPES_DIR, 'web3', name.replace('sol', '.ts')))
  }
})

child_process.execSync(`node --version`, { stdio: 'inherit' })
child_process.execSync(`yarn wagmi generate`, { stdio: 'inherit' })

const packageJsons = [path.join(SRC_DIR, 'package.abis.json'), path.join(SRC_DIR, 'package.json')]

packageJsons.forEach((packageJsonPath) => {
  const file = fs.readFileSync(packageJsonPath).toString()

  if (process.env.RELEASE_VERSION) {
    fs.writeFileSync(
      packageJsonPath,
      file.replace('0.0.0-template.version', process.env.RELEASE_VERSION)
    )
  }
})

fs.copyFileSync(path.join(SRC_DIR, 'package.abis.json'), path.join(BUILD_DIR, 'package.json'))
fs.copyFileSync(path.join(SRC_DIR, 'README.abis.md'), path.join(BUILD_DIR, 'README.md'))

child_process.execSync(`git checkout ${TSCONFIG_PATH}`, { stdio: 'inherit' })

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
