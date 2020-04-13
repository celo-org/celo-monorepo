const createShortDynamicLink = jest.fn()
const getInitialLink = jest.fn()

function links() {
  return {
    createShortDynamicLink,
    getInitialLink,
  }
}

links.DynamicLink = jest.fn(() => ({
  android: {
    setPackageName: jest.fn(),
  },
  ios: {
    setAppStoreId: jest.fn(),
    setBundleId: jest.fn(),
  },
}))

export default {
  links,
}
