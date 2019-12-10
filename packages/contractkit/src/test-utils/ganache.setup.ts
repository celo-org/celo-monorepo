import baseSetup from '@celo/dev-utils/lib/ganache-setup'
// Has to import the matchers somewhere so that typescript knows the matchers have been made available
import _unused from '@celo/dev-utils/lib/matchers'
import * as path from 'path'

async function sleep(seconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000)
  })
}

export default async function setup() {
  console.log('\nstarting ganache...')
  await baseSetup(path.resolve(path.join(__dirname, '../../.devchain')))
  await sleep(10)
  console.log('...ganache started')
}
