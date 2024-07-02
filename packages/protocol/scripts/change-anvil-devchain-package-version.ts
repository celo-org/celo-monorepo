import { replacePackageVersionAndMakePublic } from '@celo/protocol/scripts/utils'
import * as fs from 'fs'
import * as path from 'path'
import { DEVCHAIN_ANVIL_PACKAGE_SRC_DIR, TSCONFIG_PATH } from './consts'

function log(...args: any[]) {
  // eslint-disable-next-line
  console.info('[prepare-devchain-anvil]', ...args)
}

try {
  log('Setting package.json target to ES2020')
  const tsconfig = JSON.parse(fs.readFileSync(TSCONFIG_PATH, 'utf8'))
  tsconfig.compilerOptions.target = 'ES2020'
  fs.writeFileSync(TSCONFIG_PATH, JSON.stringify(tsconfig, null, 4))

  prepareAnvilDevchainPackage()
} finally {
  // Cleanup
  log('Cleaning up')
}

function prepareAnvilDevchainPackage() {
  if (process.env.RELEASE_VERSION) {
    log('Replacing @celo/contracts version with RELEASE_VERSION)')

    const packageJsonPath = path.join(DEVCHAIN_ANVIL_PACKAGE_SRC_DIR, 'package.json')
    replacePackageVersionAndMakePublic(packageJsonPath)

    return
  }

  log('Skipping @celo/devchain-anvil package.json preparation (no RELEASE_VERSION provided)')
}
