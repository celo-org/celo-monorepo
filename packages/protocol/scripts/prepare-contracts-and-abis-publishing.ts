import * as child_process from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import rimraf from 'rimraf'
import { version } from '../package.json'

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
    console.log('deleting', name)
    rimraf.sync(path.join(BUILD_DIR, name.replace('sol', 'json')))
    rimraf.sync(path.join(TYPES_DIR, 'ethers', name.replace('sol', '.d.ts')))
    rimraf.sync(path.join(TYPES_DIR, 'web3', name.replace('sol', '.ts')))
  }
})

child_process.execSync(`yarn wagmi generate`, { stdio: 'inherit' })

fs.copyFileSync(path.join(SRC_DIR, 'package.abis.json'), path.join(BUILD_DIR, 'package.json'))
fs.copyFileSync(path.join(SRC_DIR, 'README.abis.md'), path.join(BUILD_DIR, 'README.md'))

if (process.env.RELEASE_TYPE === 'release') {
  process.env.RELEASE_ABIS_VERSION = version
} else {
  const latestRelease = child_process.execSync(`npm view @celo/contracts version`)
  console.log(latestRelease.toString())
  process.env.RELEASE_ABIS_VERSION = latestRelease.toString()
}

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

/*
❯ du -h build/contracts/
  0B	build/contracts//types
 62M	build/contracts/

 */
