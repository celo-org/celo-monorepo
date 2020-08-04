import baseSetup from '@celo/dev-utils/lib/ganache-setup'
// Has to import the matchers somewhere so that typescript knows the matchers have been made available
import _unused from '@celo/dev-utils/lib/matchers'
import { waitForPortOpen } from '@celo/dev-utils/lib/network'
// @ts-ignore
import flakeTrackerSetup from '@celo/flake-tracker/src/jest/setup.global'
import * as path from 'path'

// Warning: There should be an unused import of '@celo/dev-utils/lib/matchers' above.
// If there is not, then your editor probably deleted it automatically.

export default async function globalSetup() {
  await flakeTrackerSetup()
  console.log('\nstarting ganache...')
  await baseSetup(path.resolve(path.join(__dirname, '../..')), '.tmp/devchain.tar.gz', {
    from_targz: true,
  })
  await waitForPortOpen('localhost', 8545, 60)
  console.log('...ganache started')
}
