class WalletAnalytics {
  track = jest.fn((event: string) => {
    console.log('Track event', event)
  })
  page = jest.fn((page: string, eventProperties: {}) => {
    console.log('Page', page, eventProperties)
  })
}

export default new WalletAnalytics()
