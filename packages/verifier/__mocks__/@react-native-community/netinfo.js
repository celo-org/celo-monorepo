export default {
  getCurrentConnectivity: jest.fn(),
  isConnectionMetered: jest.fn(),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
  isConnected: {
    fetch: () => {
      return Promise.resolve(true)
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
}
