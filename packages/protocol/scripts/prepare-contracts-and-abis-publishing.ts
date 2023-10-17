import * as child_process from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import rimraf from 'rimraf'

const SRC_DIR = path.join(__dirname, '../contracts')
const BUILD_DIR = path.join(__dirname, '../build/contracts')
const TYPES_DIR = path.join(BUILD_DIR, 'types')
const BUILD_EXECUTABLE = path.join(__dirname, 'build.ts')

rimraf.sync(TYPES_DIR)
rimraf.sync(path.join(BUILD_DIR, 'package.json'))
rimraf.sync(path.join(BUILD_DIR, 'README.md'))
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
    rimraf.sync(path.join(BUILD_DIR, name.replace('sol', 'json')))
    rimraf.sync(path.join(TYPES_DIR, 'ethers', name.replace('sol', '.d.ts')))
    rimraf.sync(path.join(TYPES_DIR, 'web3', name.replace('sol', '.ts')))
  }
})

child_process.execSync(`yarn wagmi generate`, { stdio: 'inherit' })

const packageJsons = [path.join(SRC_DIR, 'package.abis.json'), path.join(SRC_DIR, 'package.json')]

packageJsons.forEach((packageJsonPath) => {
  const file = fs.readFileSync(packageJsonPath).toString()

  fs.writeFileSync(
    packageJsonPath,
    file.replace('0.0.0-template.version', process.env.RELEASE_VERSION)
  )
})

fs.copyFileSync(path.join(SRC_DIR, 'package.abis.json'), path.join(BUILD_DIR, 'package.json'))
fs.copyFileSync(path.join(SRC_DIR, 'README.abis.md'), path.join(BUILD_DIR, 'README.md'))

function lsRecursive(dir: string): string[] {
  const filesAndDirectories = fs.readdirSync(dir, { withFileTypes: true })
  return filesAndDirectories.reduce((fileNames, fileOrDir) => {
    const filePath = path.join(dir, fileOrDir.name)
    if (fileOrDir.isDirectory()) {
      return fileNames.concat(lsRecursive(filePath))
    }
    return fileNames.concat([filePath])
  }, [])
}
