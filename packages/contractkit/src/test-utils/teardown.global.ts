import teardown from '@celo/dev-utils/lib/ganache-teardown'
// @ts-ignore
import flakeTrackerTeardown from '@celo/flake-tracker/src/jest/teardown.global.js'

export default async function globalTeardown() {
  await flakeTrackerTeardown()
  await teardown()
}
