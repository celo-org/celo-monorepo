import baseSetup from '@celo/dev-utils/lib/ganache-setup'
import { waitForPortOpen } from '@celo/dev-utils/lib/network'
import * as path from 'path'

export default async function setup() {
  // tslint:disable:no-console
  console.log('\nstarting ganache...')
  await baseSetup(path.resolve(path.join(__dirname, '../..')), '.tmp/devchain.tar.gz', {
    from_targz: true,
  })
  await waitForPortOpen('localhost', 8545, 60)
  // tslint:disable:no-console
  console.log('...ganache started')
}
