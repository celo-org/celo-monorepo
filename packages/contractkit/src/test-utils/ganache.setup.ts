import baseSetup from '@celo/dev-utils/lib/ganache-setup'
import * as path from 'path'

export default function setup() {
  return baseSetup(path.resolve(path.join(__dirname, '../../.devchain')))
}
