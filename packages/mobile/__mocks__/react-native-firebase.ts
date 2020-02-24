const createShortDynamicLink = jest.fn()

function links() {
  return {
    createShortDynamicLink,
  }
}

links.DynamicLink = jest.fn(() => ({
  android: {
    setFallbackUrl: jest.fn(),
    setPackageName: jest.fn(),
  },
  ios: {
    setFallbackUrl: jest.fn(),
    setBundleId: jest.fn(),
  },
}))

export default {
  links,
}
