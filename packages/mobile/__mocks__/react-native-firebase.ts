let toFail = false

function links() {
  return {
    createShortDynamicLink: jest.fn(async () => {
      if (toFail) {
        throw new Error('test error')
      }
      return 'shortLink'
    }),
  }
}

links.DynamicLink = jest.fn(() => ({
  android: {
    setFallbackUrl: jest.fn(),
    setPackageName: jest.fn(),
  },
  ios: {
    setFallbackUrl: jest.fn(),
    setBundleId: jest.fn((bundleId) => {
      if (!bundleId) {
        toFail = true
      }
    }),
  },
}))
export default {
  links,
}
