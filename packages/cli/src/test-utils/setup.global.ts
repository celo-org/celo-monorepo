import baseSetup from '@celo/dev-utils/lib/ganache-setup'
// Has to import the matchers somewhere so that typescript knows the matchers have been made available
import _unused from '@celo/dev-utils/lib/matchers'
import * as path from 'path'
// @ts-ignore
import flakeTrackerSetup from '../../../../flakey-test-tracking/jest/setup.global.js'

export default async function globalSetup() {
  await flakeTrackerSetup()
  await baseSetup(path.resolve(path.join(__dirname, '../../')), '.tmp/devchain.tar.gz', {
    from_targz: true,
  })
}
