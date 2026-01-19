import { instantiateArtifactsFromForge } from '@celo/protocol/lib/compatibility/utils'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const recompileThresholdTime = 1000 * 60 * 60 * 24 // One day

const ROOT_DIR = path.normalize(path.join(__dirname, '../../'))

export function getTestArtifacts(caseName: string) {
  const base = 'test-ts/resources/compatibility'
  const srcDirectory = `${base}/contracts_${caseName}`
  // Forge take a path relative to the config
  const forgeBuildDirectory = `build/out_${caseName}`
  const buildDirectory = `${base}/${forgeBuildDirectory}`
  const configPath = `${base}/foundry.toml`

  if (needsCompiling(srcDirectory, buildDirectory)) {
    exec(`rm -rf ${buildDirectory}`)

    exec(
      `forge build --config-path "${configPath}" --out "${forgeBuildDirectory}" --ast ${srcDirectory}`
    )
  }
  return instantiateArtifactsFromForge(`${buildDirectory}`)
}

function exec(cmd: string) {
  return execSync(cmd, { cwd: ROOT_DIR, stdio: 'inherit' })
}

// Return the latest modification time of a file in the given directory
function getLatestUpdateTime(dir: string) {
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
