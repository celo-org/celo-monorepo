import { getBuildArtifacts } from '@openzeppelin/upgrades'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

// Measured in millis
const recompileThresholdTime = 1000 * 60 * 60 * 24 // One day

const ROOT_DIR = path.normalize(path.join(__dirname, '../../'))

function exec(cmd: string) {
  return execSync(cmd, { cwd: ROOT_DIR, stdio: 'inherit' })
}

// Return the latest modification time of a file in the given directory
function getLatestUpdateTime(dir) {
  if (!fs.existsSync(dir)) {
    return 0
  }
  const stat = fs.statSync(dir)
  if (!stat.isDirectory) {
    throw new Error(`Expected ${dir} to be a directory`)
  }
  return Math.max(...fs.readdirSync(dir).map((f) => fs.statSync(`${dir}/${f}`).mtimeMs))
}

function needsCompiling(src: string, build: string): boolean {
  const srcTime = getLatestUpdateTime(src)
  const buildTime = getLatestUpdateTime(build)
  if (buildTime === 0) {
    // Build folder is not present
    return true
  }
  if (srcTime > buildTime) {
    // Source was updated
    return true
  }
  if (Date.now() - buildTime > recompileThresholdTime) {
    // Build is too old
    return true
  }
  return false
}

export function getTestArtifacts(caseName: string) {
  const back = './test/resources/compatibility'
  const srcDirectory = `${back}/contracts_${caseName}`
  const buildDirectory = `${back}/build/b_${caseName}`

  if (needsCompiling(srcDirectory, buildDirectory)) {
    // We force all contracts compiled from the same source folder
    // To minimize differences in the artifact files
    const tmpSrcDirectory = `${back}/build/src`
    // Clean folders
    exec(`rm -rf ${tmpSrcDirectory}`)
    exec(`rm -rf ${buildDirectory}`)
    exec(`mkdir -p ./${tmpSrcDirectory}`)
    // Copy the contracts source code to the src folder
    exec(`cp -r ./${srcDirectory}/* ./${tmpSrcDirectory}`)

    exec(
      `yarn run --silent truffle compile --all --contracts_directory=${tmpSrcDirectory} --contracts_build_directory=${buildDirectory}`
    )
  }
  return getBuildArtifacts(`${buildDirectory}`)
}
