import teardown from '@celo/dev-utils/lib/ganache-teardown'

const USE_GANACHE = process.env.NO_GANACHE?.toLowerCase() !== 'true'

export default async function globalTeardown() {
  if (USE_GANACHE) {
    await teardown()
  }
}
