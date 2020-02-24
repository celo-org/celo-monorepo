import baseSetup from '@celo/dev-utils/lib/ganache-setup'
// Has to import the matchers somewhere so that typescript knows the matchers have been made available
import _unused from '@celo/dev-utils/lib/matchers'
import { waitForPortOpen } from '@celo/dev-utils/lib/network'
import * as path from 'path'

export default async function setup() {
  console.log('\nstarting ganache...')
  await baseSetup(path.resolve(path.join(__dirname, '../..')), '.tmp/devchain.tar.gz', {
    from_targz: true,
  })
  await waitForPortOpen('localhost', 8545, 60)
  console.log('...ganache started')
}
