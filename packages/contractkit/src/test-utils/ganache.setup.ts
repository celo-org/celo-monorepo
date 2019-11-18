import baseSetup from '@celo/dev-utils/lib/ganache-setup'
import * as path from 'path'
// Has to import the matchers somewhere so that typescript knows the matchers have been made available
import _unused from '@celo/dev-utils/lib/matchers'

export default function setup() {
  return baseSetup(path.resolve(path.join(__dirname, '../../.devchain')))
}
