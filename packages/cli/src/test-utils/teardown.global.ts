import teardown from '@celo/dev-utils/lib/ganache-teardown'

export default async function globalTeardown() {
  await teardown()
}
