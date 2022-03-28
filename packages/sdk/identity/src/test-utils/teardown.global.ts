import teardown from '@celo/dev-utils/lib/ganache-teardown'
// @ts-ignore
import flakeTrackerTeardown from '@celo/flake-tracker/src/jest/teardown.global.js'

const USE_GANACHE = process.env.NO_GANACHE?.toLowerCase() !== 'true'

export default async function globalTeardown() {
  await flakeTrackerTeardown()
  if (USE_GANACHE) {
    await teardown()
  }
}
