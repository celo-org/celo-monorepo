import baseSetup from '@celo/dev-utils/lib/ganache-setup'
// Has to import the matchers somewhere so that typescript knows the matchers have been made available
import _unused from '@celo/dev-utils/lib/matchers'
// @ts-ignore
import flakeTrackerSetup from '@celo/flake-tracker/src/jest/setup.global.js'
import * as path from 'path'

// Warning: There should be an unused import of '@celo/dev-utils/lib/matchers' above.
// If there is not, then your editor probably deleted it automatically.

const devchain = process.env.DEVCHAIN_DATADIR ?? '.tmp/devchain.tar.gz'

export default async function globalSetup() {
  await flakeTrackerSetup()
  await baseSetup(path.resolve(path.join(__dirname, '../../')), devchain, {
    from_targz: devchain.endsWith('.tar.gz'),
  })
}
